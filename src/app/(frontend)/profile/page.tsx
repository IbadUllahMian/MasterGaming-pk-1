import { Profile } from '@/components/accounts/AccountExperience'; import { privateMetadata } from '@/data/seo';
export const metadata = privateMetadata('MasterGaming Player Profile', 'View your verified MasterGaming identity, gaming information, tournament activity, ranks, and achievements.', '/profile');
export default function Page(){ return <Profile/>; }
