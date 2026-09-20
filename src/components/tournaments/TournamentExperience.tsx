'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authAdapter } from '@/services/auth-adapter';

export type LiveTournament = {
  id: string | number;
  name: string;
  game: string;
  gameMode: string;
  format: string;
  schedule: string;
  entryFee: number;
  prizePool: number;
  maxSlots: number;
  registeredSlots: number;
  status: string;
  rules: string;
  matchRoom?: { status?: 'Upcoming' | 'Room Ready' | 'Live' | 'Completed'; roomId?: string; roomPassword?: string; roomUnlockTime?: string };
};

type Registration = { id: string | number };
type MatchResult = { id: string | number; rank: number; kills: number; points: number; player?: { full_name?: string; username?: string; id?: string | number } };

type Notice = { kind: 'success' | 'error'; message: string };

type JoinErrorPayload = {
  message?: string;
  error?: string;
  errors?: Array<{ message?: string; error?: string } | string>;
  data?: { message?: string; error?: string };
};

const load = async () => {
  const response = await fetch(`/cms-api/tournaments?limit=100&sort=schedule&_=${Date.now()}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) throw new Error('Unable to load active tournaments.');
  return (await response.json() as { docs: LiveTournament[] }).docs;
};

const money = (amount: number) => amount ? `PKR ${amount.toLocaleString()}` : 'Free';

const usefulMessage = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const message = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return message ? message : null;
};

const getJoinErrorMessage = (payload: JoinErrorPayload | null, responseText: string, response: Response) => {
  if (typeof payload?.message === 'string' && payload.message) return payload.message;
  if (typeof payload?.error === 'string' && payload.error) return payload.error;
  if (typeof payload?.data?.message === 'string' && payload.data.message) return payload.data.message;
  if (typeof payload?.data?.error === 'string' && payload.data.error) return payload.data.error;

  const firstError = payload?.errors?.[0];
  if (typeof firstError === 'string' && firstError) return firstError;
  if (firstError && typeof firstError !== 'string' && typeof firstError.message === 'string' && firstError.message) {
    return firstError.message;
  }
  if (firstError && typeof firstError !== 'string' && typeof firstError.error === 'string' && firstError.error) {
    return firstError.error;
  }

  return usefulMessage(responseText) || response.statusText || 'Registration failed.';
};

const getThrownMessage = (reason: unknown) => {
  if (typeof reason === 'string') return usefulMessage(reason);
  if (reason instanceof Error) return usefulMessage(reason.message);
  if (reason && typeof reason === 'object' && 'message' in reason) return usefulMessage((reason as { message?: unknown }).message);
  return null;
};

export function StatusBadge({ status }: { status: string }) {
  return <span className="platform-status border border-[#a6ff43]/35 bg-[#a6ff43]/12 text-[#c6ff91]">{status}</span>;
}

function Countdown({ unlockTime }: { unlockTime: string }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const distance = new Date(unlockTime).getTime() - Date.now();
      if (distance <= 0) { setRemaining('Room details are unlocking…'); return; }
      const hours = Math.floor(distance / 3_600_000);
      const minutes = Math.floor((distance % 3_600_000) / 60_000);
      const seconds = Math.floor((distance % 60_000) / 1_000);
      setRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };
    tick(); const timer = window.setInterval(tick, 1_000); return () => window.clearInterval(timer);
  }, [unlockTime]);
  return <p className="mt-3 text-2xl font-medium text-[#f2d39a]" aria-live="polite">{remaining}</p>;
}

function MatchRoomAndLeaderboard({ tournament }: { tournament: LiveTournament }) {
  const [registration, setRegistration] = useState<'checking' | 'not-registered' | 'registered'>('checking');
  const [results, setResults] = useState<MatchResult[]>([]);
  const unlockTime = tournament.matchRoom?.roomUnlockTime ? new Date(tournament.matchRoom.roomUnlockTime) : null;
  const isUnlocked = Boolean(unlockTime && unlockTime.getTime() <= Date.now() && tournament.matchRoom?.roomId && tournament.matchRoom?.roomPassword);
  const status = tournament.matchRoom?.status || (tournament.status === 'LIVE' ? 'Live' : tournament.status === 'COMPLETED' ? 'Completed' : tournament.status === 'ROOM READY' ? 'Room Ready' : 'Upcoming');

  useEffect(() => {
    let active = true;
    void authAdapter.getSession().then(async (session) => {
      if (!session || session.user.role !== 'Player') { if (active) setRegistration('not-registered'); return; }
      try {
        const response = await fetch(`/cms-api/tournament-registrations?limit=1&where[tournament][equals]=${encodeURIComponent(String(tournament.id))}`, { credentials: 'include', cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to verify your tournament registration.');
        const payload = await response.json() as { docs: Registration[] };
        if (active) setRegistration(payload.docs.length ? 'registered' : 'not-registered');
      } catch {
        // Do not reveal room credentials when registration verification fails.
        if (active) setRegistration('not-registered');
      }
    });
    void fetch(`/cms-api/match-results?depth=1&limit=200&where[tournament][equals]=${encodeURIComponent(String(tournament.id))}`, { credentials: 'include', cache: 'no-store' }).then(async (response) => response.ok ? response.json() as Promise<{ docs: MatchResult[] }> : { docs: [] }).then((payload) => { if (active) setResults(payload.docs); }).catch(() => undefined);
    return () => { active = false; };
  }, [tournament.id]);

  return <div className="mt-6 grid gap-6 lg:grid-cols-2">
    <section className="platform-card"><p className="platform-label">Match room</p><div className="mt-3 flex items-center justify-between gap-3"><h2 className="text-xl font-medium">Room access</h2><StatusBadge status={status} /></div>
      {registration === 'checking' ? <p className="mt-4 text-sm text-[#a7adb4]">Checking your tournament registration…</p> : registration === 'not-registered' ? <p className="mt-4 text-sm leading-6 text-[#a7adb4]">Only registered players can view room details.</p> : !unlockTime ? <p className="mt-4 text-sm leading-6 text-[#a7adb4]">Room details have not been configured for this tournament yet.</p> : !isUnlocked ? <><p className="mt-4 text-sm leading-6 text-[#a7adb4]">Room details will unlock at the scheduled time.</p><Countdown unlockTime={tournament.matchRoom!.roomUnlockTime!} /><p className="mt-2 text-sm text-[#a7adb4]">Scheduled unlock: {unlockTime.toLocaleString()}</p></> : <div className="mt-5 grid gap-3"><div className="rounded-lg border border-[#a6ff43]/25 bg-[#a6ff43]/8 p-4"><p className="platform-label">Room ID</p><p className="mt-1 font-medium text-[#f0f2f5]">{tournament.matchRoom?.roomId}</p></div><div className="rounded-lg border border-[#a6ff43]/25 bg-[#a6ff43]/8 p-4"><p className="platform-label">Room password</p><p className="mt-1 font-medium text-[#f0f2f5]">{tournament.matchRoom?.roomPassword}</p></div></div>}
    </section>
    <section className="platform-card"><p className="platform-label">Tournament leaderboard</p><h2 className="mt-3 text-xl font-medium">Live standings</h2>
      {results.length ? <div className="mt-5 overflow-x-auto"><table className="platform-table min-w-[540px]"><thead><tr><th>Player name</th><th className="text-right">Kills</th><th className="text-right">Points</th><th className="text-right">Rank</th></tr></thead><tbody>{[...results].sort((a, b) => b.points - a.points || a.rank - b.rank).map((result) => <tr key={result.id}><td>{result.player?.full_name || result.player?.username || 'Registered player'}</td><td className="text-right">{result.kills}</td><td className="text-right">{result.points}</td><td className="text-right">{result.rank}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-sm leading-6 text-[#a7adb4]">Results will appear here after verified match data is available. No standings are shown until saved result records are connected.</p>}
    </section>
  </div>;
}

export function TournamentDiscovery() {
  const [tournaments, setTournaments] = useState<LiveTournament[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    void load().then(setTournaments).catch((reason: Error) => setError(reason.message));
  }, []);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('tournament-registration-created', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('tournament-registration-created', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refresh]);

  const shown = useMemo(
    () => tournaments.filter((tournament) => `${tournament.name} ${tournament.gameMode}`.toLowerCase().includes(query.toLowerCase())),
    [tournaments, query],
  );

  return <main className="platform-shell py-10 sm:py-14">
    <p className="platform-label">Competitive formats</p>
    <h1 className="platform-heading mt-3">Find your next room.</h1>
    <input className="platform-input mt-8 w-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tournaments" />
    {error ? <p className="mt-6 text-[#ff9aac]">{error}</p> : <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {shown.map((tournament) => {
        const participants = Number.isFinite(tournament.registeredSlots) ? tournament.registeredSlots : 0;
        const slots = Math.max(tournament.maxSlots - participants, 0);

        return <article className="platform-card" key={tournament.id}>
          <div className="flex justify-between gap-3"><StatusBadge status={tournament.status} /><span className="platform-label">{slots} slots left</span></div>
          <p className="platform-label mt-5">{tournament.game} · {tournament.gameMode}</p>
          <h2 className="mt-2 text-xl font-medium">{tournament.name}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><p>Entry: {money(tournament.entryFee)}</p><p>Prize: {money(tournament.prizePool)}</p><p>Slots: {participants}/{tournament.maxSlots}</p><p>{new Date(tournament.schedule).toLocaleString()}</p></div>
          <Link href={`/tournaments/${tournament.id}`} className="platform-button secondary mt-5 w-full">View tournament</Link>
        </article>;
      })}
    </section>}
  </main>;
}

export function TournamentDetails({ id }: { id: string }) {
  const [tournament, setTournament] = useState<LiveTournament | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [registration, setRegistration] = useState<'checking' | 'not-registered' | 'registered'>('checking');
  const joinRequestInFlight = useRef(false);
  const latestRefreshRequest = useRef(0);

  const refresh = useCallback(async ({ showLoading = true, reportErrors = true }: { showLoading?: boolean; reportErrors?: boolean } = {}) => {
    const requestNumber = latestRefreshRequest.current + 1;
    latestRefreshRequest.current = requestNumber;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`/cms-api/tournaments/${id}?_=${Date.now()}`, { credentials: 'include', cache: 'no-store' });
      if (response.ok) {
        const refreshedTournament = await response.json() as LiveTournament;
        if (requestNumber === latestRefreshRequest.current) setTournament(refreshedTournament);
        return refreshedTournament;
      } else {
        if (reportErrors && requestNumber === latestRefreshRequest.current) setNotice({ kind: 'error', message: 'Tournament unavailable.' });
      }
    } catch (reason) {
      if (reportErrors && requestNumber === latestRefreshRequest.current) setNotice({ kind: 'error', message: getThrownMessage(reason) || 'Unable to refresh tournament details.' });
    } finally {
      if (showLoading && requestNumber === latestRefreshRequest.current) setLoading(false);
    }
    return null;
  }, [id]);

  const refreshRegistration = useCallback(async () => {
    const response = await fetch(`/cms-api/tournament-registrations?limit=1&where[tournament][equals]=${encodeURIComponent(id)}&_=${Date.now()}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Unable to verify your tournament registration.');
    const payload = await response.json() as { docs: Registration[] };
    return payload.docs.length ? 'registered' as const : 'not-registered' as const;
  }, [id]);

  useEffect(() => {
    let active = true;
    void refresh();
    void authAdapter.getSession().then(async (session) => {
      if (!session || session.user.role !== 'Player') {
        if (active) setRegistration('not-registered');
        return;
      }
      try {
        const nextRegistration = await refreshRegistration();
        if (active) setRegistration(nextRegistration);
      } catch (reason) {
        if (active) {
          setNotice({ kind: 'error', message: getThrownMessage(reason) || 'Unable to verify your tournament registration.' });
          setRegistration('not-registered');
        }
      }
    });
    return () => { active = false; };
  }, [id, refresh, refreshRegistration]);

  const join = async () => {
    if (joinRequestInFlight.current) return;
    if (registration === 'registered') {
      setNotice({ kind: 'error', message: 'You are already registered for this tournament.' });
      return;
    }
    joinRequestInFlight.current = true;
    setJoining(true);
    setNotice(null);
    try {
      const session = await authAdapter.getSession();
      if (!session) {
        setNotice({ kind: 'error', message: 'Sign in with a player account to join this tournament.' });
        return;
      }
      if (session.user.role !== 'Player') {
        setNotice({ kind: 'error', message: 'Tournament registration is available to Player accounts only.' });
        return;
      }

      const tournamentId = Number(id);
      if (!Number.isSafeInteger(tournamentId) || tournamentId < 1) {
        setNotice({ kind: 'error', message: 'Tournament unavailable.' });
        return;
      }

      const response = await fetch('/cms-api/tournament-registrations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament: tournamentId }),
      });
      const responseText = await response.text();
      let payload: JoinErrorPayload | null = null;
      try {
        payload = JSON.parse(responseText) as JoinErrorPayload;
      } catch {
        // Non-JSON server responses can still provide a useful exact message.
      }

      if (!response.ok) {
        setNotice({ kind: 'error', message: getJoinErrorMessage(payload, responseText, response) });
        return;
      }

      // The registration hook persists registeredSlots before this POST resolves.
      // Repaint solely from the subsequent authoritative tournament GET; never
      // manufacture a local increment that can diverge after a refresh.
      const refreshedTournament = await refresh({ showLoading: false, reportErrors: false });
      if (!refreshedTournament) throw new Error('Registration was saved, but the updated tournament could not be loaded. Please refresh the page.');
      setRegistration('registered');

      window.dispatchEvent(new Event('tournament-registration-created'));
      setNotice({ kind: 'success', message: 'You are registered. Your slot has been reserved.' });
    } catch (reason) {
      setNotice({ kind: 'error', message: getThrownMessage(reason) || 'Registration could not be completed. Please try again.' });
    } finally {
      setJoining(false);
      joinRequestInFlight.current = false;
    }
  };

  if (loading) return <main className="platform-shell py-12">Loading tournament…</main>;
  if (!tournament) return <main className="platform-shell py-12"><p className="text-[#ff9aac]">{notice?.message}</p><Link href="/tournaments" className="platform-link">Back to tournaments</Link></main>;

  const participants = Number.isFinite(tournament.registeredSlots) ? tournament.registeredSlots : 0;
  const slots = Math.max(tournament.maxSlots - participants, 0);

  return <main className="platform-shell py-12">
    <Link href="/tournaments" className="platform-link">Back to tournaments</Link>
    <section className="platform-card mt-6">
      <StatusBadge status={tournament.status} />
      <h1 className="platform-heading mt-5">{tournament.name}</h1>
      <p className="platform-label mt-3">{tournament.game} · {tournament.gameMode} · {tournament.format}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <p>Entry fee<br /><strong>{money(tournament.entryFee)}</strong></p>
        <p>Prize pool<br /><strong>{money(tournament.prizePool)}</strong></p>
        <p>Players<br /><strong>{participants}/{tournament.maxSlots}</strong></p>
        <p>Slots left<br /><strong>{slots}</strong></p>
        <p>Starts<br /><strong>{new Date(tournament.schedule).toLocaleString()}</strong></p>
      </div>
       <p className="mt-6 whitespace-pre-line text-sm leading-6 text-white/75">{tournament.rules}</p>
      {notice && <p role="status" aria-live="polite" className={`mt-6 rounded-lg border px-4 py-3 text-sm ${notice.kind === 'success' ? 'border-[#a6ff43]/35 bg-[#a6ff43]/12 text-[#c6ff91]' : 'border-[#ff9aac]/40 bg-[#ff9aac]/10 text-[#ff9aac]'}`}>{notice.message}</p>}
      <button type="button" onClick={join} disabled={joining || registration === 'checking' || registration === 'registered' || slots === 0} className="platform-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50">
        {joining ? 'Joining tournament…' : registration === 'checking' ? 'Checking registration…' : registration === 'registered' ? 'Already registered' : slots === 0 ? 'Tournament full' : 'Join Tournament'}
      </button>
    </section>
    <MatchRoomAndLeaderboard tournament={tournament} />
  </main>;
}
