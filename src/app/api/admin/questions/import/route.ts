import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { recalculateMockStats, normalizeExamSlug } from '@/lib/mock-resolver';
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
    const targetExamSlug = (formData.get('targetExamSlug') as string | null)?.trim() || undefined;
    const targetMockNumberRaw = formData.get('targetMockNumber') as string | null;
    const targetMockNumber = targetMockNumberRaw ? parseInt(targetMockNumberRaw, 10) : undefined;
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

    // 2. Run deep validation with authoritative target context
    const validation = validateImportRows(rows, new Set(), {
      createMissingMockTests,
      createMissingSubjects,
      existingExams,
      existingMockNumbers,
      existingExamSubjects,
      targetExamSlug,
      targetMockNumber: targetMockNumber && !isNaN(targetMockNumber) ? targetMockNumber : undefined,
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

    // 1. Group rows by Exam and Mock Test Number (using validated canonical exam slug)
    const groupedByExamAndMock = new Map<string, ImportRow[]>();
    for (const row of validRowsToImport) {
      const examSlug = row.exam;
      const testNum = Number(row.mock_test_number) || (targetMockNumber || 1);
      const key = `${examSlug}:::${testNum}`;
      if (!groupedByExamAndMock.has(key)) {
        groupedByExamAndMock.set(key, []);
      }
      groupedByExamAndMock.get(key)!.push(row);
    }

    // 2. Process all groups inside an atomic Prisma transaction
    const txResult = await prisma.$transaction(
      async (tx) => {
        let localCreated = 0;
        let localUpdated = 0;
        const localAffectedMockIds = new Set<string>();

        for (const [key, groupRows] of groupedByExamAndMock.entries()) {
          const [examSlug, testNumStr] = key.split(':::');
          const testNum = parseInt(testNumStr, 10);

          // A. Resolve Exam
          let exam = await tx.exam.findUnique({
            where: { slug: examSlug },
          });

          if (!exam) {
            throw new Error(`Exam "${examSlug}" does not exist in the database.`);
          }

          // B. Resolve or create Mock Test
          let mockTest = await tx.mockTest.findUnique({
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
              throw new Error(
                `Mock Test #${testNum} for exam "${exam.name}" does not exist. Enable "Create missing mock tests" to auto-create.`
              );
            }

            mockTest = await tx.mockTest.create({
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

          localAffectedMockIds.add(mockTest.id);

          // C. Check "Replace all questions" attempt protection
          if (replaceAllQuestions) {
            const studentAttempts = mockTest._count.attempts;
            if (studentAttempts > 0) {
              throw new Error(
                `Cannot replace all questions in Mock Test #${testNum} (${mockTest.name}): students have already submitted ${studentAttempts} attempt(s). Replacing questions would corrupt historical test scores.`
              );
            }

            // Safe to delete existing questions for this mock test
            await tx.question.deleteMany({
              where: { mockTestId: mockTest.id },
            });
          }

          // D. Cache subjects and topics for this exam
          const dbSubjects = await tx.subject.findMany({
            where: { examId: exam.id },
            include: { topics: true },
          });
          const subjectMap = new Map<string, any>();
          dbSubjects.forEach((s) => subjectMap.set(s.name.toLowerCase().trim(), s));

          // E. Fetch existing questions to prevent duplicates on retries
          const existingQuestions = await tx.question.findMany({
            where: { mockTestId: mockTest.id },
            select: { id: true, questionNumber: true, questionText: true, questionTextHi: true },
          });

          const questionByNumber = new Map<number, typeof existingQuestions[0]>();
          const questionByText = new Map<string, typeof existingQuestions[0]>();
          let maxQNum = 0;

          existingQuestions.forEach((q) => {
            questionByNumber.set(q.questionNumber, q);
            if (q.questionNumber > maxQNum) maxQNum = q.questionNumber;
            const normText = (q.questionText || q.questionTextHi || '').toLowerCase().trim();
            if (normText) questionByText.set(normText, q);
          });

          // F. Process each question row in order within this mock test
          for (let i = 0; i < groupRows.length; i++) {
            const row = groupRows[i];

            // Resolve subject
            const rawSubjectName = (row.subject || 'General Awareness').trim();
            const subjectKey = rawSubjectName.toLowerCase();
            let subject = subjectMap.get(subjectKey);

            if (!subject) {
              if (!createMissingSubjects) {
                throw new Error(
                  `Subject "${rawSubjectName}" does not exist for exam "${exam.name}". Enable "Create missing subjects/topics" to auto-create.`
                );
              }

              subject = await tx.subject.create({
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
              topic = await tx.topic.create({
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

            const rowTextNorm = (row.question || row.hindi_question || '').toLowerCase().trim();

            // Check if question already exists in this mock test by text or by target questionNumber
            let targetQuestion = rowTextNorm ? questionByText.get(rowTextNorm) : null;
            let questionNumber = targetQuestion ? targetQuestion.questionNumber : i + 1;

            if (!targetQuestion && questionByNumber.has(questionNumber)) {
              targetQuestion = questionByNumber.get(questionNumber) || null;
            }

            if (targetQuestion) {
              // UPDATE EXISTING QUESTION (Idempotent, no duplicates on retries)
              await tx.question.update({
                where: { id: targetQuestion.id },
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
              localUpdated++;
            } else {
              // Allocate questionNumber without colliding
              if (questionByNumber.has(questionNumber)) {
                maxQNum++;
                questionNumber = maxQNum;
              } else if (questionNumber > maxQNum) {
                maxQNum = questionNumber;
              }

              const newQ = await tx.question.create({
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
              questionByNumber.set(questionNumber, newQ as any);
              if (rowTextNorm) questionByText.set(rowTextNorm, newQ as any);
              localCreated++;
            }
          }
        }

        return {
          createdCount: localCreated,
          updatedCount: localUpdated,
          affectedMockTestIds: Array.from(localAffectedMockIds),
        };
      },
      { timeout: 60000 }
    );

    createdCount = txResult.createdCount;
    updatedCount = txResult.updatedCount;
    txResult.affectedMockTestIds.forEach((id) => affectedMockTestIds.add(id));

    // 3. Recalculate totals for all affected Mock Tests and Exams
    for (const mockId of affectedMockTestIds) {
      try {
        await recalculateMockStats(mockId);
      } catch (statsErr: any) {
        console.warn(`Failed to recalculate stats for mock ${mockId}:`, statsErr.message);
      }
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
