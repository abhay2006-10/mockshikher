import test from 'node:test';
import assert from 'node:assert/strict';

// Helper replicate from src/app/admin/users/page.tsx
function getWhatsAppUrl(phoneStr) {
  if (!phoneStr) return '#';
  let digits = phoneStr.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.startsWith('91') && digits.length === 12) {
    return `https://wa.me/${digits}`;
  }
  if (digits.length === 10) {
    return `https://wa.me/91${digits}`;
  }
  return `https://wa.me/${digits}`;
}

// Replicate from src/lib/exam-order.ts
function sortExamsByCustomOrder(exams, orderedSlugs, getSlug) {
  if (!orderedSlugs || orderedSlugs.length === 0) return exams;

  const orderMap = new Map();
  orderedSlugs.forEach((slug, index) => {
    orderMap.set(slug, index);
  });

  const extractSlug = (item) => {
    if (getSlug) return getSlug(item) || '';
    if (item?.slug) return item.slug;
    if (item?.exam?.slug) return item.exam.slug;
    return '';
  };

  return [...exams].sort((a, b) => {
    const slugA = extractSlug(a);
    const slugB = extractSlug(b);
    const indexA = orderMap.has(slugA) ? orderMap.get(slugA) : 9999;
    const indexB = orderMap.has(slugB) ? orderMap.get(slugB) : 9999;

    if (indexA !== indexB) {
      return indexA - indexB;
    }
    return 0;
  });
}

test('WhatsApp Phone URL formatting regression tests', async (t) => {
  await t.test('10-digit Indian mobile number is prefixed with 91', () => {
    assert.equal(getWhatsAppUrl('9876543210'), 'https://wa.me/919876543210');
    assert.equal(getWhatsAppUrl(' 98765 43210 '), 'https://wa.me/919876543210');
  });

  await t.test('Mobile number with +91 country code does not duplicate 91', () => {
    assert.equal(getWhatsAppUrl('+91 98765 43210'), 'https://wa.me/919876543210');
    assert.equal(getWhatsAppUrl('919876543210'), 'https://wa.me/919876543210');
  });

  await t.test('Mobile number with leading 0 strips 0 and prefixes 91', () => {
    assert.equal(getWhatsAppUrl('09876543210'), 'https://wa.me/919876543210');
  });

  await t.test('Null or empty returns fallback hash', () => {
    assert.equal(getWhatsAppUrl(null), '#');
    assert.equal(getWhatsAppUrl(''), '#');
  });
});

test('Exam reordering and custom priority sorting tests', async (t) => {
  const mockExams = [
    { slug: 'hp-jbt-tet', name: 'HP JBT TET' },
    { slug: 'hp-patwari', name: 'HP Patwari' },
    { slug: 'hp-police-constable', name: 'HP Police Constable' },
    { slug: 'hp-forest-guard', name: 'HP Forest Guard' },
  ];

  await t.test('Promotes upcoming exams to position #1 and #2 correctly', () => {
    const customOrder = ['hp-police-constable', 'hp-patwari'];
    const sorted = sortExamsByCustomOrder(mockExams, customOrder);

    assert.equal(sorted[0].slug, 'hp-police-constable');
    assert.equal(sorted[1].slug, 'hp-patwari');
    // Remaining unlisted exams remain at the end
    assert.equal(sorted[2].slug, 'hp-jbt-tet');
    assert.equal(sorted[3].slug, 'hp-forest-guard');
  });

  await t.test('Handles union exam objects with item.exam.slug', () => {
    const unionExams = [
      { isComingSoon: true, slug: 'hp-patwari' },
      { isComingSoon: false, exam: { slug: 'hp-police-constable' } },
    ];
    const customOrder = ['hp-police-constable', 'hp-patwari'];
    const sorted = sortExamsByCustomOrder(unionExams, customOrder);

    assert.equal(sorted[0].exam?.slug, 'hp-police-constable');
    assert.equal(sorted[1].slug, 'hp-patwari');
  });

  await t.test('Empty custom order leaves exams unchanged', () => {
    const sorted = sortExamsByCustomOrder(mockExams, []);
    assert.deepEqual(sorted, mockExams);
  });
});
