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
    name: 'HP Forest Guard',
    description: 'Practice series focused on Environment, HP Geography, Forest laws, General Science and Elementary Mathematics.',
    category: 'Forestry',
    isComingSoon: true,
  },
  {
    slug: 'hp-panchayat-secretary',
    name: 'Panchayat Secretary',
    description: 'Mock series for HP Panchayati Raj department recruitment covering GK, Hindi, Mathematics and reasoning.',
    category: 'Panchayat',
    isComingSoon: true,
  },
];
