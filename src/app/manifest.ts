import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest { return { name: 'MasterGaming.pk', short_name: 'MasterGaming', description: 'Free Fire esports tournament platform', start_url: '/', display: 'standalone', background_color: '#111217', theme_color: '#a6ff43', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }] }; }
