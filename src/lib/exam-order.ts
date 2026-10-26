import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';
import { LANDING_EXAMS } from '@/lib/landing-exams';

const ORDER_FILE_PATH = path.join(process.cwd(), 'data', 'exam-order.json');

/**
 * Retrieves the custom exam display order set by the admin.
 * Checks PostgreSQL audit_logs first, then data/exam-order.json, then defaults to LANDING_EXAMS.
 */
export async function getCustomExamOrder(): Promise<string[]> {
  try {
    // 1. Try PostgreSQL persistent log
    const orderLog = await prisma.auditLog.findFirst({
      where: { action: 'SYSTEM_EXAM_ORDER' },
      orderBy: { createdAt: 'desc' },
      select: { details: true },
    });

    if (orderLog?.details) {
      const parsed = JSON.parse(orderLog.details);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    // DB might be temporarily offline or unreachable
  }

  // 2. Try local disk fallback
  try {
    if (fs.existsSync(ORDER_FILE_PATH)) {
      const content = fs.readFileSync(ORDER_FILE_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore disk read error
  }

  // 3. Fallback to default LANDING_EXAMS order
  return LANDING_EXAMS.map((e) => e.slug);
}

/**
 * Persists the new custom exam order to both PostgreSQL and disk.
 */
export async function saveCustomExamOrder(
  orderedSlugs: string[],
  authorEmail: string = 'Admin'
): Promise<void> {
  const jsonString = JSON.stringify(orderedSlugs, null, 2);

  // 1. Save to local disk cache
  try {
    const dir = path.dirname(ORDER_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(ORDER_FILE_PATH, jsonString, 'utf8');
  } catch (err) {
    console.warn('Failed to write exam-order.json to disk:', err);
  }

  // 2. Persist to PostgreSQL audit_logs table
  try {
    await prisma.auditLog.create({
      data: {
        action: 'SYSTEM_EXAM_ORDER',
        details: jsonString,
        author: authorEmail,
        status: 'SUCCESS',
      },
    });
  } catch (err) {
    console.warn('Failed to persist SYSTEM_EXAM_ORDER to database:', err);
  }
}

/**
 * Sorts any array of exam objects according to the custom ordered slugs list.
 * Exams in orderedSlugs appear first in their respective order.
 * Any unlisted exams appear at the end.
 * Handles both plain objects with .slug and union types with .exam.slug.
 */
export function sortExamsByCustomOrder<T>(
  exams: T[],
  orderedSlugs: string[],
  getSlug?: (item: T) => string | undefined
): T[] {
  if (!orderedSlugs || orderedSlugs.length === 0) return exams;

  const orderMap = new Map<string, number>();
  orderedSlugs.forEach((slug, index) => {
    orderMap.set(slug, index);
  });

  const extractSlug = (item: any): string => {
    if (getSlug) return getSlug(item) || '';
    if (item?.slug) return item.slug;
    if (item?.exam?.slug) return item.exam.slug;
    return '';
  };

  return [...exams].sort((a, b) => {
    const slugA = extractSlug(a);
    const slugB = extractSlug(b);
    const indexA = orderMap.has(slugA) ? orderMap.get(slugA)! : 9999;
    const indexB = orderMap.has(slugB) ? orderMap.get(slugB)! : 9999;

    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return 0;
  });
}
