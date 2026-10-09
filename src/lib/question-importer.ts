import * as XLSX from 'xlsx';

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
}

export interface RowValidationResult {
  rowNumber: number;
  data: ImportRow;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  results: RowValidationResult[];
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

export const SAMPLE_IMPORT_ROWS: ImportRow[] = [
  {
    exam: 'hp-police-constable',
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
    explanation: 'Reo Purgyil is the highest peak in Himachal Pradesh at an elevation of 6,816 metres in the Kinnaur district.',
    hindi_explanation: 'रियो पुर्गिल किन्नौर जिले में 6,816 मीटर की ऊंचाई पर हिमाचल प्रदेश की सबसे ऊंची चोटी है।',
  },
  {
    exam: 'hp-police-constable',
    mock_test_number: 1,
    question: 'What is the sum of angles in a triangle in Euclidean geometry?',
    hindi_question: 'यूक्लिडियन ज्यामिति में त्रिभुज के तीनों कोणों का योग कितना होता है?',
    option_a: '90°',
    option_b: '180°',
    option_c: '270°',
    option_d: '360°',
    hindi_option_a: '90°',
    hindi_option_b: '180°',
    hindi_option_c: '270°',
    hindi_option_d: '360°',
    correct_answer: 'B',
    subject: 'Mathematics & Reasoning',
    topic: 'Geometry',
    difficulty: 'EASY',
    marks: 1.0,
    negative_marks: 0.25,
    explanation: 'The interior angles of any triangle on a Euclidean plane always sum up to 180 degrees.',
    hindi_explanation: 'यूक्लिडियन समतल पर किसी भी त्रिभुज के आंतरिक कोणों का योग हमेशा 180 अंश होता है।',
  },
  {
    exam: 'hp-police-constable',
    mock_test_number: 1,
    question: 'Identify the antonym of the word "ABUNDANT":',
    hindi_question: '"ABUNDANT" (प्रचुर) शब्द का विलोम शब्द पहचानिए:',
    option_a: 'Plentiful',
    option_b: 'Scarce',
    option_c: 'Copious',
    option_d: 'Ample',
    hindi_option_a: 'Plentiful (भरपूर)',
    hindi_option_b: 'Scarce (दुर्लभ/अल्प)',
    hindi_option_c: 'Copious (प्रचुर)',
    hindi_option_d: 'Ample (पर्याप्त)',
    correct_answer: 'B',
    subject: 'English Language',
    topic: 'Vocabulary & Antonyms',
    difficulty: 'EASY',
    marks: 1.0,
    negative_marks: 0.25,
    explanation: 'Abundant means existing in large quantities. Scarce means insufficient for the demand.',
    hindi_explanation: 'Abundant का अर्थ बहुत अधिक मात्रा में होना है। इसका विलोम Scarce (अल्प/दुर्लभ) है।',
  },
  {
    exam: 'hp-police-constable',
    mock_test_number: 1,
    question: 'निम्न में से कौन सा शब्द "सूर्य" का पर्यायवाची नहीं है?',
    hindi_question: 'निम्न में से कौन सा शब्द "सूर्य" का पर्यायवाची नहीं है?',
    option_a: 'दिनकर',
    option_b: 'भास्कर',
    option_c: 'निशाकर',
    option_d: 'रवि',
    hindi_option_a: 'दिनकर',
    hindi_option_b: 'भास्कर',
    hindi_option_c: 'निशाकर',
    hindi_option_d: 'रवि',
    correct_answer: 'C',
    subject: 'Hindi Language',
    topic: 'पर्यायवाची शब्द',
    difficulty: 'EASY',
    marks: 1.0,
    negative_marks: 0.25,
    explanation: '"निशाकर" चंद्रमा का पर्यायवाची है, सूर्य का नहीं। दिनकर, भास्कर और रवि सूर्य के पर्यायवाची हैं।',
    hindi_explanation: '"निशाकर" चंद्रमा का पर्यायवाची है, सूर्य का नहीं। दिनकर, भास्कर और रवि सूर्य के पर्यायवाची हैं।',
  },
  {
    exam: 'hp-police-constable',
    mock_test_number: 1,
    question: 'What is the chemical symbol for Gold in the periodic table?',
    hindi_question: 'आवर्त सारणी में सोने (Gold) का रासायनिक प्रतीक क्या है?',
    option_a: 'Ag',
    option_b: 'Au',
    option_c: 'Fe',
    option_d: 'Pb',
    hindi_option_a: 'Ag',
    hindi_option_b: 'Au',
    hindi_option_c: 'Fe',
    hindi_option_d: 'Pb',
    correct_answer: 'B',
    subject: 'General Science',
    topic: 'Chemistry',
    difficulty: 'EASY',
    marks: 1.0,
    negative_marks: 0.25,
    explanation: 'Au comes from the Latin word "Aurum", which means shining dawn and is the symbol for gold.',
    hindi_explanation: 'Au लैटिन शब्द "Aurum" से आया है, जिसका अर्थ चमकदार भोर है और यह सोने का प्रतीक है।',
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
 * Robust CSV parser supporting quotes, commas, and multiline text
 */
export function parseCsvText(csvText: string): ImportRow[] {
  // Normalize newlines and strip BOM
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

  // Normalize header mapping
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[\s-]+/g, '_').trim());
  const dataRows = rows.slice(1);

  return dataRows.map((cols) => {
    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = cols[index] || '';
    });
    return normalizeRow(rowObj);
  });
}

function normalizeRow(raw: Record<string, unknown>): ImportRow {
  const get = (key: string) => {
    const val = raw[key] ?? raw[key.toLowerCase()] ?? raw[key.replace(/_/g, ' ')];
    return val !== undefined && val !== null ? String(val).trim() : '';
  };

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
    correct_answer: get('correct_answer').toUpperCase(),
    subject: get('subject'),
    topic: get('topic'),
    difficulty: (get('difficulty') || 'MEDIUM').toUpperCase(),
    marks: get('marks') ? Number(get('marks')) : 1.0,
    negative_marks: get('negative_marks') !== '' ? Number(get('negative_marks')) : 0.25,
    explanation: get('explanation'),
    hindi_explanation: get('hindi_explanation'),
  };
}

/**
 * Validates import rows against business rules & duplicate detection
 */
export function validateImportRows(
  rows: ImportRow[],
  existingQuestionsSet: Set<string> = new Set()
): ValidationSummary {
  const results: RowValidationResult[] = [];
  const fileSeenQuestions = new Set<string>();
  let duplicateCount = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Accounting for 1-based index + header row
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Exam
    if (!row.exam) {
      errors.push('Exam slug or name is required (e.g. hp-police-constable).');
    }

    // 2. Validate Mock Test Number
    const testNum = Number(row.mock_test_number);
    if (!row.mock_test_number || isNaN(testNum) || testNum < 1) {
      errors.push('mock_test_number must be a positive integer (e.g. 1, 2, 3).');
    }

    // 3. Validate Question Text (English or Hindi must be present)
    if (!row.question && !row.hindi_question) {
      errors.push('Question text is required (at least English or Hindi).');
    } else if (row.question && row.question.length < 3) {
      errors.push('English question text is too short (min 3 characters).');
    }

    // 4. Validate Options A-D
    const optA = row.option_a || row.hindi_option_a;
    const optB = row.option_b || row.hindi_option_b;
    const optC = row.option_c || row.hindi_option_c;
    const optD = row.option_d || row.hindi_option_d;

    if (!optA) errors.push('Option A text is missing.');
    if (!optB) errors.push('Option B text is missing.');
    if (!optC) errors.push('Option C text is missing.');
    if (!optD) errors.push('Option D text is missing.');

    // 5. Validate Correct Answer
    const correct = (row.correct_answer || '').toUpperCase().trim();
    if (!['A', 'B', 'C', 'D'].includes(correct)) {
      errors.push(`correct_answer must be one of 'A', 'B', 'C', or 'D'. Received: '${row.correct_answer}'`);
    }

    // 6. Validate Subject & Topic
    if (!row.subject) {
      errors.push('Subject name is required.');
    }
    if (!row.topic) {
      warnings.push('Topic is empty. Will be assigned to General.');
    }

    // 7. Validate Difficulty
    const diff = (row.difficulty || 'MEDIUM').toUpperCase().trim();
    if (!['EASY', 'MEDIUM', 'HARD'].includes(diff)) {
      errors.push(`difficulty must be 'EASY', 'MEDIUM', or 'HARD'. Received: '${row.difficulty}'`);
    }

    // 8. Validate Marks & Negative Marks
    const marks = Number(row.marks);
    if (row.marks !== undefined && (isNaN(marks) || marks <= 0)) {
      errors.push('marks must be a positive number (e.g. 1.0).');
    }

    const negMarks = Number(row.negative_marks);
    if (row.negative_marks !== undefined && (isNaN(negMarks) || negMarks < 0)) {
      errors.push('negative_marks must be a non-negative number (e.g. 0.25).');
    }

    // 9. Duplicate detection within file
    const questionFingerprint = `${row.exam}_${testNum}_${(row.question || row.hindi_question || '').toLowerCase().trim()}`;
    if (fileSeenQuestions.has(questionFingerprint)) {
      errors.push('Duplicate question found within this upload file.');
      duplicateCount++;
    } else {
      fileSeenQuestions.add(questionFingerprint);
    }

    // 10. Duplicate detection against existing DB questions
    if (existingQuestionsSet.has(questionFingerprint)) {
      warnings.push('Question with identical text already exists in database for this mock test (will update or skip).');
    }

    results.push({
      rowNumber,
      data: row,
      isValid: errors.length === 0,
      errors,
      warnings,
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
  };
}

/**
 * Generates downloadable CSV string with template columns and sample rows
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
      r.negative_marks || 0.25,
      escapeCsv(r.explanation || ''),
      escapeCsv(r.hindi_explanation || ''),
    ].join(',');
  });

  return [header, ...sampleLines].join('\r\n');
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

  return [header, ...errorLines].join('\r\n');
}

function escapeCsv(val: string): string {
  if (!val) return '""';
  const clean = String(val).replace(/"/g, '""');
  return `"${clean}"`;
}
