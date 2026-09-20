'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const paymentMethods = ['EasyPaisa', 'JazzCash', 'Bank Transfer'];
type Wallet = { balance: number };
type Ledger = { id: number; amount: number; type: string; balanceAfter: number; note?: string; createdAt: string };
type Request = { id: number; amount: number; paymentMethod?: string; payoutMethod?: string; status: string; createdAt: string };
const money = (value: number) => `PKR ${Number(value || 0).toLocaleString()}`;
const readDocs = async <T,>(url: string) => {
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to load finance records.');
  return (await response.json() as { docs: T[] }).docs;
};

export function MembershipPage() { return <main className="platform-shell py-10 sm:py-14"><p className="platform-label">Membership</p><h1 className="platform-heading mt-3">Membership, reviewed by the desk.</h1></main>; }

export function CreditsPage() {
  const [wallet, setWallet] = useState<Wallet>();
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [deposits, setDeposits] = useState<Request[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    setLoading(true); setError('');
    try {
      const [wallets, entries, requests] = await Promise.all([readDocs<Wallet>('/cms-api/wallets?limit=1'), readDocs<Ledger>('/cms-api/wallet-ledger?limit=100&sort=-createdAt'), readDocs<Request>('/cms-api/deposit-requests?limit=100&sort=-createdAt')]);
      setWallet(wallets[0]); setLedger(entries); setDeposits(requests);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load finance records.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    try {
      const response = await fetch('/cms-api/deposit-requests', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(data.get('amount')), paymentMethod: data.get('method'), proofReference: data.get('proof') }) });
      setMessage(response.ok ? 'Deposit request submitted for manual review.' : 'Deposit request could not be submitted.');
      if (response.ok) { event.currentTarget.reset(); await refresh(); }
    } catch { setMessage('Deposit request could not be submitted.'); }
  };
  const pendingDeposits = deposits.filter(item => item.status === 'PENDING').length;
  return <main className="platform-shell py-10 sm:py-14"><p className="platform-label">Wallet and credits</p><h1 className="platform-heading mt-3">Your credits and transaction history.</h1><p className="mt-4 max-w-2xl leading-7 text-[#a7adb4]">Balances and activity come from your authenticated account’s finance records. Deposits are manually reviewed.</p>{error && <p role="alert" className="mt-6 text-sm text-[#ff9aac]">{error}</p>}<section className="mt-7 grid gap-4 md:grid-cols-2"><article className="platform-card"><p className="platform-label">Available credits</p><p className="mt-3 text-3xl font-medium">{loading ? 'Loading…' : error ? 'Unavailable' : money(wallet?.balance || 0)}</p><p className="mt-3 text-sm text-[#a7adb4]">Used for paid tournament entries and credited rewards.</p></article><article className="platform-card"><p className="platform-label">Manual deposits</p><p className="mt-3 text-3xl font-medium">{error ? 'Unavailable' : pendingDeposits}</p><p className="mt-3 text-sm text-[#a7adb4]">Pending request{pendingDeposits === 1 ? '' : 's'} awaiting review.</p></article></section><section className="platform-card mt-6"><div className="flex items-end justify-between gap-4"><div><p className="platform-label">Ledger</p><h2 className="mt-2 text-xl font-medium">Transaction history</h2></div><Link href="/withdrawals" className="platform-link">Request withdrawal</Link></div>{!error && (ledger.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr>{['Date', 'Type', 'Change', 'Balance', 'Details'].map(item => <th className="border-b border-white/8 px-3 py-3 text-xs text-[#9ba1a8]" key={item}>{item}</th>)}</tr></thead><tbody>{ledger.map(item => <tr key={item.id}><td className="border-b border-white/8 px-3 py-3">{new Date(item.createdAt).toLocaleString()}</td><td className="border-b border-white/8 px-3 py-3">{item.type.replaceAll('_', ' ')}</td><td className={`border-b border-white/8 px-3 py-3 ${item.amount >= 0 ? 'text-[#c6ff91]' : 'text-[#ff9aac]'}`}>{item.amount >= 0 ? '+' : ''}{money(item.amount)}</td><td className="border-b border-white/8 px-3 py-3">{money(item.balanceAfter)}</td><td className="border-b border-white/8 px-3 py-3 text-[#a7adb4]">{item.note || 'Verified transaction'}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-sm text-[#a7adb4]">No transactions yet.</p>)}</section><form className="platform-card mt-6 grid max-w-xl gap-4" onSubmit={event => void submit(event)}><p className="platform-label">Add credits</p><h2 className="text-xl font-medium">Submit a deposit request</h2><label className="field">Amount<input name="amount" type="number" min="0.01" step="0.01" required /></label><label className="field">Payment method<select name="method" required>{paymentMethods.map(method => <option value={method} key={method}>{method}</option>)}</select></label><label className="field">Payment proof reference<textarea name="proof" required /></label><button className="platform-button" type="submit">Submit deposit request</button>{message && <p className="text-sm text-[#c6ff91]" role="status">{message}</p>}</form></main>;
}

export function WithdrawalPage() {
  const [requests, setRequests] = useState<Request[]>([]); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const refresh = async () => { try { setError(''); setRequests(await readDocs<Request>('/cms-api/withdrawal-requests?limit=100&sort=-createdAt')); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load withdrawal requests.'); } };
  useEffect(() => { void refresh(); }, []);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); try { const response = await fetch('/cms-api/withdrawal-requests', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(data.get('amount')), payoutMethod: data.get('method'), accountDetails: data.get('details') }) }); setMessage(response.ok ? 'Withdrawal request submitted for desk review.' : 'Withdrawal request could not be submitted.'); if (response.ok) { event.currentTarget.reset(); await refresh(); } } catch { setMessage('Withdrawal request could not be submitted.'); } };
  return <main className="platform-shell py-10 sm:py-14"><p className="platform-label">Withdrawal request</p><h1 className="platform-heading mt-3">Request a manual payout.</h1><p className="mt-4 max-w-2xl leading-7 text-[#a7adb4]">No payout account is connected automatically. The tournament desk reviews each request before it can be completed.</p>{error && <p role="alert" className="mt-6 text-sm text-[#ff9aac]">{error}</p>}<section className="platform-card mt-6"><h2 className="text-xl font-medium">Your withdrawal history</h2>{!error && (requests.length ? <div className="mt-4 grid gap-3">{requests.map(item => <p className="rounded-lg border border-white/8 bg-black/15 p-4 text-sm" key={item.id}>{money(item.amount)} · {item.payoutMethod} · <span className="text-[#c6ff91]">{item.status}</span></p>)}</div> : <p className="mt-4 text-sm text-[#a7adb4]">No withdrawal requests yet.</p>)}</section><form className="platform-card mt-6 grid max-w-xl gap-4" onSubmit={event => void submit(event)}><label className="field">Requested amount<input name="amount" type="number" min="0.01" step="0.01" required /></label><label className="field">Payout method<select name="method" required>{paymentMethods.map(method => <option value={method} key={method}>{method}</option>)}</select></label><label className="field">Account details<textarea name="details" required /></label><button className="platform-button" type="submit">Submit withdrawal request</button>{message && <p className="text-sm text-[#c6ff91]" role="status">{message}</p>}</form></main>;
}

export function ReferralPage() { return <main className="platform-shell py-10 sm:py-14"><p className="platform-label">Referral credits</p><h1 className="platform-heading mt-3">Referral credits are reviewed by the desk.</h1></main>; }
