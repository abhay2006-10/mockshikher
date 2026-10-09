# Mockshikhar Admin Guide
## Complete Step-by-Step Guide for Non-Technical Users

---

## Part 1: How to Log In as Admin

### Step 1 — Open the Admin Panel
Open your browser and go to:
```
http://localhost:3000/admin
```

### Step 2 — Log In with Admin Credentials

You will be redirected to the Login page. Enter your **admin email and password**.

**For demo/development mode**, use any email that contains the word `admin`:
```
Email:    admin@mockshikhar.com
Password: admin123
```

> **Note:** Once a real PostgreSQL database is connected, you must create your admin user through the registration API (see below). In demo mode, any email containing "admin" automatically gets admin privileges.

### Step 3 — Access the Admin Centre
After logging in, you will see the **Admin Control Centre** with quick-access cards for:
- **Question Bank** — view, search, filter, edit, and delete questions
- **Bulk CSV/Excel Importer** — upload hundreds of questions at once
- **Publishing Control** — publish mock tests when they are ready

---

## Part 2: How to Create an Admin Account

### Option A — Using Demo Mode (No Database Needed)
Log in with any email containing the word `admin` and a password of at least 6 characters.

### Option B — Using the Registration API (Real Database)
1. Register normally via `/auth/signup`
2. Then run this in your database (PostgreSQL):
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
   ```

---

## Part 3: How to Add Questions (3 Methods)

### Method A — Add a Single Question (Best for 1–5 Questions)

1. Go to **Admin → Question Bank → "Add Single Question" tab**
2. Fill in the form:
   - **Target Exam** — select `HP Police Constable 2026` (or another exam)
   - **Target Mock Test** — select `Mock 1`, `Mock 2`, etc.
   - **Question Text (English)** — type the question in English
   - **Question Text (हिन्दी)** — type the same question in Hindi (Devanagari script — your keyboard or Google Input Tools)
   - **Option A, B, C, D** — fill English and Hindi for each
   - **Correct Answer** — click the radio button (Option A / B / C / D)
   - **Subject** — select from the dropdown (e.g. `General Awareness`)
   - **Topic** — type the specific topic (e.g. `Geography of HP`)
   - **Difficulty** — Easy / Medium / Hard
   - **Marks** — default is `1.0`
   - **Explanation (English and Hindi)** — optional but strongly recommended
3. Click **"Save Question to Database Bank"**

✅ The question is immediately saved and visible in the Question Bank.

---

### Method B — Bulk Import from CSV or Excel (Best for 10–500+ Questions)

#### Step 1 — Download the Template File
1. Click the **"Download CSV Template"** button at the top of the Questions page
2. Open the downloaded file `mockshikhar_template.csv` in Excel, Google Sheets, or LibreOffice Calc

#### Step 2 — Fill in the Template

The template has **20 columns**. The 5 sample rows show you the exact format. Here's what each column means:

| Column | Description | Example |
|--------|-------------|---------|
| `exam` | Exam slug (from admin panel) | `hp-police-constable` |
| `mock_test_number` | Which mock test (1, 2, 3...) | `1` |
| `question` | Question in English | `What is the capital of HP?` |
| `hindi_question` | Same question in Hindi | `हिमाचल प्रदेश की राजधानी क्या है?` |
| `option_a` to `option_d` | 4 English options | `Shimla` |
| `hindi_option_a` to `hindi_option_d` | 4 Hindi options | `शिमला` |
| `correct_answer` | Must be exactly `A`, `B`, `C`, or `D` | `A` |
| `subject` | Subject name | `General Awareness` |
| `topic` | Topic within subject | `Geography of HP` |
| `difficulty` | Must be `EASY`, `MEDIUM`, or `HARD` | `MEDIUM` |
| `marks` | Marks for correct answer | `1.0` |
| `negative_marks` | Marks deducted for wrong answer | `0.25` |
| `explanation` | English explanation | `Shimla is the summer capital.` |
| `hindi_explanation` | Hindi explanation | `शिमला ग्रीष्मकालीन राजधानी है।` |

> **Important Rules for the CSV:**
> - Use UTF-8 encoding (save as "CSV UTF-8" in Excel)
> - Wrap any cell containing commas in **double quotes**: `"Option A, B or C"`
> - Hindi text works automatically with proper UTF-8 encoding
> - `correct_answer` must be exactly `A`, `B`, `C` or `D` — not `Option A`, not `a`
> - `difficulty` must be `EASY`, `MEDIUM`, or `HARD` (capital letters)

#### Step 3 — Upload the File
1. Go to **Admin → Question Bank → "Bulk CSV / Excel Import" tab**
2. Click the dropzone (or drag and drop your CSV/Excel file)
3. The system will **automatically validate every row** — this takes 2–5 seconds

#### Step 4 — Review the Validation Preview
After upload, you will see a **Validation Preview Table** showing:
- 🟢 **VALID** — row is ready to import
- 🔴 **ERROR** — row has a problem; the exact error message is shown

**Common errors and how to fix them:**
| Error | Fix |
|-------|-----|
| `correct_answer must be A, B, C or D` | Change `Option A` → `A` |
| `mock_test_number must be a positive integer` | Make sure it's a number like `1` not `Mock 1` |
| `Question text is required` | Fill in the `question` column |
| `difficulty must be EASY, MEDIUM or HARD` | Check spelling — must be all capitals |
| `Duplicate question found within this upload file` | Remove the duplicate row from your file |

#### Step 5 — Download Error Report (If Needed)
If some rows have errors, click **"Download Error Report CSV"** to get a detailed report you can use to fix the original file.

#### Step 6 — Import Valid Rows
Click **"Import [N] Valid Questions Now"** to commit valid rows to the database.

> ✅ Only valid rows are imported. Invalid rows are automatically skipped.  
> ✅ The import is safe to repeat — duplicate questions are detected and skipped.

---

### Method C — Upload an Excel File (.xlsx)
Same process as CSV — the system accepts `.xlsx` (Excel) files directly without conversion. Just upload the Excel file in Step 3 above.

---

## Part 4: How to Publish a Mock Test

A mock test must be **fully complete before publishing**. Students can never see unpublished tests.

### The Safety Rule
A mock test with 90 required questions **cannot be published with fewer than 90 questions**. The system will block it and show exactly how many questions are missing.

### Step-by-Step Publishing
1. Go to **Admin → Question Bank → "Publishing & Readiness" tab**
2. You will see all mock tests with:
   - A **progress bar** showing `current / required` questions
   - A **percentage** (e.g. `45/90 — 50%`)
   - How many questions are missing
3. When a mock test shows **90/90 (100%)**, the **"Publish Test to Students"** button becomes enabled
4. Click **"Publish Test to Students"** — the test immediately becomes visible to all students

### To Unpublish
Click **"Unpublish Test"** on any published test. Students will immediately lose access (their old attempts and scores are preserved).

---

## Part 5: How to Fix Import Errors

### Step 1 — Download the Error Report
After uploading a CSV, if there are errors, click the red **"Download Error Report CSV"** button. The report shows:
- Row number
- What's wrong
- The question text that had the error

### Step 2 — Open Your Original File
Open the original CSV in Excel or Google Sheets.

### Step 3 — Fix the Errors
Go to each row number mentioned in the error report and fix the issue.

**Most common fixes:**
- Column `correct_answer`: change `Option B` → `B`
- Column `difficulty`: change `medium` → `MEDIUM`
- Column `mock_test_number`: change `Mock 2` → `2`
- Missing question text: fill in the `question` column

### Step 4 — Re-upload
You can safely re-upload the corrected file. The system will:
1. Skip questions that already exist in the database (no duplicates)
2. Import only new valid rows

---

## Part 6: How to Search and Manage Questions

### In the Question Bank Tab
- **Search box** — type any keyword (English or Hindi) to find questions instantly
- **Filter by Mock Test** — narrow down by Mock 1, Mock 2, etc.
- **Filter by Subject** — show only Maths, English, etc.
- **Filter by Difficulty** — show only Easy, Medium, or Hard
- **Language toggle** — switch between English and Hindi view

### Available Actions Per Question
| Button | Action |
|--------|--------|
| ↔ Move | Move the question to a different mock test |
| 🗑 Delete | Permanently delete the question |

---

## Part 7: Sample CSV for Quick Testing

Copy and paste this into a `.csv` file (save as UTF-8) to test the import:

```csv
exam,mock_test_number,question,hindi_question,option_a,option_b,option_c,option_d,hindi_option_a,hindi_option_b,hindi_option_c,hindi_option_d,correct_answer,subject,topic,difficulty,marks,negative_marks,explanation,hindi_explanation
hp-police-constable,1,"Which is the highest peak in Himachal Pradesh?","हिमाचल प्रदेश की सबसे ऊंची चोटी कौन सी है?","Reo Purgyil","Shilla","Manirang","Mrikula","रियो पुर्गिल","शिल्ला","मनीरंग","मृकुला",A,General Awareness,Geography of HP,MEDIUM,1.0,0.25,"Reo Purgyil is 6816m in Kinnaur district.","रियो पुर्गिल किन्नौर में 6816 मीटर ऊंचा है।"
hp-police-constable,1,"What is the sum of angles in a triangle?","त्रिभुज के कोणों का योग कितना होता है?","90°","180°","270°","360°","90°","180°","270°","360°",B,Maths & Science,Geometry,EASY,1.0,0.25,"Interior angles of a triangle sum to 180°.","त्रिभुज के आंतरिक कोणों का योग 180° होता है।"
hp-police-constable,1,"Identify the antonym of ABUNDANT:","ABUNDANT का विलोम शब्द चुनें:","Plentiful","Scarce","Copious","Ample","Plentiful (भरपूर)","Scarce (दुर्लभ)","Copious (प्रचुर)","Ample (पर्याप्त)",B,English Language,Vocabulary & Antonyms,EASY,1.0,0.25,"Abundant means plentiful. Scarce means insufficient.","Abundant का अर्थ प्रचुर है। Scarce इसका विलोम है।"
hp-police-constable,1,"निम्न में 'सूर्य' का पर्यायवाची नहीं है:","निम्न में 'सूर्य' का पर्यायवाची नहीं है:","दिनकर","भास्कर","निशाकर","रवि","दिनकर","भास्कर","निशाकर","रवि",C,Hindi Language,पर्यायवाची शब्द,EASY,1.0,0.25,"निशाकर चंद्रमा का पर्यायवाची है।","निशाकर चंद्रमा का पर्यायवाची है, सूर्य का नहीं।"
hp-police-constable,1,"Chemical symbol for Gold?","सोने का रासायनिक प्रतीक क्या है?","Ag","Au","Fe","Pb","Ag","Au","Fe","Pb",B,Maths & Science,Chemistry,EASY,1.0,0.25,"Au comes from Latin 'Aurum' meaning gold.","Au लैटिन शब्द 'Aurum' से है जिसका अर्थ सोना है।"
```

---

## Part 8: Security & Data Safety

- ✅ The admin area (`/admin`) is protected by server-side middleware — non-admin users are immediately redirected to the home page
- ✅ All admin API routes (`/api/admin/*`) verify admin role on every request
- ✅ Student results are stored with a **snapshot** of the question and correct answer at time of attempt — editing a question later does NOT change old results
- ✅ Bulk imports run inside database transactions — if anything fails midway, no partial data is saved
- ✅ Duplicate detection prevents the same question from being imported twice
- ✅ Images are validated for type (PNG, JPG, WEBP) and size (max 5MB) before storage

---

## Quick Reference — Admin URLs

| Page | URL |
|------|-----|
| Admin Home | `/admin` |
| Question Bank + Authoring | `/admin/questions` |
| Exams List | `/admin/exams` |
| Download CSV Template | `/api/admin/questions/template` |
| Student Home | `/` |
| Login | `/auth/login` |
