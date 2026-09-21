import { Profile } from '@/components/accounts/AccountExperience'; import { privateMetadata } from '@/data/seo';
import { requirePlatformUser } from '@/services/platform-auth-server';
export const metadata = privateMetadata('MasterGaming Player Profile', 'View your verified MasterGaming identity, gaming information, tournament activity, ranks, and achievements.', '/profile');
export default async function Page(){ await requirePlatformUser(); return <Profile/>; }
