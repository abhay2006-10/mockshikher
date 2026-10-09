# Product Requirements Document: Online Mock Test Platform

**Version:** 1.0 (draft) | **Date:** 5 Oct 2026 | **Status:** For review

## 1. Overview

An online mock test platform for competitive and government exam aspirants, starting with HP Police. The core loop is: **Mock Test → Result → Performance Analysis → Mistake Practice → Improvement.**

**Out of scope (permanently):** ERP, coaching or school management, attendance, fees, parent or teacher dashboards, general LMS features.

## 2. Problem and opportunity

Aspirants for state and central government exams often have two poor options: free quizzes with no real exam pattern or analysis, or expensive coaching test series. They want realistic full-length mocks, honest analysis of where they lose marks, and a low price.

## 3. Goals and non-goals

**Goals**

1. Let a new user attempt a full-length free mock within minutes of arriving.
2. Convert free-mock users to the ₹149 bundle by showing the value of the analysis.
3. Make the test experience fast and reliable, including on mobile and slow networks.
4. Give every user a clear picture of weak subjects and topics, and a way to fix them.

**Non-goals (v1):** live classes, video lectures, a community or forum, a native mobile app, multiple bundle tiers, subscriptions, coupons.

## 4. Target users

| Persona | Needs |
| --- | --- |
| **Aspirant (primary)** | Realistic mocks, instant results, Hindi and English, mobile-first use, low price |
| **Admin / content manager** | Create exams and tests, add or bulk-import questions, see sales and usage |

## 5. Business model

- Per exam: **Mock 1 free, Mocks 2–20 premium.**
- **Bundle: 20 full mock tests for ₹149** (one-time payment, unlimited reattempts).
- Mock 1 must be full-length and genuinely good, since it is the sales pitch.
- Upgrade prompt after the free test: "Liked the test? Unlock all 20 mock tests for ₹149." It is shown once on the result page and on locked tests, and never as a blocking pop-up.

**Open question:** is the ₹149 bundle per exam or valid across all exams? This PRD assumes **per exam**.

## 6. Success metrics

| Metric | Target (first 3 months, to be validated) |
| --- | --- |
| Visitor → free test started | 25% |
| Free test started → submitted | 70% |
| Free test submitted → purchase | 8–12% |
| Test crash or data-loss reports | \< 0.5% of attempts |
| Median test page interaction latency | \< 200 ms |
| Payment success rate (initiated → verified) | > 90% |

## 7. Functional requirements

Priority: **P0** = required for launch, **P1** = shortly after launch, **P2** = later.

### 7.1 Public pages

| ID | Requirement | Priority |
| --- | --- | --- |
| PUB-1 | Landing page with the agreed headline, subtitle, "Explore Exams" and "Try a Free Mock" buttons, trust section and popular exams | P0 |
| PUB-2 | Exam list with search ("Search exam…") and filters: All, Popular, HP Exams, Central Government, Technical, Non-Technical | P0 |
| PUB-3 | Exam card shows name, description, number of mocks, questions, duration, difficulty, free test badge and price, with a "View Tests" button | P0 |
| PUB-4 | Exam details page with description, pattern, questions, duration, negative marking, subjects, difficulty and 20 test cards (Mock 1 free, others locked) | P0 |
| PUB-5 | Pricing page with the ₹149 bundle card and feature list | P0 |
| PUB-6 | Basic SEO: titles, meta descriptions, clean URLs and headings on home, exam, pricing and public test pages | P0 |

### 7.2 Authentication and profile

| ID | Requirement | Priority |
| --- | --- | --- |
| AUTH-1 | Sign up, log in, log out, forgot and reset password | P0 |
| AUTH-2 | Secure sessions, password hashing, expired-session handling that sends the user back to login without losing an in-progress test | P0 |
| AUTH-3 | Profile page (name, email, password change) | P0 |
| AUTH-4 | Protected user pages and role-based admin access | P0 |

### 7.3 Test engine

| ID | Requirement | Priority |
| --- | --- | --- |
| TEST-1 | Instructions page shows test name, questions, duration, marks, negative marking, total marks and rules. The test never starts automatically | P0 |
| TEST-2 | Desktop layout: top bar (logo, exam, test, timer, submit), question area, right-side question palette | P0 |
| TEST-3 | Palette states: Not Visited, Not Answered, Answered, Marked for Review, Answered + Marked. Each state has a shape or icon in addition to colour | P0 |
| TEST-4 | Controls: Previous, Next, Clear Response, Mark for Review, Submit | P0 |
| TEST-5 | Server-owned timer: start time and deadline are stored on the server. The browser timer is for display only. Refresh or device change resumes the same attempt with the correct time left | P0 |
| TEST-6 | Low-time warning, automatic submission at zero | P0 |
| TEST-7 | Every selected answer saves immediately. Answers survive navigation, palette use, review marking and language switching | P0 |
| TEST-8 | Submit confirmation showing Answered, Not Answered and Marked for Review counts, with "Continue Test" and "Submit Test" | P0 |
| TEST-9 | Dedicated mobile layout: compact header (test name, Question x/y, timer), sticky bottom bar (Previous, Mark, Next), palette as a bottom sheet, one-handed use | P0 |
| TEST-10 | English/Hindi toggle inside the test without losing answers | P0 |
| TEST-11 | Correct answers and explanations are never sent to the browser before submission | P0 |
| TEST-12 | Offline tolerance: answers queue locally and sync when the connection returns, with a visible "saving / saved / offline" indicator | P1 |
| TEST-13 | Keyboard shortcuts (next, previous, select option) on desktop | P1 |

### 7.4 Results and analysis

| ID | Requirement | Priority |
| --- | --- | --- |
| RES-1 | Result page: score (for example 68 / 90), percentage, correct, wrong, unanswered, accuracy, time taken | P0 |
| RES-2 | Rank and percentile appear only when enough real attempts exist (minimum set in config, suggested 30). Otherwise they are hidden. No fake data | P0 |
| RES-3 | Analysis page: overall performance (score, accuracy, speed, time management), subject-wise performance with charts, topic-wise performance | P0 |
| RES-4 | Strengths and weaknesses derived from the user's actual data | P0 |
| RES-5 | Recommendations generated by rules from real data (for example, subject accuracy well below overall accuracy triggers a practice suggestion for that subject's weak topics) | P0 |
| RES-6 | Question-wise review: question, options, user's answer, correct answer, status, subject, topic, difficulty, time spent, expected time, explanation | P0 |
| RES-7 | From review: "Add to Mistake Book" and "Bookmark" | P0 |
| RES-8 | Upgrade section on the free test result page | P0 |

### 7.5 Practice tools

| ID | Requirement | Priority |
| --- | --- | --- |
| PRAC-1 | Mistake Book: wrong questions added automatically on submission, or manually. Shows question, subject, topic, difficulty, correct answer, explanation. Filters by subject, topic, difficulty. Actions: Practice, Remove, Bookmark | P0 |
| PRAC-2 | "Practice My Mistakes" builds an untimed or timed session from saved questions | P0 |
| PRAC-3 | Bookmarks page with filters by subject and topic and actions Practice, Remove Bookmark | P0 |
| PRAC-4 | Practice-session results update the Mistake Book (a question answered correctly can be marked "mastered" or removed by the user) | P1 |

### 7.6 Performance and history

| ID | Requirement | Priority |
| --- | --- | --- |
| PERF-1 | My Performance dashboard: tests attempted, average score, best score, average accuracy, average time, current streak | P0 |
| PERF-2 | Charts: score trend, accuracy trend, subject performance, weak topics | P0 |
| PERF-3 | Test history list with mock, exam, score, accuracy, date, time taken and actions View Result and Reattempt | P0 |
| PERF-4 | Leaderboard per test with rank, user, score, accuracy, time. If there is not enough data, show "Leaderboard will appear once enough students attempt this test." | P1 |

### 7.7 Payments

| ID | Requirement | Priority |
| --- | --- | --- |
| PAY-1 | Flow: user clicks purchase → backend creates order → Razorpay checkout → backend verifies signature and status → purchase stored → tests unlock → confirmation shown | P0 |
| PAY-2 | The frontend's payment-success message is never trusted | P0 |
| PAY-3 | Handle failure, cancellation, retry, duplicate payment (idempotent) and already-purchased users | P0 |
| PAY-4 | Webhook as a backup so a paid user is unlocked even if they close the browser | P0 |
| PAY-5 | Gateway abstraction so another provider can be added later | P1 |
| PAY-6 | Development test mode, clearly labelled, whose purchases are flagged as test and excluded from revenue reports | P0 |
| PAY-7 | Payment confirmation email or on-screen receipt | P1 |
| PAY-8 | Refund handling process (manual by admin in v1) | P1 |

### 7.8 Admin panel (role-protected)

| ID | Requirement | Priority |
| --- | --- | --- |
| ADM-1 | Create, edit, archive exams | P0 |
| ADM-2 | Create, edit, publish and unpublish mock tests | P0 |
| ADM-3 | Create, edit, delete questions with the full bilingual form: question, Hindi question, options A–D with Hindi versions, correct answer, subject, topic, difficulty, marks, negative marks, explanation, Hindi explanation, question image, solution image | P0 |
| ADM-4 | Manage subjects and topics | P0 |
| ADM-5 | Bulk import via CSV and Excel with the column set from the spec. A validation preview detects missing questions, missing options, invalid correct answer, duplicates, missing subject, invalid difficulty, invalid marks. Invalid rows are never imported | P0 |
| ADM-6 | View users, purchases, payments, test attempts | P0 |
| ADM-7 | Basic statistics: attempts per test, average scores, revenue (excluding test-mode payments) | P1 |
| ADM-8 | Publishing guard: a test cannot be published unless it has its required number of valid questions | P0 |

## 8. Scoring rules

- Marks per correct answer and negative marks per wrong answer come from the question or exam configuration, not from code.
- Unanswered questions score zero.
- **Score** = sum of marks for correct answers − sum of negative marks for wrong answers.
- **Percentage** = score ÷ total marks × 100.
- **Accuracy** = correct ÷ (correct + wrong) × 100.
- Subject-wise and topic-wise scores and accuracy use the same rules.
- All scoring happens on the server at submission. The browser never decides the score.

## 9. Data model (relational)

Core entities: `users`, `exams`, `subjects`, `topics`, `mock_tests`, `questions`, `question_options`, `test_attempts`, `user_answers`, `bookmarks`, `mistake_book`, `purchases`, `payments`.

Leaderboards and user performance are **derived** from `test_attempts` and `user_answers` (views or cached aggregates) so numbers cannot drift out of sync.

Key relationships:

- An exam has many subjects and mock tests. A subject has many topics.
- A mock test has many questions. A question has four options and belongs to one subject and topic.
- A user has many attempts. An attempt has many answers, each with selected option, review flag and time spent.
- A purchase links a user to an exam bundle and to a verified payment. A payment has a unique gateway order ID and payment ID.

## 10. Non-functional requirements

- **Security:** hashed passwords, role-based authorization on every admin and premium endpoint, input validation on all inputs, rate limiting on login and payment endpoints, secrets only on the server, premium question content never returned without a valid purchase.
- **Performance:** fast public pages, lazy-loaded charts, pagination on long lists, efficient queries with indexes, the test screen loads all questions for the attempt once and stays responsive afterwards.
- **Reliability:** no lost answers on refresh, network drop, or tab close. Timer expiry auto-submits.
- **Responsive:** desktop, laptop, tablet, mobile. Mobile test experience is a separate layout, not a shrunk desktop page.
- **Accessibility:** readable fonts, strong contrast, visible focus, labelled controls, keyboard support, question status never conveyed by colour alone.
- **Privacy and compliance:** privacy policy, terms, refund policy pages; minimal personal data; payment card data never touches our servers.
- **SEO:** server-rendered public pages with unique titles and descriptions.

## 11. Required states

Loading skeletons, no exams, no tests, no mistakes, no bookmarks, no history, payment failed, payment successful, network error, unauthorized, 404, admin unauthorized.

## 12. Content requirements

- Launch with **HP Police, Mock 1 (full-length, 90 questions)**. Mocks 2–20 are created as shells and published only when complete.
- Questions must be original or properly licensed. Demo or sample content is clearly labelled.
- Every question needs subject, topic, difficulty, explanation and Hindi text. A Hindi review pass is required before publishing.

## 13. Release plan

| Release | Contents |
| --- | --- |
| **MVP / launch** | All P0 items, one exam (HP Police), Mock 1 full, as many premium mocks as are ready |
| **v1.1** | Leaderboard, offline queueing, keyboard shortcuts, receipts, admin statistics |
| **v1.2** | More exams, multi-exam bundles, coupons |

## 14. Risks

| Risk | Mitigation |
| --- | --- |
| Content volume (1,800 questions per exam) | Phased publishing, bulk import, publish guard |
| Copyright of questions | Original or licensed content only |
| Hindi translation errors | Review pass before publishing |
| Razorpay activation delay | Start business verification early, use test mode meanwhile |
| Cheating or answer sharing | Server-side answers and timer, no answers before submission, attempt logging |
| Low conversion | Make Mock 1 excellent, show analysis value clearly, A/B test the upgrade prompt |

## 15. Open questions

1. Is ₹149 per exam or for all exams?
2. Is purchase lifetime or time-limited (for example 6 or 12 months)?
3. Minimum attempts before rankings and percentiles show (suggested 30)?
4. Is Google or phone-OTP login wanted, in addition to email and password?
5. Refund policy: none, or a short window?
6. Is the exam pattern for HP Police (90 questions, 90 minutes) confirmed, and what is the negative marking?
7. Who writes and reviews questions, and who owns the Hindi review?
8. Brand name and domain?

## 16. Acceptance criteria for launch

The full journey must pass: sign up → browse → open HP Police → free mock → answer, navigate, mark for review → submit → result → analysis → review wrong questions → add mistakes and bookmarks → purchase ₹149 → payment verified → premium unlocks → premium attempt → history. Also verified: mobile and desktop, slow network, invalid inputs, payment failure, duplicate payment, unauthorized admin access, expired session, timer expiry, and refresh during a test.