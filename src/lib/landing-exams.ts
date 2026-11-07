/**
 * Landing page exam showcase config.
 * Defines the 6 exams to show on the home page in order.
 * "slug" must match the database slug for real exams.
 * "isComingSoon: true" → shows Coming Soon card without fake numbers.
 */
export interface LandingExamConfig {
  slug: string;
  /** Display name for Coming Soon cards */
  name: string;
  /** Short one-line description for Coming Soon cards */
  description: string;
  /** Category label shown in badge */
  category: string;
  isComingSoon?: boolean;
}

export const LANDING_EXAMS: LandingExamConfig[] = [
  {
    slug: 'hpas',
    name: 'HPAS / HPPSC Prelims 2026',
    description: 'Official HPPSC HPAS preliminary test series with 10 full-length mocks, 200 marks, 120 minutes and 0.67 negative marking.',
    category: 'Administrative Services',
  },
  {
    slug: 'army-agniveer-gd',
    name: 'Indian Army Agniveer GD 2026',
    description: 'Official pattern Indian Army Agniveer General Duty CEE with 50 questions, 100 marks, 60 minutes and 0.50 negative marking.',
    category: 'Defence Exams',
  },
  {
    slug: 'hp-patwari',
    name: 'HP Patwari Examination',
    description: 'Targeted series for HP Revenue Department Patwari recruitment with arithmetic, GK and language sections.',
    category: 'State Revenue',
  },
  {
    slug: 'hp-police-constable',
    name: 'HP Police Constable 2026',
    description: 'Complete mock test series strictly per latest HP Police Constable recruitment pattern with bilingual questions.',
    category: 'Police Exams',
  },
  {
    slug: 'hp-tet-tgt-medical',
    name: 'HP TET TGT Medical 2026',
    description: 'Comprehensive test series for HP TET TGT Medical covering Child Pedagogy, HP GK, Biology and Chemistry.',
    category: 'HP TET Exams',
  },
  {
    slug: 'hp-tet-tgt-non-medical',
    name: 'HP TET TGT Non-Medical 2026',
    description: 'Targeted mock series for HP TET TGT Non-Medical covering Child Pedagogy, HP GK, Mathematics, Physics & Chemistry.',
    category: 'HP TET Exams',
  },
  {
    slug: 'hp-tet-tgt-arts',
    name: 'HP TET TGT Arts 2026',
    description: 'Official test series for HP TET TGT Arts covering Child Pedagogy, HP GK, English Literature, and Social Studies.',
    category: 'HP TET Exams',
  },
  {
    slug: 'hp-tet-jbt',
    name: 'HP TET JBT / D.El.Ed 2026',
    description: 'Full-length practice mocks for HP TET JBT covering Child Pedagogy, Hindi, English, Mathematics, and EVS & HP GK.',
    category: 'HP TET Exams',
  },
  {
    slug: 'hp-judiciary-clerk',
    name: 'HP Judiciary Clerk',
    description: 'Full-length practice tests for HP High Court & District Judiciary Clerk / Proof Reader examination per official pattern.',
    category: 'Court Exams',
  },
  {
    slug: 'hp-judiciary-process-server',
    name: 'HP Judiciary Process Server',
    description: 'Comprehensive mock series for HP High Court & Subordinate Courts Process Server / Bailiff recruitment.',
    category: 'Court Exams',
  },
  {
    slug: 'hp-forest-guard',
    name: 'HP Forest Guard / Assistant Forest Guard 2026',
    description: 'Official pattern test series with 10 full-length mocks, 100 questions, 100 marks, 90 minutes and no negative marking.',
    category: 'Forestry',
  },
  {
    slug: 'hp-panchayat-secretary',
    name: 'Panchayat Secretary',
    description: 'Mock series for HP Panchayati Raj department recruitment covering GK, Hindi, Mathematics and reasoning.',
    category: 'Panchayat',
    isComingSoon: true,
  },
];
