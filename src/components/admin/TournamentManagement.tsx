'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { games, modes } from '@/data/competitive-system';
import { platformCommands } from '@/services/platform-repository';

type Tournament = { id: string | number; name: string; game: string; gameMode: string; format: string; schedule: string; entryFee: number; prizePool: number; maxSlots: number; status: string; entryType: string; rules: string; participation?: string };

const loadTournaments = async () => {
  const response = await fetch('/cms-api/tournaments?limit=100&sort=-createdAt', { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load tournaments.');
  return (await response.json() as { docs: Tournament[] }).docs;
};

export function TournamentList() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = async () => { setLoading(true); try { setTournaments(await loadTournaments()); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load tournaments.'); } finally { setLoading(false); } };
  useEffect(() => { void refresh(); }, []);
  const update = async (id: string, action: 'cancel' | 'delete') => {
    if (!window.confirm(action === 'cancel' ? 'Cancel this tournament?' : 'Delete this tournament permanently?')) return;
    const result = action === 'cancel' ? await platformCommands.cancelTournament(id) : await platformCommands.deleteTournament(id);
    setMessage(result.message);
    if (result.ok) void refresh();
  };
  return <><div className="mt-6 flex justify-end"><Link href="/admin-panel/tournaments/create" className="platform-button">Create tournament</Link></div>{message && <p className="mt-4 text-sm text-[#c6ff91]" role="status">{message}</p>}{loading ? <p className="mt-5 text-sm text-[#a7adb4]">Loading tournaments…</p> : tournaments.length ? <div className="mt-5 overflow-x-auto rounded-lg border border-white/8"><table className="min-w-[900px] w-full text-left text-sm"><thead><tr>{['Tournament', 'Mode & format', 'Schedule', 'Status', 'Actions'].map(title => <th className="border-b border-white/8 px-4 py-3 text-xs font-medium uppercase text-[#9ba1a8]" key={title}>{title}</th>)}</tr></thead><tbody>{tournaments.map(tournament => <tr key={tournament.id}><td className="border-b border-white/8 px-4 py-3"><p className="font-medium">{tournament.name}</p><p className="mt-1 text-xs text-[#9ba1a8]">{tournament.game} · {tournament.maxSlots} slots</p></td><td className="border-b border-white/8 px-4 py-3">{tournament.gameMode} · {tournament.format}</td><td className="border-b border-white/8 px-4 py-3">{new Date(tournament.schedule).toLocaleString()}</td><td className="border-b border-white/8 px-4 py-3">{tournament.status}</td><td className="border-b border-white/8 px-4 py-3"><div className="flex gap-3"><Link href={`/admin-panel/tournaments/${tournament.id}/edit`} className="text-[#c6ff91]">Edit</Link>{tournament.status !== 'CANCELLED' && <button className="text-[#f2d39a]" onClick={() => void update(String(tournament.id), 'cancel')}>Cancel</button>}<button className="text-[#ff9aac]" onClick={() => void update(String(tournament.id), 'delete')}>Delete</button></div></td></tr>)}</tbody></table></div> : <section className="platform-card mt-5 text-center"><p className="font-medium">No tournaments have been created yet.</p><p className="mt-2 text-sm leading-6 text-[#a7adb4]">Create a tournament to add the first tournament record.</p></section>}</>;
}

export function TournamentForm({ tournamentId }: { tournamentId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState('br');
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(Boolean(tournamentId));
  useEffect(() => { if (!tournamentId) return; void (async () => { const response = await fetch(`/cms-api/tournaments/${tournamentId}`, { credentials: 'include', cache: 'no-store' }); if (!response.ok) { setMessage('Tournament could not be loaded.'); setLoading(false); return; } const value = await response.json() as Tournament; setTournament(value); setMode(value.gameMode); setLoading(false); })(); }, [tournamentId]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setLoading(true); const result = await platformCommands.saveTournament({ name: String(data.get('name')), game: String(data.get('game')), gameMode: String(data.get('mode')), format: String(data.get('matchFormat') || 'Standard'), schedule: new Date(String(data.get('schedule'))).toISOString(), entryFee: Number(data.get('entryFee')), prizePool: Number(data.get('prizePool')), maxSlots: Number(data.get('slots')), status: String(data.get('status')), entryType: String(data.get('entryType')), rules: String(data.get('rules')), participation: String(data.get('participation') || '') }, tournamentId); setLoading(false); setMessage(result.message); if (result.ok) window.setTimeout(() => router.push('/admin-panel/tournaments'), 500); };
  if (loading && tournamentId && !tournament) return <p className="mt-6 text-sm text-[#a7adb4]">Loading tournament…</p>;
  const schedule = tournament?.schedule ? new Date(tournament.schedule).toISOString().slice(0, 16) : '';
  return <form className="platform-card mt-6 grid gap-4 lg:grid-cols-2" onSubmit={submit}><label className="field">Tournament name<input required name="name" defaultValue={tournament?.name} /></label><label className="field">Game<select name="game" defaultValue={tournament?.game ?? 'free-fire'}>{games.map(game => <option key={game.id} value={game.id}>{game.name}</option>)}</select></label><label className="field">Game mode<select name="mode" value={mode} onChange={event => setMode(event.target.value)}>{modes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field">Registration status<select name="status" defaultValue={tournament?.status ?? 'REGISTERING'}><option>REGISTERING</option><option>ROOM READY</option><option>LIVE</option><option>COMPLETED</option><option>CANCELLED</option></select></label><label className="field">Schedule<input required name="schedule" type="datetime-local" defaultValue={schedule} /></label><label className="field">Slot limit<input type="number" name="slots" required min="2" defaultValue={tournament?.maxSlots} /></label><label className="field">Entry type<select name="entryType" defaultValue={tournament?.entryType ?? 'Free'}><option>Free</option><option>Paid</option></select></label><label className="field">Entry fee<input required type="number" min="0" step="0.01" name="entryFee" defaultValue={tournament?.entryFee} /></label><label className="field">Prize pool<input required type="number" min="0" step="0.01" name="prizePool" defaultValue={tournament?.prizePool} /></label><label className="field">Rules<textarea name="rules" required defaultValue={tournament?.rules} placeholder="Published event rules" /></label>{mode === 'br' && <><label className="field">Participation<select name="participation" defaultValue={tournament?.participation ?? 'Solo'}><option>Solo</option><option>Duo</option><option>Squad</option></select></label><label className="field">Match format<input required name="matchFormat" defaultValue={tournament?.format} placeholder="e.g. 3 matches" /></label></>}<button className="platform-button lg:col-span-2 disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Saving…' : 'Save tournament'}</button>{message && <p role="status" className="lg:col-span-2 text-sm text-[#c6ff91]">{message}</p>}</form>;
}
