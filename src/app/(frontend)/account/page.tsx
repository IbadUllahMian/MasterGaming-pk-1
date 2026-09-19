import { AccountDashboard } from '@/components/accounts/AccountExperience';
import { privateMetadata } from '@/data/seo';
export const metadata=privateMetadata('MasterGaming Player Dashboard','Access your MasterGaming profile, tournament registrations, team status, credits, transactions, and notifications.','/account');
export default function Page(){return <AccountDashboard/>}
