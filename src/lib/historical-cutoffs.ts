/**
 * Historical Cutoff Benchmark & Safe Score Matrix Reference Data
 * 
 * NOTE: The Cutoff Benchmark & Safe Score Matrix UI has been temporarily removed
 * from the MockShikhar frontend pending verified exam-wise cutoff data and calculation logic.
 * 
 * This file retains the historical reference dataset and TypeScript definitions so they can
 * be readily reintroduced in a future update without data loss.
 */

export interface HistoricalCutoffData {
  examName: string;
  totalMarks: number;
  markingScheme: string;
  cutoffs: {
    UR: number;
    OBC: number;
    SC_ST: number;
    EWS: number;
  };
  recruitmentRef: string;
}

export const HISTORICAL_CUTOFF_DB: Record<string, HistoricalCutoffData> = {
  patwari: {
    examName: 'HP Patwari Examination',
    totalMarks: 100,
    markingScheme: '100 Qs • 100 Marks • Negative Marking: -0.25 (as applicable)',
    cutoffs: { UR: 72.5, OBC: 68.0, SC_ST: 63.5, EWS: 66.0 },
    recruitmentRef: '2019-2022 Revenue Dept Closing Marks (Reference)',
  },
  police: {
    examName: 'HP Police Constable Examination',
    totalMarks: 100,
    markingScheme: '100 Qs • 100 Marks • Negative Marking: -0.25 (as applicable)',
    cutoffs: { UR: 69.0, OBC: 65.5, SC_ST: 60.0, EWS: 63.5 },
    recruitmentRef: '2021-2023 Shimla Police HQ Notification Reference',
  },
  judiciary: {
    examName: 'HP High Court & District Judiciary Clerk',
    totalMarks: 100,
    markingScheme: '100 Qs • 100 Marks • Sectional Evaluation',
    cutoffs: { UR: 74.0, OBC: 70.0, SC_ST: 65.0, EWS: 67.5 },
    recruitmentRef: '2022-2024 High Court Shimla Result Reference',
  },
};
