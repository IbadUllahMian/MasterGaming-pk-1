import { AuthScreen } from '@/components/accounts/AccountExperience'; import { privateMetadata } from '@/data/seo';
export const metadata=privateMetadata('MasterGaming Player Sign In','Sign in to MasterGaming.pk when verified account access is available.','/login'); export default function Page(){return <AuthScreen/>}
