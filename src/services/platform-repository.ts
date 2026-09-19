/**
 * Production data boundary. Until the verified backend is connected, requests
 * deliberately return empty records rather than sample users or operations.
 */
import { achievements, currentPlayer, history, players, teams } from '@/data/accounts';
import { adminActivity, adminNav, adminRows, adminStats, adminIdentity } from '@/data/admin';
import { leaders, navItems, news, tournaments } from '@/data/platform';
import { commissions, manualTransactions, membership, paymentProofs, promoCodes, referral, withdrawals } from '@/data/finance';
export type RequestState<T> = { data: T; source: 'unavailable'; loading: false; error: null };
const unavailable = <T,>(data:T):RequestState<T> => ({data,source:'unavailable',loading:false,error:null});
export const platformRepository={
 getHome:()=>unavailable({tournaments,leaders,news,navItems}),getTournaments:()=>unavailable(tournaments),getTournament:(id:string)=>unavailable(tournaments.find(x=>x.id===id)??null),getLeaderboard:()=>unavailable(leaders),getRankings:()=>unavailable(players),getPlayers:()=>unavailable(players),getPlayer:(id:string)=>unavailable(players.find(x=>x.id===id)??null),getProfile:()=>unavailable({player:currentPlayer,achievements,history}),getTeams:()=>unavailable(teams),getTeam:(id:string)=>unavailable(teams.find(x=>x.id===id)??null),getMembership:()=>unavailable(membership),getManualLedger:()=>unavailable(manualTransactions),getPaymentProofs:()=>unavailable(paymentProofs),getWithdrawals:()=>unavailable(withdrawals),getReferral:()=>unavailable(referral),getPromoCodes:()=>unavailable(promoCodes),getCommissions:()=>unavailable(commissions),getNotifications:()=>unavailable([] as string[]),getAdmin:()=>unavailable({admin:adminIdentity,stats:adminStats,activity:adminActivity,rows:adminRows,nav:adminNav}),
};
type TournamentPayload = { name: string; game: string; gameMode: string; format: string; schedule: string; entryFee: number; prizePool: number; maxSlots: number; status: string; entryType: string; rules: string; participation?: string };
type CommandResult = { ok: boolean; message: string };
const commandMessage = async (response: Response) => {
 const body = await response.json().catch(() => null) as { errors?: { message?: string }[]; message?: string } | null;
 return body?.errors?.[0]?.message || body?.message || 'We could not save the tournament.';
};
const tournamentRequest = async (url: string, init: RequestInit): Promise<CommandResult> => {
 const response = await fetch(url, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
 return response.ok ? { ok: true, message: 'Tournament saved successfully.' } : { ok: false, message: await commandMessage(response) };
};
export const platformCommands={createRegistration:async()=>({ok:true as const,source:'unavailable' as const,message:'Registration submissions will be available after the verified backend is connected.'}),saveTournament:(data?:TournamentPayload,id?:string):Promise<CommandResult>=>data?tournamentRequest(id?`/cms-api/tournaments/${id}`:'/cms-api/tournaments',{method:id?'PATCH':'POST',body:JSON.stringify(data)}):Promise.resolve({ok:false,message:'Tournament details are required.'}),cancelTournament:(id:string)=>tournamentRequest(`/cms-api/tournaments/${id}`,{method:'PATCH',body:JSON.stringify({status:'CANCELLED'})}),deleteTournament:async(id:string):Promise<CommandResult>=>{const response=await fetch(`/cms-api/tournaments/${id}`,{method:'DELETE',credentials:'include'});return response.ok?{ok:true,message:'Tournament deleted successfully.'}:{ok:false,message:await commandMessage(response)};},updateMatchResult:async()=>({ok:true as const,source:'unavailable' as const,message:'Verified result updates require the verified backend.'}),submitManualPaymentProof:async()=>({ok:true as const,source:'unavailable' as const,message:'Payment proof submissions will be available after the verified backend is connected.'}),submitWithdrawalRequest:async()=>({ok:true as const,source:'unavailable' as const,message:'Withdrawal requests will be available after the verified backend is connected.'})};
