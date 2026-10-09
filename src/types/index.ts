export type UserRole = 'USER' | 'ADMIN';

// ============ Auth Types ============
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
}

// ============ Exam Types ============
export interface ExamCard {
  id: string;
  name: string;
  nameHi?: string | null;
  slug: string;
  description: string;
  totalQuestions: number;
  durationMinutes: number;
  difficulty: string;
  price: number;
  isPopular: boolean;
  category: string;
  negativeMarking: number;
  marksPerQuestion: number;
  mockTestCount: number;
  freeTestAvailable: boolean;
}

export interface ExamDetail extends ExamCard {
  descriptionHi?: string | null;
  subjects: SubjectWithTopics[];
  mockTests: MockTestCard[];
}

// ============ Subject / Topic Types ============
export interface SubjectInfo {
  id: string;
  name: string;
  nameHi?: string | null;
}

export interface TopicInfo {
  id: string;
  name: string;
  nameHi?: string | null;
  subjectId: string;
}

export interface SubjectWithTopics extends SubjectInfo {
  topics: TopicInfo[];
}

// ============ Mock Test Types ============
export interface MockTestCard {
  id: string;
  name: string;
  testNumber: number;
  isFree: boolean;
  isPublished: boolean;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
}

// ============ Test Engine Types ============
export interface TestQuestion {
  id: string;
  questionNumber: number;
  questionText: string;
  questionTextHi?: string | null;
  questionImage?: string | null;
  marks: number;
  negativeMarks: number;
  difficulty: string;
  subject: SubjectInfo;
  topic: TopicInfo;
  options: TestOption[];
}

export interface TestOption {
  id: string;
  optionLabel: string;
  optionText: string;
  optionTextHi?: string | null;
}

export interface AttemptState {
  attemptId: string;
  mockTestId: string;
  testName: string;
  examName: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  startedAt: string;
  deadline: string;
  questions: TestQuestion[];
  answers: Record<string, AnswerState>;
}

export interface AnswerState {
  questionId: string;
  selectedOption: string | null;
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
  status: string;
}

// ============ Results Types ============
export interface TestResult {
  attemptId: string;
  testName: string;
  examName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  accuracy: number;
  timeTakenSeconds: number;
  totalQuestions: number;
  rank?: number | null;
  percentile?: number | null;
  showRanking: boolean;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  subjectNameHi?: string | null;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  totalMarks: number;
  accuracy: number;
  percentage: number;
  avgTimePerQuestion: number;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  topicNameHi?: string | null;
  subjectName: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  accuracy: number;
  isWeak: boolean;
}

export interface QuestionReview {
  id: string;
  questionNumber: number;
  questionText: string;
  questionTextHi?: string | null;
  questionImage?: string | null;
  options: TestOption[];
  correctOption: string;
  userAnswer: string | null;
  isCorrect: boolean;
  status: string;
  marks: number;
  negativeMarks: number;
  marksObtained: number;
  subject: SubjectInfo;
  topic: TopicInfo;
  difficulty: string;
  timeSpentSeconds: number;
  explanation?: string | null;
  explanationHi?: string | null;
  solutionImage?: string | null;
  isBookmarked: boolean;
  isInMistakeBook: boolean;
}

// ============ Dashboard Types ============
export interface PerformanceSummary {
  testsAttempted: number;
  averageScore: number;
  bestScore: number;
  averageAccuracy: number;
  averageTime: number;
  currentStreak: number;
}

export interface TestHistoryItem {
  attemptId: string;
  mockTestName: string;
  examName: string;
  examSlug: string;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  timeTakenSeconds: number;
  submittedAt: string;
}

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============ Pagination ============
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ Filter Types ============
export type ExamCategory = 'All' | 'Popular' | 'HP Exams' | 'Central Government' | 'Technical' | 'Non-Technical';

export const EXAM_CATEGORIES: ExamCategory[] = [
  'All',
  'Popular',
  'HP Exams',
  'Central Government',
  'Technical',
  'Non-Technical',
];
