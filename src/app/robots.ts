import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://mockshikhar.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/admin',
          '/admin/',
          '/test',
          '/test/',
          '/api',
          '/api/',
          '/auth',
          '/auth/',
          '/button-audit',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
