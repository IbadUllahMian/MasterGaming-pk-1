'use client';

import { useEffect, useState } from 'react';

type MatchRoom = { roomId?: string; roomPassword?: string; matchStartTime?: string; roomUnlockTime?: string; status?: 'Upcoming' | 'Room Ready' | 'Live' | 'Completed' };
type Tournament = { id: string | number; name: string; status: string; schedule: string; matchRoom?: MatchRoom };
type Registration = { id: string | number; player?: { id: string | number; full_name?: string; username?: string } | string | number };

const fetchDocs = async <T,>(url: string): Promise<T[]> => {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) return [];
  return (await response.json() as { docs: T[] }).docs;
};

const playerName = (registration: Registration) => {
  const player = registration.player;
  if (!player || typeof player !== 'object') return 'Registered player';
  return player.full_name || player.username || `Player #${player.id}`;
};

export function MatchManagement() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [notice, setNotice] = useState('');
  const [noticeKind, setNoticeKind] = useState<'success' | 'error'>('success');
  const [savingRoom, setSavingRoom] = useState(false);

  useEffect(() => { void fetchDocs<Tournament>('/cms-api/tournaments?limit=100&sort=-schedule').then(setTournaments); }, []);
  useEffect(() => {
    if (!tournamentId) { setRegistrations([]); return; }
    void fetchDocs<Registration>(`/cms-api/tournament-registrations?depth=1&limit=200&where[tournament][equals]=${encodeURIComponent(tournamentId)}`).then(setRegistrations);
  }, [tournamentId]);

  const selectedTournament = tournaments.find((tournament) => String(tournament.id) === tournamentId);

  const roomValue = (key: keyof MatchRoom) => {
    const value = selectedTournament?.matchRoom?.[key];
    if (typeof value !== 'string' || !key.endsWith('Time')) return value || '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 16);
  };

  const responseMessage = async (response: Response) => {
    const body = await response.json().catch(() => null) as { errors?: Array<{ message?: string }>; message?: string } | null;
    return body?.errors?.[0]?.message || body?.message || `Room settings could not be saved (${response.status}).`;
  };

  const saveRoomSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tournamentId) return;
    setSavingRoom(true); setNotice('');
    const form = new FormData(event.currentTarget);
    const matchRoom = {
      roomId: String(form.get('roomId') || '').trim(),
      roomPassword: String(form.get('roomPassword') || '').trim(),
      matchStartTime: new Date(String(form.get('matchStartTime'))).toISOString(),
      roomUnlockTime: new Date(String(form.get('roomUnlockTime'))).toISOString(),
      status: String(form.get('matchStatus')),
    };
    try {
      const response = await fetch(`/cms-api/tournaments/${encodeURIComponent(tournamentId)}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchRoom }) });
      if (!response.ok) { setNoticeKind('error'); setNotice(await responseMessage(response)); return; }
      const saved = await response.json() as Tournament;
      if (!saved || String(saved.id) !== tournamentId) {
        setNoticeKind('error'); setNotice('Room settings could not be confirmed for the selected tournament. Please try again.'); return;
      }
      setTournaments((current) => current.map((tournament) => String(tournament.id) === tournamentId ? saved : tournament));
      const confirmed = await fetchDocs<Tournament>(`/cms-api/tournaments?limit=1&where[id][equals]=${encodeURIComponent(tournamentId)}`);
      const persisted = confirmed[0];
      if (!persisted || persisted.matchRoom?.roomId !== matchRoom.roomId || persisted.matchRoom?.roomPassword !== matchRoom.roomPassword || persisted.matchRoom?.matchStartTime !== matchRoom.matchStartTime || persisted.matchRoom?.roomUnlockTime !== matchRoom.roomUnlockTime) {
        setNoticeKind('error'); setNotice('Room settings were not confirmed after saving. Please try again.'); return;
      }
      setTournaments((current) => current.map((tournament) => String(tournament.id) === tournamentId ? persisted : tournament));
      setNoticeKind('success'); setNotice('Room settings saved. The stored values will remain available after refresh.');
    } catch {
      setNoticeKind('error'); setNotice('Room settings could not be saved because the server could not be reached. Please try again.');
    } finally { setSavingRoom(false); }
  };

  const unavailable = (event: React.FormEvent<HTMLFormElement>, action: string) => {
    event.preventDefault();
    setNotice(`${action} is ready for a verified match-management endpoint. No change was submitted from this frontend surface.`);
  };

  return <section className="mt-6 space-y-6">
    <aside className="rounded-lg border border-[#a6ff43]/25 bg-[#a6ff43]/8 px-4 py-3 text-sm leading-6 text-[#c8ccd1]">
      <span className="font-medium text-[#c6ff91]">Admin-only workspace.</span> These controls are shown inside the authenticated Admin area. Server-side authorization and persistence must remain the source of truth.
    </aside>
    <section className="platform-card">
      <p className="platform-label">Match controls</p><h2 className="mt-2 text-xl font-medium">Configure room access</h2>
      <p className="mt-2 text-sm leading-6 text-[#a7adb4]">Select a tournament, then save its room settings directly to that tournament record.</p>
      <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={(event) => void saveRoomSettings(event)}>
        <label className="field lg:col-span-2">Tournament<select required value={tournamentId} onChange={(event) => setTournamentId(event.target.value)}><option key="select-tournament" value="" disabled>Select a tournament</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select></label>
        <label className="field">Room ID<input key={`room-id-${tournamentId}`} name="roomId" required placeholder="Enter room ID" defaultValue={roomValue('roomId')} /></label>
        <label className="field">Room password<input key={`room-password-${tournamentId}`} name="roomPassword" required type="password" placeholder="Enter room password" defaultValue={roomValue('roomPassword')} /></label>
        <label className="field">Match start time<input key={`match-time-${tournamentId}`} name="matchStartTime" required type="datetime-local" defaultValue={roomValue('matchStartTime')} /></label>
        <label className="field">Room unlock time<input key={`unlock-time-${tournamentId}`} name="roomUnlockTime" required type="datetime-local" defaultValue={roomValue('roomUnlockTime')} /></label>
        <label className="field lg:col-span-2">Match status<select key={`match-status-${tournamentId}`} name="matchStatus" defaultValue={roomValue('status') || 'Upcoming'}><option key="upcoming">Upcoming</option><option key="room-ready">Room Ready</option><option key="live">Live</option><option key="completed">Completed</option></select></label>
        <button disabled={!tournamentId || savingRoom} className="platform-button lg:col-span-2 disabled:cursor-not-allowed disabled:opacity-50" type="submit">{savingRoom ? 'Saving room settings…' : 'Save room settings'}</button>
      </form>
    </section>
    <section className="platform-card">
      <p className="platform-label">Results entry</p><h2 className="mt-2 text-xl font-medium">Registered players</h2>
      <p className="mt-2 text-sm leading-6 text-[#a7adb4]">Ranks, kills, and calculated points are prepared only for registered players returned by the current system.</p>
      {tournamentId && registrations.length ? <form className="mt-5 overflow-x-auto" onSubmit={(event) => unavailable(event, 'Match results')}><table className="platform-table min-w-[760px]"><thead><tr><th>Player</th><th>Position / rank</th><th>Kills</th><th>Calculated points</th></tr></thead><tbody>{registrations.map((registration) => <tr key={registration.id}><td>{playerName(registration)}</td><td><input className="platform-input w-28" name={`rank-${registration.id}`} min="1" type="number" required /></td><td><input className="platform-input w-24" name={`kills-${registration.id}`} min="0" type="number" required /></td><td className="text-[#a7adb4]">Calculated by backend</td></tr>)}</tbody></table><button className="platform-button mt-5" type="submit">Save results</button></form> : <p className="mt-5 rounded-lg border border-white/8 bg-black/15 p-4 text-sm leading-6 text-[#a7adb4]">{tournamentId ? 'No registered players were returned for this tournament.' : 'Select a tournament to load its registered players. No player records are invented here.'}</p>}
    </section>
    <section className="platform-card">
      <p className="platform-label">Reward distribution</p><h2 className="mt-2 text-xl font-medium">Winning credits</h2>
      <p className="mt-2 text-sm leading-6 text-[#a7adb4]">Payouts require a verified wallet transaction endpoint. This screen does not issue credits or report a successful payout.</p>
      <form className="mt-5 grid gap-4 lg:grid-cols-2" onSubmit={(event) => unavailable(event, 'Reward payout')}>
        <label className="field">Winning player<select name="winner" required defaultValue="" disabled={!registrations.length}><option value="" disabled>Select a registered player</option>{registrations.map((registration) => <option key={registration.id} value={registration.id}>{playerName(registration)}</option>)}</select></label>
        <label className="field">Reward credits<input name="rewardCredits" min="0.01" step="0.01" type="number" required /></label>
        <div className="rounded-lg border border-[#f2d39a]/30 bg-[#f2d39a]/10 p-4 text-sm leading-6 text-[#f2d39a] lg:col-span-2">Payout status: awaiting verified backend support. Duplicate-payout protection belongs in the wallet transaction service.</div>
        <button className="platform-button lg:col-span-2" type="submit">Request reward payout</button>
      </form>
    </section>
    {notice && <p role="status" className={`text-sm ${noticeKind === 'success' ? 'text-[#c6ff91]' : 'text-[#ff9aac]'}`}>{notice}</p>}
  </section>;
}
