import { TournamentDiscovery } from '@/components/tournaments/TournamentExperience'; import { pageMetadata } from '@/data/seo';
export const metadata=pageMetadata('Free Fire Tournament Discovery','Browse verified upcoming, live, completed, and registration-open Free Fire tournaments with formats and rules.','/tournaments'); export default function Page(){return <TournamentDiscovery/>}
