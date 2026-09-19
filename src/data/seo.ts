import type { Metadata } from 'next';

const ogImage = 'https://static.kite.ai/image/upload/v1789264161/app/e5120da1-b491-4f79-b066-5ee9682049c7/iter3/freefire-squad-hero-r1.png';

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images: [ogImage] },
  };
}

export function privateMetadata(title: string, description: string, path: string): Metadata {
  return { ...pageMetadata(title, description, path), robots: { index: false, follow: false } };
}
