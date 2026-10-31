/**
 * Design Tokens & Color Mapping Helpers for MockShikhar V2
 * Source: MockShikhar_Redesign_Master_Prompt.md & Reference HTMLs
 */

export interface ChipColor {
  bg: string;
  text: string;
  border?: string;
}

export const CATEGORY_COLORS: Record<string, ChipColor> = {
  patwari: { bg: '#CCFBF1', text: '#115E59' },
  police: { bg: '#DBEAFE', text: '#1E40AF' },
  court: { bg: '#EDE9FE', text: '#5B21B6' },
  judiciary: { bg: '#EDE9FE', text: '#5B21B6' },
  tet: { bg: '#FFEDD5', text: '#9A3412' },
  upcoming: { bg: '#EEF0F6', text: '#3F4460' },
  default: { bg: '#EEF1FF', text: '#312E81' },
};

/**
 * Returns the chip background and text color for any exam category or slug
 */
export function getCategoryChipColor(category?: string | null): ChipColor {
  if (!category) return CATEGORY_COLORS.default;
  const normalized = category.toLowerCase().trim();

  if (normalized.includes('patwari')) return CATEGORY_COLORS.patwari;
  if (normalized.includes('police')) return CATEGORY_COLORS.police;
  if (normalized.includes('court') || normalized.includes('judiciar')) return CATEGORY_COLORS.court;
  if (normalized.includes('tet')) return CATEGORY_COLORS.tet;
  if (normalized.includes('upcoming')) return CATEGORY_COLORS.upcoming;

  return CATEGORY_COLORS[normalized] || CATEGORY_COLORS.default;
}

export interface AccuracyColor {
  status: 'success' | 'amber' | 'danger';
  color: string;
  bg: string;
  text: string;
  border: string;
  label?: string;
}

/**
 * Master accuracy color rule:
 * ≥75% success, 60–74% amber, <60% danger
 */
export function getAccuracyColor(accuracy: number): AccuracyColor {
  if (accuracy >= 75) {
    return {
      status: 'success',
      color: '#16A34A',
      bg: '#DCFCE7',
      text: '#166534',
      border: '#BBF7D0',
      label: 'Strong',
    };
  }
  if (accuracy >= 60) {
    return {
      status: 'amber',
      color: '#F59E0B',
      bg: '#FEF3C7',
      text: '#92400E',
      border: '#FDE68A',
      label: 'Average',
    };
  }
  return {
    status: 'danger',
    color: '#DC2626',
    bg: '#FEE2E2',
    text: '#991B1B',
    border: '#FECACA',
    label: 'Weak',
  };
}
