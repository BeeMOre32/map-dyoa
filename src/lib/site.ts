import type { Metadata } from 'next';

export const SITE_NAME = 'Map-Dyoa';
export const SITE_TAGLINE = '지도동 일정 관리';
export const DEFAULT_DESCRIPTION =
  '지도동 멤버들의 방송 일정, 스트리머, 클립을 한곳에서 확인하는 팬 서비스입니다.';

/** 프로덕션 URL (Vercel: NEXT_PUBLIC_SITE_URL 또는 VERCEL_* 자동) */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return `https://${production.replace(/^https?:\/\//, '')}`;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/^https?:\/\//, '')}`;
  }

  return 'http://localhost:3000';
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

const OG_IMAGE_PATH = '/brand/map-dyoa-logo.svg';

export function buildPageMetadata(options: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const canonical = options.path ? absoluteUrl(options.path) : undefined;

  return {
    title: options.title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: options.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: `${options.title} | ${SITE_NAME}`,
      description,
      type: 'website',
      locale: 'ko_KR',
      siteName: SITE_NAME,
      url: canonical,
      images: [{ url: OG_IMAGE_PATH, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary',
      title: `${options.title} | ${SITE_NAME}`,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export function getRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${SITE_NAME} | ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    keywords: [
      '지도동',
      'Map-Dyoa',
      '스트리머',
      '방송 일정',
      '치지직',
      '클립',
      '캘린더',
    ],
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    formatDetection: { email: false, telephone: false },
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/brand/map-dyoa-logo.svg', type: 'image/svg+xml' },
      ],
      apple: [{ url: '/brand/map-dyoa-logo.svg' }],
      shortcut: ['/favicon.svg'],
    },
    openGraph: {
      title: `${SITE_NAME} | ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      type: 'website',
      locale: 'ko_KR',
      siteName: SITE_NAME,
      url: siteUrl,
      images: [{ url: OG_IMAGE_PATH, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary',
      title: `${SITE_NAME} | ${SITE_TAGLINE}`,
      description: DEFAULT_DESCRIPTION,
      images: [OG_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export function getWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    url: getSiteUrl(),
    inLanguage: 'ko-KR',
  };
}
