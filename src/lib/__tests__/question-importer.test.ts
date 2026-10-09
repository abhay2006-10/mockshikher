import {
  parseCsvText,
  validateImportRows,
  generateTemplateCsv,
  ImportRow,
} from '../question-importer';

describe('Question Importer & Validation Engine', () => {
  it('should generate template CSV with 20 columns and sample rows', () => {
    const csv = generateTemplateCsv();
    expect(csv).toContain('exam,mock_test_number,question');
    expect(csv).toContain('hp-police-constable');
    expect(csv).toContain('हिमाचल प्रदेश');
  });

  it('should parse bilingual CSV text with quotes and Devanagari UTF-8 properly', () => {
    const csvData = `exam,mock_test_number,question,hindi_question,option_a,option_b,option_c,option_d,hindi_option_a,hindi_option_b,hindi_option_c,hindi_option_d,correct_answer,subject,topic,difficulty,marks,negative_marks,explanation,hindi_explanation
hp-police-constable,1,"What is capital of HP?","हिमाचल प्रदेश की राजधानी क्या है?","Shimla","Manali","Dharamshala","Mandi","शिमला","मनाली","धर्मशाला","मंडी",A,"General Awareness","Geography",EASY,1.0,0.25,"Shimla is the summer capital.","शिमला राजधानी है।"`;

    const parsed = parseCsvText(csvData);
    expect(parsed.length).toBe(1);
    expect(parsed[0].question).toBe('What is capital of HP?');
    expect(parsed[0].hindi_question).toBe('हिमाचल प्रदेश की राजधानी क्या है?');
    expect(parsed[0].correct_answer).toBe('A');
    expect(parsed[0].option_a).toBe('Shimla');
    expect(parsed[0].hindi_option_a).toBe('शिमला');
  });

  it('should detect validation errors for invalid rows', () => {
    const invalidRows: ImportRow[] = [
      {
        exam: '',
        mock_test_number: 0,
        question: '',
        option_a: '',
        option_b: 'B',
        option_c: 'C',
        option_d: 'D',
        correct_answer: 'Z', // Invalid answer
        subject: '',
        topic: '',
        difficulty: 'SUPER_HARD', // Invalid difficulty
        marks: -5, // Invalid marks
      },
    ];

    const validation = validateImportRows(invalidRows);
    expect(validation.totalRows).toBe(1);
    expect(validation.validRows).toBe(0);
    expect(validation.invalidRows).toBe(1);

    const rowErrors = validation.results[0].errors;
    expect(rowErrors.some((e) => e.includes('Exam slug'))).toBe(true);
    expect(rowErrors.some((e) => e.includes('positive integer'))).toBe(true);
    expect(rowErrors.some((e) => e.includes('Question text is required'))).toBe(true);
    expect(rowErrors.some((e) => e.includes('Option A text is missing'))).toBe(true);
    expect(rowErrors.some((e) => e.includes('must be one of'))).toBe(true);
    expect(rowErrors.some((e) => e.includes('Subject name is required'))).toBe(true);
    expect(rowErrors.some((e) => e.includes('difficulty must be'))).toBe(true);
  });

  it('should detect duplicates within the same upload file', () => {
    const rowsWithDuplicates: ImportRow[] = [
      {
        exam: 'hp-police-constable',
        mock_test_number: 1,
        question: 'Duplicate Question 1',
        option_a: 'A',
        option_b: 'B',
        option_c: 'C',
        option_d: 'D',
        correct_answer: 'A',
        subject: 'General Awareness',
        topic: 'General',
      },
      {
        exam: 'hp-police-constable',
        mock_test_number: 1,
        question: 'Duplicate Question 1',
        option_a: 'A',
        option_b: 'B',
        option_c: 'C',
        option_d: 'D',
        correct_answer: 'A',
        subject: 'General Awareness',
        topic: 'General',
      },
    ];

    const validation = validateImportRows(rowsWithDuplicates);
    expect(validation.validRows).toBe(1);
    expect(validation.invalidRows).toBe(1);
    expect(validation.duplicateRows).toBe(1);
    expect(validation.results[1].errors[0]).toContain('Duplicate question found');
  });
});
