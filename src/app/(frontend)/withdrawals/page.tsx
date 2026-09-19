import { WithdrawalPage } from '@/components/finance/FinanceExperience';
import { privateMetadata } from '@/data/seo';
export const metadata = privateMetadata('Manual Withdrawal Requests', 'Submit and review a MasterGaming.pk manual payout request. Requests are reviewed by the tournament desk.', '/withdrawals');
export default function Page(){return <WithdrawalPage/>}
