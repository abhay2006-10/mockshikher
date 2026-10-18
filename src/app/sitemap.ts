import type { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mockshikhar.com';

  // 1. Static public canonical pages (only existing, public pages)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/exams`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // 2. Dynamic public exam pages from database (excluding archived)
  let examPages: MetadataRoute.Sitemap = [];
  try {
    const exams = await prisma.exam.findMany({
      where: { isArchived: false },
      select: { slug: true, updatedAt: true },
    });

    examPages = exams.map((exam) => ({
      url: `${baseUrl}/exams/${exam.slug}`,
      lastModified: exam.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Sitemap: Failed to fetch exams from database:', error);
    // Graceful fallback to canonical exams if DB connection is unavailable during static generation
    const fallbackSlugs = ['hp-patwari', 'hp-police-constable', 'hp-judiciary-clerk', 'hp-judiciary-process-server'];
    examPages = fallbackSlugs.map((slug) => ({
      url: `${baseUrl}/exams/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  }

  return [...staticPages, ...examPages];
}
