import { Teams } from '@/components/accounts/AccountExperience'; import { pageMetadata } from '@/data/seo';
export const metadata = pageMetadata('Free Fire Team Directory', 'Discover Free Fire teams on MasterGaming.pk, including team ranks, points, formats, captains, and roster status.', '/teams');
export default function Page(){ return <Teams/>; }
