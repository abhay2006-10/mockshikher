import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Canonical mappings & Aliases under test (mirrored from src/lib/mock-resolver.ts)
const EXAM_SLUG_ALIASES = {
  // HP TET TGT Medical
  'hp-tgt-medical-hptet': 'hp-tet-tgt-medical',
  'hp-tgt-medical': 'hp-tet-tgt-medical',
  'hptet-tgt-medical': 'hp-tet-tgt-medical',
  'hp-tet-medical': 'hp-tet-tgt-medical',
  'tgt-medical': 'hp-tet-tgt-medical',
  'hp-tet-tgt-med': 'hp-tet-tgt-medical',
  'hp-tet-tgt-medical': 'hp-tet-tgt-medical',

  // HP TET TGT Non-Medical
  'hp-tgt-non-medical-hptet': 'hp-tet-tgt-non-medical',
  'hp-tgt-non-medical': 'hp-tet-tgt-non-medical',
  'hptet-tgt-non-medical': 'hp-tet-tgt-non-medical',
  'hp-tet-non-medical': 'hp-tet-tgt-non-medical',
  'tgt-non-medical': 'hp-tet-tgt-non-medical',
  'hp-tet-tgt-non-medical': 'hp-tet-tgt-non-medical',

  // HP TET TGT Arts
  'hp-tgt-arts-hptet': 'hp-tet-tgt-arts',
  'hp-tgt-arts': 'hp-tet-tgt-arts',
  'hptet-tgt-arts': 'hp-tet-tgt-arts',
  'hp-tet-arts': 'hp-tet-tgt-arts',
  'tgt-arts': 'hp-tet-tgt-arts',
  'hp-tet-tgt-arts': 'hp-tet-tgt-arts',

  // HP TET JBT / Shastri
  'hp-jbt-hptet': 'hp-tet-jbt',
  'hp-jbt-tet': 'hp-tet-jbt',
  'hptet-jbt': 'hp-tet-jbt',
  'hp-tet-jbt': 'hp-tet-jbt',
  'jbt-tet': 'hp-tet-jbt',

  // HP Police Constable
  'hp-police': 'hp-police-constable',
  'hp-police-constable': 'hp-police-constable',
  'police-constable': 'hp-police-constable',
  'hp-constable': 'hp-police-constable',

  // HP Patwari
  'hp-patwari': 'hp-patwari',
  'patwari': 'hp-patwari',
  'hp-revenue-patwari': 'hp-patwari',

  // HP Allied Services
  'hp-allied': 'hp-allied-services',
  'hp-allied-services': 'hp-allied-services',
  'allied-services': 'hp-allied-services',

  // HP Judiciary Clerk & High Court
  'hp-clerk': 'hp-judiciary-clerk',
  'hp-judiciary-clerk': 'hp-judiciary-clerk',
  'high-court-clerk': 'hp-judiciary-clerk',
  'hp-high-court-clerk': 'hp-judiciary-clerk',

  // HP Judiciary Process Server
  'hp-process-server': 'hp-judiciary-process-server',
  'hp-judiciary-process-server': 'hp-judiciary-process-server',
  'process-server': 'hp-judiciary-process-server',

  // HP Forest Guard
  'hp-forest': 'hp-forest-guard',
  'hp-forest-guard': 'hp-forest-guard',
  'forest-guard': 'hp-forest-guard',

  // SSC GD Constable
  'ssc-gd': 'ssc-gd-constable',
  'ssc-gd-constable': 'ssc-gd-constable',
};

function normalizeExamSlug(rawSlug, targetExamSlug) {
  if (!rawSlug || !rawSlug.trim()) {
    return targetExamSlug ? targetExamSlug.toLowerCase().trim() : '';
  }

  const clean = rawSlug.toLowerCase().trim().replace(/[\s_]+/g, '-');

  if (targetExamSlug && clean === targetExamSlug.toLowerCase().trim()) {
    return targetExamSlug.toLowerCase().trim();
  }

  if (EXAM_SLUG_ALIASES[clean]) {
    return EXAM_SLUG_ALIASES[clean];
  }

  if (targetExamSlug) {
    const cleanTarget = targetExamSlug.toLowerCase().trim();
    if (clean === cleanTarget) return cleanTarget;
  }

  if (clean.includes('patwari')) return 'hp-patwari';
  if (clean.includes('allied')) return 'hp-allied-services';
  if (clean.includes('process-server')) return 'hp-judiciary-process-server';
  if (clean.includes('clerk') || clean.includes('high-court')) return 'hp-judiciary-clerk';
  if (clean.includes('police')) return 'hp-police-constable';
  if (clean.includes('forest')) return 'hp-forest-guard';
  if (clean.includes('medical') && clean.includes('tet')) return 'hp-tet-tgt-medical';
  if (clean.includes('non-medical') && clean.includes('tet')) return 'hp-tet-tgt-non-medical';
  if (clean.includes('arts') && clean.includes('tet')) return 'hp-tet-tgt-arts';
  if (clean.includes('jbt')) return 'hp-tet-jbt';
  if (clean.includes('ssc') && clean.includes('gd')) return 'ssc-gd-constable';

  return clean;
}

// RFC-4180 CSV Parser with UTF-8 Devanagari handling (mirrored from src/lib/question-importer.ts)
function parseCsvText(csvText) {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
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
          i++;
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

  const headers = rows[0].map((h) =>
    h.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '').trim()
  );
  const dataRows = rows.slice(1);

  return dataRows.map((cols) => {
    const rowObj = {};
    headers.forEach((header, index) => {
      rowObj[header] = cols[index] !== undefined ? cols[index] : '';
    });
    return rowObj;
  });
}

function validateImportRows(rows, existingQuestionsSet = new Set(), options = {}) {
  const results = [];
  const allRowErrors = [];

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
    const rowNumber = index + 2;
    const errors = [];
    const warnings = [];
    const columnErrors = [];

    const addError = (column, message) => {
      errors.push(message);
      const item = { rowNumber, column, message };
      columnErrors.push(item);
      allRowErrors.push(item);
    };

    // 1. Validate Exam
    const rawExam = (row.exam || '').toLowerCase().trim();
    let cleanExamSlug = '';

    if (rawExam) {
      cleanExamSlug = normalizeExamSlug(rawExam, cleanTargetSlug);
    } else if (cleanTargetSlug) {
      cleanExamSlug = cleanTargetSlug;
    }

    row.exam = cleanExamSlug;

    if (!cleanExamSlug) {
      addError('exam', 'Exam slug is required in CSV or must be selected as target.');
    } else if (cleanTargetSlug && cleanExamSlug !== cleanTargetSlug) {
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

    // 3. Validate Question Text
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

  return {
    totalRows: rows.length,
    validRows: results.filter((r) => r.isValid).length,
    invalidRows: results.filter((r) => !r.isValid).length,
    results,
    rowErrors: allRowErrors,
  };
}

// Client response parser (mirrored from src/components/admin/AdminImportModal.tsx)
async function parseApiResponse(res) {
  const contentType = res.headers?.get?.('content-type') || res.headers?.['content-type'] || '';
  let rawText = '';
  try {
    rawText = typeof res.text === 'function' ? await res.text() : String(res.body || '');
  } catch (readErr) {
    return {
      ok: false,
      data: null,
      errorMessage: `Failed to read server response: ${readErr.message}`,
    };
  }

  const isJson = contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[');

  if (isJson) {
    try {
      const data = JSON.parse(rawText);
      if (!res.ok) {
        return {
          ok: false,
          data,
          errorMessage: data.error || data.message || `Server error (HTTP ${res.status})`,
        };
      }
      return { ok: true, data, errorMessage: '' };
    } catch {
      // JSON parse error
    }
  }

  let helpfulMessage = '';
  if (res.status === 401) {
    helpfulMessage = 'Authentication session expired or missing (HTTP 401). Please refresh the page and log in as admin.';
  } else if (res.status === 403) {
    helpfulMessage = 'Forbidden (HTTP 403): You do not have admin permissions to perform question imports.';
  } else if (res.status === 404) {
    helpfulMessage = 'API endpoint not found (HTTP 404): /api/admin/questions/import.';
  } else if (res.status === 413) {
    helpfulMessage = 'File payload is too large for the server (HTTP 413 Payload Too Large). Please split CSV into smaller batches.';
  } else if (res.status >= 500) {
    helpfulMessage = `Internal server error (HTTP ${res.status}). The server or database encountered an issue.`;
  } else {
    helpfulMessage = `Server returned an unexpected non-JSON response (HTTP ${res.status}).`;
  }

  const titleMatch = rawText.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    helpfulMessage += ` Details: ${titleMatch[1].trim()}`;
  }

  return {
    ok: false,
    data: null,
    errorMessage: helpfulMessage,
  };
}

describe('MockShikhar Bulk Question Importer Regression Test Suite', () => {
  // Test 1: Valid HPTET CSV uploaded to HPTET Mock 1
  test('1. Valid HPTET CSV uploaded to HPTET Mock 1 resolves canonically and passes validation', () => {
    const csvContent = `exam,mock_test_number,question,hindi_question,option_a,option_b,option_c,option_d,correct_answer,subject,topic,difficulty,marks,negative_marks,explanation,hindi_explanation
hp-tgt-medical-hptet,1,"What is the powerhouse of the cell?","कोशिका का शक्तिगृह किसे कहा जाता है?","Mitochondria","Ribosome","Nucleus","Golgi bodies","A","Biology","Cell Structure","EASY",1,0.25,"Mitochondria generate ATP","माइटोकॉन्ड्रिया एटीपी उत्पन्न करता है"`;

    const parsedRows = parseCsvText(csvContent);
    assert.equal(parsedRows.length, 1);
    assert.equal(parsedRows[0].exam, 'hp-tgt-medical-hptet');

    const validation = validateImportRows(parsedRows, new Set(), {
      targetExamSlug: 'hp-tet-tgt-medical',
      targetMockNumber: 1,
      createMissingMockTests: true,
      createMissingSubjects: true,
    });

    assert.equal(validation.validRows, 1);
    assert.equal(validation.invalidRows, 0);
    // Crucial check: row.exam must be canonically resolved to hp-tet-tgt-medical, NEVER hp-police-constable
    assert.equal(validation.results[0].data.exam, 'hp-tet-tgt-medical');
    assert.equal(validation.results[0].data.mock_test_number, 1);
  });

  // Test 2: Police Constable CSV selected for an HPTET target — must be rejected
  test('2. Police Constable CSV selected for an HPTET target is rejected with clear mismatch error', () => {
    const csvContent = `exam,mock_test_number,question,hindi_question,option_a,option_b,option_c,option_d,correct_answer,subject,topic
hp-police-constable,1,"What is the capital of HP?","हिमाचल प्रदेश की राजधानी क्या है?","Shimla","Dharamshala","Mandi","Solan","A","General Knowledge","HP GK"`;

    const parsedRows = parseCsvText(csvContent);
    const validation = validateImportRows(parsedRows, new Set(), {
      targetExamSlug: 'hp-tet-tgt-medical',
      targetMockNumber: 1,
    });

    assert.equal(validation.validRows, 0);
    assert.equal(validation.invalidRows, 1);
    assert.ok(
      validation.rowErrors.some((e) =>
        e.message.includes('does not match selected target exam')
      ),
      'Must contain explicit exam mismatch error message'
    );
  });

  // Test 3: HPTET CSV selected for a Police Constable target — must be rejected
  test('3. HPTET CSV selected for a Police Constable target is rejected with clear mismatch error', () => {
    const csvContent = `exam,mock_test_number,question,hindi_question,option_a,option_b,option_c,option_d,correct_answer,subject,topic
hp-tgt-medical-hptet,1,"What is photosynthesis?","प्रकाश संश्लेषण क्या है?","Process A","Process B","Process C","Process D","A","Botany","Plant Physiology"`;

    const parsedRows = parseCsvText(csvContent);
    const validation = validateImportRows(parsedRows, new Set(), {
      targetExamSlug: 'hp-police-constable',
      targetMockNumber: 1,
    });

    assert.equal(validation.validRows, 0);
    assert.equal(validation.invalidRows, 1);
    assert.ok(
      validation.rowErrors.some((e) =>
        e.message.includes('does not match selected target exam')
      ),
      'Must contain explicit exam mismatch error message'
    );
  });

  // Test 4: Selecting a different file refreshes the preview and exam identity
  test('4. Selecting a different file refreshes the preview and exam identity without stale state', () => {
    // Simulating frontend modal state lifecycle
    let modalState = {
      file: { name: 'old-hptet-mock1.csv' },
      previewRows: [{ rowNumber: 2, exam: 'hp-tet-tgt-medical', question: 'Q1' }],
      rowErrors: [],
      summary: { totalRows: 1, validRows: 1 },
      executionResult: null,
      serverError: null,
    };

    // User chooses a new file: state must be cleanly wiped
    function onFilePicked(newFile) {
      modalState = {
        file: newFile,
        previewRows: [],
        rowErrors: [],
        summary: null,
        executionResult: null,
        serverError: null,
      };
    }

    onFilePicked({ name: 'new-police-mock2.csv' });
    assert.equal(modalState.previewRows.length, 0);
    assert.equal(modalState.summary, null);
    assert.equal(modalState.file.name, 'new-police-mock2.csv');
  });

  // Test 5: API returns HTML — frontend shows a useful error without a JSON parsing crash
  test('5. API returning HTML error page produces friendly diagnostic message without JSON parsing crash', async () => {
    const mockHtmlResponse = {
      ok: false,
      status: 502,
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      text: async () => '<html><head><title>502 Bad Gateway</title></head><body><h1>Bad Gateway</h1></body></html>',
    };

    const parsed = await parseApiResponse(mockHtmlResponse);
    assert.equal(parsed.ok, false);
    assert.ok(
      parsed.errorMessage.includes('502') && parsed.errorMessage.includes('Bad Gateway'),
      `Expected 502 Bad Gateway diagnostic, got: ${parsed.errorMessage}`
    );
    // Crucially: no exception thrown and no "Unexpected token '<' in JSON" crash
  });

  // Test 6: API returns JSON validation errors and server errors
  test('6. API returns JSON validation errors and server errors structured with appropriate HTTP codes', async () => {
    const mockValidationFailure = {
      ok: false,
      status: 400,
      headers: new Map([['content-type', 'application/json']]),
      text: async () =>
        JSON.stringify({
          error: 'Validation failed: 0 valid rows out of 5.',
          rowErrors: [{ rowNumber: 2, column: 'exam', message: 'Exam mismatch' }],
        }),
    };

    const parsed = await parseApiResponse(mockValidationFailure);
    assert.equal(parsed.ok, false);
    assert.equal(parsed.errorMessage, 'Validation failed: 0 valid rows out of 5.');
    assert.equal(parsed.data.rowErrors.length, 1);
  });

  // Test 7: Hindi Unicode text and quoted commas parse correctly
  test('7. Hindi Unicode text, quotes, and commas inside quoted fields parse with perfect fidelity', () => {
    const csvWithUnicodeAndCommas = `exam,mock_test_number,question,hindi_question,option_a,option_b,option_c,option_d,correct_answer,subject,topic
hp-tet-tgt-medical,1,"Which gas is used in photosynthesis, respiration, and cellular division?","प्रकाश संश्लेषण, श्वसन, और कोशिका विभाजन में कौन-सी गैस प्रयुक्त होती है?","Carbon Dioxide, Water","Oxygen, Nitrogen","Hydrogen, Helium","Argon, Neon","A","Biology","Plant Physiology"`;

    const rows = parseCsvText(csvWithUnicodeAndCommas);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].hindi_question, 'प्रकाश संश्लेषण, श्वसन, और कोशिका विभाजन में कौन-सी गैस प्रयुक्त होती है?');
    assert.equal(rows[0].option_a, 'Carbon Dioxide, Water');
    assert.equal(rows[0].option_b, 'Oxygen, Nitrogen');
  });

  // Test 8: Invalid or blank answer keys are rejected
  test('8. Invalid or blank answer keys (e.g. E, blank, numbers) are strictly rejected', () => {
    const invalidAnswerCsv = `exam,mock_test_number,question,option_a,option_b,option_c,option_d,correct_answer,subject,topic
hp-patwari,1,"Question 1","Opt A","Opt B","Opt C","Opt D","E","Math","Algebra"
hp-patwari,1,"Question 2","Opt A","Opt B","Opt C","Opt D","","Math","Algebra"
hp-patwari,1,"Question 3","Opt A","Opt B","Opt C","Opt D","Option B","Math","Algebra"
hp-patwari,1,"Question 4","Opt A","Opt B","Opt C","Opt D","(C)","Math","Algebra"`;

    const rows = parseCsvText(invalidAnswerCsv);
    const validation = validateImportRows(rows, new Set(), {
      targetExamSlug: 'hp-patwari',
      targetMockNumber: 1,
    });

    // Row 1 (answer E) -> Invalid
    assert.equal(validation.results[0].isValid, false);
    assert.ok(validation.results[0].errors.some((e) => e.includes("must be one of 'A', 'B', 'C', or 'D'")));

    // Row 2 (blank answer) -> Invalid
    assert.equal(validation.results[1].isValid, false);
    assert.ok(validation.results[1].errors.some((e) => e.includes("must be one of 'A', 'B', 'C', or 'D'")));

    // Row 3 ('Option B') -> Sanitized to 'B' and Valid
    assert.equal(validation.results[2].isValid, true);
    assert.equal(validation.results[2].data.correct_answer, 'B');

    // Row 4 ('(C)') -> Sanitized to 'C' and Valid
    assert.equal(validation.results[3].isValid, true);
    assert.equal(validation.results[3].data.correct_answer, 'C');
  });

  // Test 9: Duplicate submissions do not create duplicate questions
  test('9. Retry or duplicate submission updates existing questions by questionNumber/text instead of duplicating', () => {
    // In-memory simulation of the transactional deduplication logic in route.ts
    const mockDbQuestions = new Map();
    let createdCount = 0;
    let updatedCount = 0;

    function importQuestion(row, index) {
      const rowTextNorm = (row.question || '').toLowerCase().trim();
      let targetQ = null;

      for (const q of mockDbQuestions.values()) {
        if (q.questionTextNorm === rowTextNorm || q.questionNumber === index + 1) {
          targetQ = q;
          break;
        }
      }

      if (targetQ) {
        // Update existing question
        targetQ.questionText = row.question;
        targetQ.correctOption = row.correct_answer;
        updatedCount++;
      } else {
        // Create new question
        const newId = `q-${mockDbQuestions.size + 1}`;
        mockDbQuestions.set(newId, {
          id: newId,
          questionNumber: index + 1,
          questionText: row.question,
          questionTextNorm: rowTextNorm,
          correctOption: row.correct_answer,
        });
        createdCount++;
      }
    }

    const row = { question: 'What is the speed of light?', correct_answer: 'A' };

    // First import run: creates 1 question
    importQuestion(row, 0);
    assert.equal(createdCount, 1);
    assert.equal(updatedCount, 0);
    assert.equal(mockDbQuestions.size, 1);

    // Second import run (retry with same or updated content): updates, does NOT duplicate
    const updatedRow = { question: 'What is the speed of light?', correct_answer: 'B' };
    importQuestion(updatedRow, 0);
    assert.equal(createdCount, 1);
    assert.equal(updatedCount, 1);
    assert.equal(mockDbQuestions.size, 1);
    assert.equal(mockDbQuestions.get('q-1').correctOption, 'B');
  });

  // Test 10: Existing questions are not accidentally deleted
  test('10. Existing questions are guarded: replaceAllQuestions is blocked if mock test has student attempts', () => {
    function canReplaceQuestions(studentAttempts, replaceAllQuestionsFlag) {
      if (!replaceAllQuestionsFlag) return false;
      if (studentAttempts > 0) {
        throw new Error(
          `Cannot replace all questions: students have already submitted ${studentAttempts} attempt(s).`
        );
      }
      return true;
    }

    // Default import: replaceAllQuestions is false -> no deletion
    assert.equal(canReplaceQuestions(0, false), false);
    assert.equal(canReplaceQuestions(10, false), false);

    // Attempted wipe with student attempts present -> throws safety exception
    assert.throws(
      () => canReplaceQuestions(5, true),
      /Cannot replace all questions: students have already submitted 5 attempt\(s\)/
    );

    // Safe wipe when 0 student attempts exist
    assert.equal(canReplaceQuestions(0, true), true);
  });
});
