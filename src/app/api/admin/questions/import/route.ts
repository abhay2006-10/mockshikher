import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { resolveOrCreateMockTest, recalculateMockStats } from '@/lib/mock-resolver';
import {
  parseImportFile,
  validateImportRows,
  generateErrorReportCsv,
  ImportRow,
} from '@/lib/question-importer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authRes = await requireAdmin();
  if (authRes instanceof NextResponse) return authRes;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const mode = (formData.get('mode') as string) || 'preview'; // 'preview' or 'execute'
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

    // Retrieve existing question fingerprints from DB to detect duplicates
    const existingQuestionsSet = new Set<string>();
    try {
      const existing = await prisma.question.findMany({
        select: {
          questionText: true,
          questionTextHi: true,
          mockTest: {
            select: {
              testNumber: true,
              exam: { select: { slug: true } },
            },
          },
        },
      });

      existing.forEach((q) => {
        const examSlug = q.mockTest?.exam?.slug || 'hp-police-constable';
        const testNum = q.mockTest?.testNumber || 1;
        const text = (q.questionText || q.questionTextHi || '').toLowerCase().trim();
        existingQuestionsSet.add(`${examSlug}_${testNum}_${text}`);
      });
    } catch (err) {
      console.warn('Could not query existing DB questions for deduplication check:', err);
    }

    // Run deep validation
    const validation = validateImportRows(rows, existingQuestionsSet);

    // If preview mode, return validation preview table
    if (mode === 'preview') {
      const errorReportCsv = validation.invalidRows > 0 ? generateErrorReportCsv(validation.results) : null;
      return NextResponse.json({
        summary: {
          totalRows: validation.totalRows,
          validRows: validation.validRows,
          invalidRows: validation.invalidRows,
          duplicateRows: validation.duplicateRows,
        },
        preview: validation.results.slice(0, 100), // Preview first 100
        errorReportCsv,
      });
    }

    // EXECUTE MODE: Import only valid rows inside a transaction
    const validRowsToImport = validation.results
      .filter((r) => r.isValid)
      .map((r) => r.data);

    let importedCount = 0;
    let skippedCount = validation.invalidRows;
    const affectedMockTestIds = new Set<string>();

    if (validRowsToImport.length > 0) {
      // 1. Pre-determine affected mock tests and record initial question counts in DB
      for (const row of validRowsToImport) {
        const testNum = Number(row.mock_test_number) || 1;
        const examSlug = (row.exam || 'hp-police-constable').toLowerCase().trim();
        const mockTest = await resolveOrCreateMockTest({
          examSlug,
          testNumber: testNum,
          mockTestId: `${examSlug}-mock-${testNum}`,
        });
        if (mockTest) {
          affectedMockTestIds.add(mockTest.id);
        }
      }

      const preCounts = new Map<string, number>();
      for (const mId of affectedMockTestIds) {
        const c = await prisma.question.count({ where: { mockTestId: mId } });
        preCounts.set(mId, c);
      }

      // 2. Execute all row insertions inside a database transaction
      await prisma.$transaction(async (tx) => {
        for (const row of validRowsToImport) {
          const testNum = Number(row.mock_test_number) || 1;
          const examSlug = (row.exam || 'hp-police-constable').toLowerCase().trim();

          // 1. Resolve or create mock test using shared resolver
          const mockTest = await resolveOrCreateMockTest({
            examSlug,
            testNumber: testNum,
            mockTestId: `${examSlug}-mock-${testNum}`,
          });
          if (!mockTest) {
            throw new Error(`Could not resolve mock test for exam "${examSlug}" test ${testNum}`);
          }
          affectedMockTestIds.add(mockTest.id);

          // 2. Find or create subject
          const subjectName = row.subject?.trim() || 'General Awareness';
          let subject = await tx.subject.findFirst({
            where: { examId: mockTest.examId, name: subjectName },
          });
          if (!subject) {
            subject = await tx.subject.create({
              data: {
                examId: mockTest.examId,
                name: subjectName,
                nameHi: subjectName,
              },
            });
          }

          // 3. Find or create topic
          const topicName = row.topic?.trim() || 'General';
          let topic = await tx.topic.findFirst({
            where: { subjectId: subject.id, name: topicName },
          });
          if (!topic) {
            topic = await tx.topic.create({
              data: {
                subjectId: subject.id,
                name: topicName,
                nameHi: topicName,
              },
            });
          }

          // 4. Determine current question count for this mock test
          const currentCount = await tx.question.count({
            where: { mockTestId: mockTest.id },
          });

          // 5. Create Question + Options
          await tx.question.create({
            data: {
              mockTestId: mockTest.id,
              subjectId: subject.id,
              topicId: topic.id,
              questionNumber: currentCount + 1,
              questionText: row.question || row.hindi_question || '',
              questionTextHi: row.hindi_question || row.question || '',
              correctOption: (row.correct_answer?.trim().toUpperCase() as any) || 'A',
              marks: Number(row.marks) || 1.0,
              negativeMarks: Number(row.negative_marks) || 0.25,
              difficulty: (row.difficulty?.trim().toUpperCase() as any) || 'MEDIUM',
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

          importedCount++;
        }
      });

      // 3. Re-query the database to verify the actual inserted count before showing success (Requirement 4)
      let verifiedInsertedCount = 0;
      for (const mId of affectedMockTestIds) {
        const postCount = await prisma.question.count({ where: { mockTestId: mId } });
        const preCount = preCounts.get(mId) || 0;
        verifiedInsertedCount += (postCount - preCount);
      }

      if (verifiedInsertedCount !== importedCount) {
        throw new Error(
          `Database verification failed: ${importedCount} questions submitted, but only ${verifiedInsertedCount} confirmed in PostgreSQL.`
        );
      }

      // Recalculate stats for all affected mock tests
      for (const mId of affectedMockTestIds) {
        await recalculateMockStats(mId);
      }
    }

    if (validRowsToImport.length > 0 && importedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to import rows into database. 0 questions were saved.' },
        { status: 500 }
      );
    }

    const errorReportCsv = validation.invalidRows > 0 ? generateErrorReportCsv(validation.results) : null;

    return NextResponse.json({
      success: true,
      message: `Import complete. ${importedCount} questions successfully imported into PostgreSQL database. ${skippedCount} skipped due to validation errors.`,
      summary: {
        totalRows: validation.totalRows,
        imported: importedCount,
        skipped: skippedCount,
        errors: validation.invalidRows,
      },
      errorReportCsv,
    });
  } catch (err: any) {
    console.error('Import processing failed:', err);
    return NextResponse.json(
      { error: err.message || 'Bulk import processing failed in PostgreSQL database.' },
      { status: 500 }
    );
  }
}
