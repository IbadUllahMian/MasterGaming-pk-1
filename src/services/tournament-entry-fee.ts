import type { Payload } from 'payload';
import { applyWalletChange } from '@/services/wallet-ledger';

/** Server-side fee debit. A real gateway can later fund the same wallet without changing registrations. */
export async function approveTournamentEntryFee({ payload, player, tournament, entryFee }: { payload: Payload; player: number; tournament: number; entryFee: number }) {
  if (entryFee < 0) throw new Error('Tournament entry fee is invalid.');
  if (entryFee === 0) return { approved: true as const, source: 'free-entry' as const };
  await applyWalletChange({ payload, player, tournament, amount: -entryFee, type: 'TOURNAMENT_FEE', idempotencyKey: `tournament-entry:${tournament}:${player}`, note: `Tournament entry fee for tournament #${tournament}` });
  return { approved: true as const, source: 'wallet' as const };
}
