import { CreateTeam } from '@/components/accounts/AccountExperience';
import { requirePlatformUser } from '@/services/platform-auth-server';

export default async function Page(){await requirePlatformUser(); return <CreateTeam/>}
