import type { Payload } from 'payload';

type LedgerType = 'DEPOSIT' | 'TOURNAMENT_FEE' | 'REWARD' | 'WITHDRAWAL';

export async function applyWalletChange({ payload, player, amount, type, idempotencyKey, admin, tournament, note }: { payload: Payload; player: number; amount: number; type: LedgerType; idempotencyKey: string; admin?: number; tournament?: number; note?: string }) {
  if (!Number.isFinite(amount) || amount === 0) throw new Error('Wallet amount is invalid.');
  const existing = await payload.find({ collection: 'wallet-ledger', where: { idempotencyKey: { equals: idempotencyKey } }, limit: 1, depth: 0, overrideAccess: true });
  if (existing.totalDocs) return { applied: false, ledger: existing.docs[0] };
  const wallets = await payload.find({ collection: 'wallets', where: { player: { equals: player } }, limit: 1, depth: 0, overrideAccess: true });
  const wallet = wallets.docs[0] || await payload.create({ collection: 'wallets', data: { player, balance: 0 }, overrideAccess: true });
  const nextBalance = Number(wallet.balance) + amount;
  if (nextBalance < 0) throw new Error('Insufficient credits for this transaction.');
  const ledger = await payload.create({ collection: 'wallet-ledger', data: { player, amount, type, balanceAfter: nextBalance, idempotencyKey, ...(admin ? { approvedBy: admin } : {}), ...(tournament ? { tournament } : {}), ...(note ? { note } : {}) }, overrideAccess: true });
  await payload.update({ collection: 'wallets', id: wallet.id, data: { balance: nextBalance }, overrideAccess: true });
  return { applied: true, ledger };
}
