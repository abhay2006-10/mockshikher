import * as XLSX from 'xlsx';
import { normalizeExamSlug } from '@/lib/mock-resolver';

export interface ImportRow {
  exam: string;
  mock_test_number: number | string;
  question: string;
  hindi_question?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  hindi_option_a?: string;
  hindi_option_b?: string;
  hindi_option_c?: string;
  hindi_option_d?: string;
  correct_answer: string;
  subject: string;
  topic: string;
  difficulty?: string;
  marks?: number | string;
  negative_marks?: number | string;
  explanation?: string;
  hindi_explanation?: string;
  [key: string]: any;
}

export interface RowErrorItem {
  rowNumber: number;
  column: string;
  message: string;
}

export interface RowValidationResult {
  rowNumber: number;
  data: ImportRow;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  columnErrors: RowErrorItem[];
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  results: RowValidationResult[];
  rowErrors: RowErrorItem[];
}

export const TEMPLATE_COLUMNS = [
  'exam',
  'mock_test_number',
  'question',
  'hindi_question',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'hindi_option_a',
  'hindi_option_b',
  'hindi_option_c',
  'hindi_option_d',
  'correct_answer',
  'subject',
  'topic',
  'difficulty',
  'marks',
  'negative_marks',
  'explanation',
  'hindi_explanation',
] as const;

// Exactly ONE clean sample row conforming strictly to the specification
export const SAMPLE_IMPORT_ROWS: ImportRow[] = [
  {
    exam: 'hp-patwari',
    mock_test_number: 1,
    question: 'Which is the highest mountain peak in Himachal Pradesh?',
    hindi_question: 'हिमाचल प्रदेश की सबसे ऊंची पर्वत चोटी कौन सी है?',
    option_a: 'Reo Purgyil',
    option_b: 'Shilla',
    option_c: 'Manirang',
    option_d: 'Mrikula',
    hindi_option_a: 'रियो पुर्गिल',
    hindi_option_b: 'शिल्ला',
    hindi_option_c: 'मनीरंग',
    hindi_option_d: 'मृकुला',
    correct_answer: 'A',
    subject: 'General Awareness',
    topic: 'Geography of HP',
    difficulty: 'MEDIUM',
    marks: 1.0,
    negative_marks: 0.25,
    explanation: 'Reo Purgyil is the highest peak in Himachal Pradesh at 6,816 metres in Kinnaur district.',
    hindi_explanation: 'रियो पुर्गिल किन्नौर जिले में 6,816 मीटर की ऊंचाई पर हिमाचल प्रदेश की सबसे ऊंची चोटी है।',
  },
];

/**
 * Parses raw text or buffer from CSV or XLSX into structured rows
 */
export function parseImportFile(buffer: Buffer, filename: string): ImportRow[] {
  const isExcel = filename.endsWith('.xlsx') || filename.endsWith('.xls');

  if (isExcel) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    return jsonData.map(normalizeRow);
  }

  // Parse CSV (UTF-8 safe with Devanagari handling)
  const text = buffer.toString('utf-8');
  return parseCsvText(text);
}

/**
 * Robust RFC-4180 compliant CSV parser supporting quotes, commas, CRLF/LF, and multiline Hindi text
 */
export function parseCsvText(csvText: string): ImportRow[] {
  // Strip UTF-8 BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++; // Handle CRLF
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((field) => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  // Normalize headers
  const headers = rows[0].map((h) =>
    h.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '').trim()
  );
  const dataRows = rows.slice(1);

  return dataRows.map((cols) => {
    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = cols[index] !== undefined ? cols[index] : '';
    });
    return normalizeRow(rowObj);
  });
}

function normalizeRow(raw: Record<string, unknown>): ImportRow {
  const get = (key: string) => {
    const normalizedKey = key.toLowerCase().replace(/[\s-]+/g, '_');
    for (const k of Object.keys(raw)) {
      const cleanK = k.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (cleanK === normalizedKey) {
        const val = raw[k];
        return val !== undefined && val !== null ? String(val).trim() : '';
      }
    }
    return '';
  };

  const marksVal = get('marks');
  const negMarksVal = get('negative_marks');

  return {
    exam: get('exam'),
    mock_test_number: get('mock_test_number'),
    question: get('question'),
    hindi_question: get('hindi_question'),
    option_a: get('option_a'),
    option_b: get('option_b'),
    option_c: get('option_c'),
    option_d: get('option_d'),
    hindi_option_a: get('hindi_option_a'),
    hindi_option_b: get('hindi_option_b'),
    hindi_option_c: get('hindi_option_c'),
    hindi_option_d: get('hindi_option_d'),
    correct_answer: get('correct_answer').toUpperCase().trim(),
    subject: get('subject'),
    topic: get('topic'),
    difficulty: (get('difficulty') || 'MEDIUM').toUpperCase().trim(),
    marks: marksVal !== '' ? Number(marksVal) : 1.0,
    negative_marks: negMarksVal !== '' ? Number(negMarksVal) : 0.25,
    explanation: get('explanation'),
    hindi_explanation: get('hindi_explanation'),
  };
}

/**
 * Validates import rows against strict business rules & generates row-level error details
 */
export function validateImportRows(
  rows: ImportRow[],
  existingQuestionsSet: Set<string> = new Set(),
  options: {
    createMissingMockTests?: boolean;
    createMissingSubjects?: boolean;
    existingExams?: Set<string>;
    existingMockNumbers?: Map<string, Set<number>>;
    existingExamSubjects?: Map<string, Set<string>>;
    targetExamSlug?: string;
    targetMockNumber?: number;
  } = {}
): ValidationSummary {
  const results: RowValidationResult[] = [];
  const allRowErrors: RowErrorItem[] = [];
  const fileSeenQuestions = new Set<string>();
  let duplicateCount = 0;

  const {
    createMissingMockTests = false,
    createMissingSubjects = false,
    existingExams,
    existingMockNumbers,
    existingExamSubjects,
    targetExamSlug,
    targetMockNumber,
  } = options;

  const cleanTargetSlug = targetExamSlug ? targetExamSlug.toLowerCase().trim() : '';

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Accounting for 1-based index + header row
    const errors: string[] = [];
    const warnings: string[] = [];
    const columnErrors: RowErrorItem[] = [];

    const addError = (column: string, message: string) => {
      errors.push(message);
      const item: RowErrorItem = { rowNumber, column, message };
      columnErrors.push(item);
      allRowErrors.push(item);
    };

    // 1. Validate Exam
    const rawExam = (row.exam || '').toLowerCase().trim();
    let cleanExamSlug = '';

    if (rawExam) {
      cleanExamSlug = normalizeExamSlug(rawExam, cleanTargetSlug);
    } else if (cleanTargetSlug) {
      // If exam column is empty in CSV, adopt authoritative target
      cleanExamSlug = cleanTargetSlug;
    }

    // Set row.exam to the resolved canonical exam slug for preview and DB writes
    row.exam = cleanExamSlug;

    if (!cleanExamSlug) {
      addError('exam', 'Exam slug is required in CSV or must be selected as target.');
    } else if (cleanTargetSlug && cleanExamSlug !== cleanTargetSlug) {
      // Explicit target mismatch rejection
      addError(
        'exam',
        `CSV exam '${rawExam}' (resolved as '${cleanExamSlug}') does not match selected target exam '${cleanTargetSlug}'. Please select the matching target exam or upload the correct CSV file.`
      );
    } else if (existingExams && !existingExams.has(cleanExamSlug)) {
      addError('exam', `Exam slug "${cleanExamSlug}" does not exist in the database.`);
    }

    // 2. Validate Mock Test Number
    let testNum = Number(row.mock_test_number);
    if ((!row.mock_test_number || isNaN(testNum)) && targetMockNumber && targetMockNumber > 0) {
      testNum = targetMockNumber;
    }

    if (!isNaN(testNum) && Number.isInteger(testNum) && testNum > 0) {
      row.mock_test_number = testNum;
    }

    if (!row.mock_test_number || isNaN(testNum) || testNum < 1 || !Number.isInteger(testNum)) {
      addError('mock_test_number', `mock_test_number must be a positive integer (received: '${row.mock_test_number}').`);
    } else if (targetMockNumber && targetMockNumber > 0 && testNum !== targetMockNumber) {
      addError(
        'mock_test_number',
        `CSV mock_test_number '${testNum}' does not match selected target Mock #${targetMockNumber}. Please select the matching target mock or upload the matching file.`
      );
    } else if (
      !createMissingMockTests &&
      existingMockNumbers &&
      cleanExamSlug &&
      existingMockNumbers.has(cleanExamSlug)
    ) {
      const mockSet = existingMockNumbers.get(cleanExamSlug);
      if (mockSet && !mockSet.has(testNum)) {
        addError(
          'mock_test_number',
          `Mock test #${testNum} does not exist for exam "${cleanExamSlug}". Tick "Create missing mock tests" to auto-create.`
        );
      }
    }

    // 3. Validate Question Text (English or Hindi must be present)
    const hasEnglish = !!row.question && row.question.trim().length > 0;
    const hasHindi = !!row.hindi_question && row.hindi_question.trim().length > 0;

    if (!hasEnglish && !hasHindi) {
      addError('question', 'Question text is required (at least English or Hindi).');
    }

    // 4. Validate Options A-D
    const optA = row.option_a || row.hindi_option_a;
    const optB = row.option_b || row.hindi_option_b;
    const optC = row.option_c || row.hindi_option_c;
    const optD = row.option_d || row.hindi_option_d;

    if (!optA) addError('option_a', 'Option A text is missing (English or Hindi required).');
    if (!optB) addError('option_b', 'Option B text is missing (English or Hindi required).');
    if (!optC) addError('option_c', 'Option C text is missing (English or Hindi required).');
    if (!optD) addError('option_d', 'Option D text is missing (English or Hindi required).');

    // 5. Validate Correct Answer
    const rawAnswer = String(row.correct_answer || '').trim();
    let correct = rawAnswer.toUpperCase();
    const letterMatch = correct.match(/^[(\[]?([A-D])[)\]\.]?$/) || correct.match(/^OPTION\s*([A-D])$/);
    if (letterMatch) {
      correct = letterMatch[1];
      row.correct_answer = correct;
    }

    if (!['A', 'B', 'C', 'D'].includes(correct)) {
      addError(
        'correct_answer',
        `correct_answer must be one of 'A', 'B', 'C', or 'D' (received: '${rawAnswer || '<BLANK>'}').`
      );
    }

    // 6. Validate Subject
    const cleanSubject = (row.subject || '').trim();
    if (!cleanSubject) {
      addError('subject', 'Subject name is required.');
    } else if (
      !createMissingSubjects &&
      existingExamSubjects &&
      cleanExamSlug &&
      existingExamSubjects.has(cleanExamSlug)
    ) {
      const subjSet = existingExamSubjects.get(cleanExamSlug);
      if (subjSet && !subjSet.has(cleanSubject.toLowerCase())) {
        addError(
          'subject',
          `Subject "${cleanSubject}" does not exist for exam "${cleanExamSlug}". Tick "Create missing subjects/topics" to auto-create.`
        );
      }
    }

    // 7. Validate Difficulty
    const diff = (row.difficulty || 'MEDIUM').toUpperCase().trim();
    if (!['EASY', 'MEDIUM', 'HARD'].includes(diff)) {
      addError('difficulty', `difficulty must be 'EASY', 'MEDIUM', or 'HARD' (received: '${row.difficulty}').`);
    }

    // 8. Validate Marks & Negative Marks
    const marks = Number(row.marks);
    if (row.marks !== undefined && row.marks !== '' && (isNaN(marks) || marks <= 0)) {
      addError('marks', `marks must be a positive number greater than 0 (received: '${row.marks}').`);
    }

    const negMarks = Number(row.negative_marks);
    if (row.negative_marks !== undefined && row.negative_marks !== '' && (isNaN(negMarks) || negMarks < 0)) {
      addError('negative_marks', `negative_marks must be 0 or a positive number (received: '${row.negative_marks}').`);
    }

    // 9. In-file duplicate detection
    const questionFingerprint = `${cleanExamSlug}_${testNum}_${(row.question || row.hindi_question || '').toLowerCase().trim()}`;
    if (fileSeenQuestions.has(questionFingerprint)) {
      warnings.push('Duplicate question found within this upload file.');
      duplicateCount++;
    } else {
      fileSeenQuestions.add(questionFingerprint);
    }

    // 10. Database duplicate detection warning
    if (existingQuestionsSet.has(questionFingerprint)) {
      warnings.push('Question already exists in database for this mock test (will be updated).');
    }

    results.push({
      rowNumber,
      data: row,
      isValid: errors.length === 0,
      errors,
      warnings,
      columnErrors,
    });
  });

  const validRows = results.filter((r) => r.isValid).length;
  const invalidRows = results.filter((r) => !r.isValid).length;

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicateRows: duplicateCount,
    results,
    rowErrors: allRowErrors,
  };
}

/**
 * Generates downloadable CSV string matching template columns with UTF-8 BOM and one sample row
 */
export function generateTemplateCsv(): string {
  const header = TEMPLATE_COLUMNS.join(',');
  const sampleLines = SAMPLE_IMPORT_ROWS.map((r) => {
    return [
      escapeCsv(r.exam),
      r.mock_test_number,
      escapeCsv(r.question),
      escapeCsv(r.hindi_question || ''),
      escapeCsv(r.option_a),
      escapeCsv(r.option_b),
      escapeCsv(r.option_c),
      escapeCsv(r.option_d),
      escapeCsv(r.hindi_option_a || ''),
      escapeCsv(r.hindi_option_b || ''),
      escapeCsv(r.hindi_option_c || ''),
      escapeCsv(r.hindi_option_d || ''),
      r.correct_answer,
      escapeCsv(r.subject),
      escapeCsv(r.topic),
      r.difficulty || 'MEDIUM',
      r.marks || 1.0,
      r.negative_marks !== undefined ? r.negative_marks : 0.25,
      escapeCsv(r.explanation || ''),
      escapeCsv(r.hindi_explanation || ''),
    ].join(',');
  });

  // Prepend UTF-8 BOM so Excel and spreadsheet applications open Devanagari Hindi text cleanly
  return '\uFEFF' + [header, ...sampleLines].join('\r\n');
}

/**
 * Generates an Error Report CSV for invalid rows
 */
export function generateErrorReportCsv(results: RowValidationResult[]): string {
  const header = 'Row_Number,Status,Errors,Exam,Mock_Test,Question,Subject,Correct_Answer';
  const invalidResults = results.filter((r) => !r.isValid);

  const errorLines = invalidResults.map((r) => {
    return [
      r.rowNumber,
      'ERROR',
      escapeCsv(r.errors.join(' | ')),
      escapeCsv(r.data.exam),
      r.data.mock_test_number,
      escapeCsv(r.data.question || r.data.hindi_question || ''),
      escapeCsv(r.data.subject),
      r.data.correct_answer,
    ].join(',');
  });

  return '\uFEFF' + [header, ...errorLines].join('\r\n');
}

function escapeCsv(val: string): string {
  if (val === undefined || val === null || val === '') return '""';
  const clean = String(val).replace(/"/g, '""');
  return `"${clean}"`;
}
