import { AccountDashboard } from '@/components/accounts/AccountExperience';
import { privateMetadata } from '@/data/seo';
import { requirePlatformUser } from '@/services/platform-auth-server';
export const metadata=privateMetadata('MasterGaming Player Dashboard','Access your MasterGaming profile, tournament registrations, team status, credits, transactions, and notifications.','/account');
export default async function Page(){await requirePlatformUser(); return <AccountDashboard/>}
