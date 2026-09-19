import { TeamDetail } from '@/components/accounts/AccountExperience';
import { teams } from '@/data/accounts';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <TeamDetail team={teams.find(team=>team.id===id)}/>}
