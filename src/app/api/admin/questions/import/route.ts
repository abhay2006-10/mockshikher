import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recalculateMockStats } from '@/lib/mock-resolver';
import {
  parseImportFile,
  validateImportRows,
  generateErrorReportCsv,
  ImportRow,
} from '@/lib/question-importer';
import { recordAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mode = (formData.get('mode') as string) || 'preview'; // 'preview' or 'execute'
    const createMissingMockTests = formData.get('createMissingMockTests') === 'true' || formData.get('createMissingMockTests') === '1';
    const createMissingSubjects = formData.get('createMissingSubjects') === 'true' || formData.get('createMissingSubjects') === '1';
    const replaceAllQuestions = formData.get('replaceAllQuestions') === 'true' || formData.get('replaceAllQuestions') === '1';
    const rawRowsJson = formData.get('rows') as string | null;

    let rows: ImportRow[] = [];

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      rows = parseImportFile(buffer, file.name);
    } else if (rawRowsJson) {
      rows = JSON.parse(rawRowsJson);
    } else {
      return NextResponse.json(
        { error: 'No CSV/XLSX file or rows payload provided.' },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or could not be parsed. Please check template formatting.' },
        { status: 400 }
      );
    }

    // 1. Gather database context for validation
    const dbExams = await prisma.exam.findMany({
      include: {
        mockTests: { select: { id: true, testNumber: true } },
        subjects: { select: { id: true, name: true } },
      },
    });

    const existingExams = new Set(dbExams.map((e) => e.slug.toLowerCase()));
    const existingMockNumbers = new Map<string, Set<number>>();
    const existingExamSubjects = new Map<string, Set<string>>();

    dbExams.forEach((e) => {
      existingMockNumbers.set(
        e.slug.toLowerCase(),
        new Set(e.mockTests.map((m) => m.testNumber))
      );
      existingExamSubjects.set(
        e.slug.toLowerCase(),
        new Set(e.subjects.map((s) => s.name.toLowerCase().trim()))
      );
    });

    // 2. Run deep validation
    const validation = validateImportRows(rows, new Set(), {
      createMissingMockTests,
      createMissingSubjects,
      existingExams,
      existingMockNumbers,
      existingExamSubjects,
    });

    // If PREVIEW MODE: return summary, row-level errors, preview rows
    if (mode === 'preview') {
      const errorReportCsv = validation.invalidRows > 0 ? generateErrorReportCsv(validation.results) : null;
      return NextResponse.json({
        summary: {
          totalRows: validation.totalRows,
          validRows: validation.validRows,
          invalidRows: validation.invalidRows,
          duplicateRows: validation.duplicateRows,
        },
        rowErrors: validation.rowErrors,
        preview: validation.results.slice(0, 100).map((r) => ({
          rowNumber: r.rowNumber,
          isValid: r.isValid,
          errors: r.errors,
          warnings: r.warnings,
          exam: r.data.exam,
          mock_test_number: r.data.mock_test_number,
          question: r.data.question || r.data.hindi_question,
          subject: r.data.subject,
          correct_answer: r.data.correct_answer,
          difficulty: r.data.difficulty,
          marks: r.data.marks,
          negative_marks: r.data.negative_marks,
        })),
        errorReportCsv,
      });
    }

    // ==========================================
    // EXECUTE MODE
    // ==========================================
    const validRowsToImport = validation.results
      .filter((r) => r.isValid)
      .map((r) => r.data);

    if (validRowsToImport.length === 0) {
      return NextResponse.json(
        {
          error: `Validation failed: 0 valid rows out of ${validation.totalRows}. Please fix the row errors before importing.`,
          rowErrors: validation.rowErrors,
        },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = validation.invalidRows;
    const affectedMockTestIds = new Set<string>();

    // 1. Group rows by Exam and Mock Test Number
    const groupedByExamAndMock = new Map<string, ImportRow[]>();
    for (const row of validRowsToImport) {
      const examSlug = (row.exam || 'hp-patwari').toLowerCase().trim();
      const testNum = Number(row.mock_test_number) || 1;
      const key = `${examSlug}:::${testNum}`;
      if (!groupedByExamAndMock.has(key)) {
        groupedByExamAndMock.set(key, []);
      }
      groupedByExamAndMock.get(key)!.push(row);
    }

    // 2. Process each Exam and Mock Test Group
    for (const [key, groupRows] of groupedByExamAndMock.entries()) {
      const [examSlug, testNumStr] = key.split(':::');
      const testNum = parseInt(testNumStr, 10);

      // A. Resolve or create Exam
      let exam = await prisma.exam.findUnique({
        where: { slug: examSlug },
      });

      if (!exam) {
        return NextResponse.json(
          { error: `Exam "${examSlug}" does not exist in the database.` },
          { status: 400 }
        );
      }

      // B. Resolve or create Mock Test
      let mockTest = await prisma.mockTest.findUnique({
        where: {
          examId_testNumber: {
            examId: exam.id,
            testNumber: testNum,
          },
        },
        include: {
          _count: { select: { attempts: true } },
        },
      });

      if (!mockTest) {
        if (!createMissingMockTests) {
          return NextResponse.json(
            { error: `Mock Test #${testNum} for exam "${exam.name}" does not exist. Enable "Create missing mock tests" to auto-create.` },
            { status: 400 }
          );
        }

        mockTest = await prisma.mockTest.create({
          data: {
            examId: exam.id,
            testNumber: testNum,
            name: `${exam.name} Full Mock ${testNum}`,
            isFree: testNum === 1,
            isPublished: false,
            totalQuestions: 0,
            durationMinutes: exam.durationMinutes,
            totalMarks: 0,
            marksPerQuestion: exam.marksPerQuestion,
            negativeMarksPerQuestion: exam.negativeMarking,
          },
          include: {
            _count: { select: { attempts: true } },
          },
        });
      }

      affectedMockTestIds.add(mockTest.id);

      // C. Check "Replace all questions" attempt protection
      if (replaceAllQuestions) {
        const studentAttempts = mockTest._count.attempts;
        if (studentAttempts > 0) {
          return NextResponse.json(
            {
              error: `Cannot replace all questions in Mock Test #${testNum} (${mockTest.name}): students have already submitted ${studentAttempts} attempt(s). Replacing questions would corrupt historical test scores.`,
            },
            { status: 400 }
          );
        }

        // Safe to delete existing questions for this mock test
        await prisma.question.deleteMany({
          where: { mockTestId: mockTest.id },
        });
      }

      // D. Cache subjects and topics for this exam
      const dbSubjects = await prisma.subject.findMany({
        where: { examId: exam.id },
        include: { topics: true },
      });
      const subjectMap = new Map<string, any>();
      dbSubjects.forEach((s) => subjectMap.set(s.name.toLowerCase().trim(), s));

      // E. Process each question row in order within this mock test
      for (let i = 0; i < groupRows.length; i++) {
        const row = groupRows[i];
        const questionNumber = i + 1;

        // Resolve subject
        const rawSubjectName = (row.subject || 'General Awareness').trim();
        const subjectKey = rawSubjectName.toLowerCase();
        let subject = subjectMap.get(subjectKey);

        if (!subject) {
          if (!createMissingSubjects) {
            return NextResponse.json(
              { error: `Subject "${rawSubjectName}" does not exist for exam "${exam.name}". Enable "Create missing subjects/topics" to auto-create.` },
              { status: 400 }
            );
          }

          subject = await prisma.subject.create({
            data: {
              examId: exam.id,
              name: rawSubjectName,
              nameHi: rawSubjectName,
            },
            include: { topics: true },
          });
          subjectMap.set(subjectKey, subject);
        }

        // Resolve topic
        const rawTopicName = (row.topic || 'General').trim();
        const topicKey = rawTopicName.toLowerCase();
        let topic = (subject.topics || []).find((t: any) => t.name.toLowerCase().trim() === topicKey);

        if (!topic) {
          topic = await prisma.topic.create({
            data: {
              subjectId: subject.id,
              name: rawTopicName,
              nameHi: rawTopicName,
            },
          });
          if (!subject.topics) subject.topics = [];
          subject.topics.push(topic);
        }

        const qMarks = Number(row.marks) || 1.0;
        const qNegMarks = Number(row.negative_marks) !== undefined ? Number(row.negative_marks) : 0.25;
        const qCorrect = (row.correct_answer || 'A').toUpperCase().trim() as 'A' | 'B' | 'C' | 'D';
        const qDifficulty = (row.difficulty || 'MEDIUM').toUpperCase().trim() as any;

        // Check if question already exists at this questionNumber for this mock test
        const existingQuestion = await prisma.question.findUnique({
          where: {
            mockTestId_questionNumber: {
              mockTestId: mockTest.id,
              questionNumber,
            },
          },
        });

        if (existingQuestion) {
          // UPDATE EXISTING QUESTION (NO DUPLICATION)
          await prisma.question.update({
            where: { id: existingQuestion.id },
            data: {
              subjectId: subject.id,
              topicId: topic.id,
              questionText: row.question || row.hindi_question || '',
              questionTextHi: row.hindi_question || row.question || '',
              correctOption: qCorrect,
              marks: qMarks,
              negativeMarks: qNegMarks,
              difficulty: qDifficulty,
              explanation: row.explanation || '',
              explanationHi: row.hindi_explanation || row.explanation || '',
              options: {
                deleteMany: {},
                create: [
                  { optionLabel: 'A', optionText: row.option_a || '', optionTextHi: row.hindi_option_a || row.option_a || '' },
                  { optionLabel: 'B', optionText: row.option_b || '', optionTextHi: row.hindi_option_b || row.option_b || '' },
                  { optionLabel: 'C', optionText: row.option_c || '', optionTextHi: row.hindi_option_c || row.option_c || '' },
                  { optionLabel: 'D', optionText: row.option_d || '', optionTextHi: row.hindi_option_d || row.option_d || '' },
                ],
              },
            },
          });
          updatedCount++;
        } else {
          // CREATE NEW QUESTION
          await prisma.question.create({
            data: {
              mockTestId: mockTest.id,
              subjectId: subject.id,
              topicId: topic.id,
              questionNumber,
              questionText: row.question || row.hindi_question || '',
              questionTextHi: row.hindi_question || row.question || '',
              correctOption: qCorrect,
              marks: qMarks,
              negativeMarks: qNegMarks,
              difficulty: qDifficulty,
              explanation: row.explanation || '',
              explanationHi: row.hindi_explanation || row.explanation || '',
              options: {
                create: [
                  { optionLabel: 'A', optionText: row.option_a || '', optionTextHi: row.hindi_option_a || row.option_a || '' },
                  { optionLabel: 'B', optionText: row.option_b || '', optionTextHi: row.hindi_option_b || row.option_b || '' },
                  { optionLabel: 'C', optionText: row.option_c || '', optionTextHi: row.hindi_option_c || row.option_c || '' },
                  { optionLabel: 'D', optionText: row.option_d || '', optionTextHi: row.hindi_option_d || row.option_d || '' },
                ],
              },
            },
          });
          createdCount++;
        }
      }
    }

    // 3. Recalculate totals for all affected Mock Tests and Exams
    for (const mockId of affectedMockTestIds) {
      await recalculateMockStats(mockId);
    }

    await recordAuditLog(
      'QUESTION_IMPORT',
      `Bulk CSV import executed: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped across ${affectedMockTestIds.size} mock test(s).`,
      authRes.user.email || 'Admin',
      'SUCCESS'
    );

    return NextResponse.json({
      success: true,
      message: `Import successfully completed: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped.`,
      summary: {
        totalRows: validation.totalRows,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
      },
    });
  } catch (err: any) {
    console.error('Import processing failed:', err);
    return NextResponse.json(
      { error: err.message || 'Bulk import processing failed.' },
      { status: 500 }
    );
  }
}
