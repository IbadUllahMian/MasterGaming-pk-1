import { AuthScreen } from '@/components/accounts/AccountExperience'; import { privateMetadata } from '@/data/seo';
export const metadata=privateMetadata('Create a MasterGaming Profile','Request MasterGaming.pk player account access when verified registration is available.','/register'); export default function Page(){return <AuthScreen register/>}
