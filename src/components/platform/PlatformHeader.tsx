'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { navItems } from '@/data/platform';
import { MasterGamingMark } from './MasterGamingMark';
import { authAdapter, getAuthNavigation, type AuthSession } from '@/services/auth-adapter';

export function PlatformHeader() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<AuthSession | undefined>(undefined);
  const auth = getAuthNavigation(session ?? null);
  const logout = async () => { await authAdapter.logout(); setSession(null); setOpen(false); };
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);
  useEffect(() => { let active = true; authAdapter.getSession().then(result => { if (active) setSession(result); }); return () => { active = false; }; }, []);
  return <header className="sticky top-0 z-50 border-b border-[#a6ff43]/15 bg-[#111217]/90 shadow-[0_8px_32px_rgba(0,0,0,.22)] backdrop-blur-xl"><nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8"><Link href="/" aria-label="MasterGaming home"><MasterGamingMark /></Link><div className="hidden items-center gap-5 lg:flex">{navItems.map(([label, href]) => <Link key={href} href={href} className="text-sm text-[#a7adb4] transition-colors hover:text-[#c6ff91]">{label}</Link>)}<div className="ml-1 flex items-center gap-3 border-l border-white/10 pl-4"><div><span className="block text-xs text-[#9ba1a8]">{session ? session.user.username : 'Player access'}</span><span className="block text-[10px] text-[#6f767f]">Admin is role-verified separately</span></div>{auth.links.map(link => <Link key={link.href} href={link.href} className={link.href === '/register' ? 'platform-button !min-h-9 !px-4 !py-2 !text-xs' : 'text-sm text-[#e6e8eb] transition-colors hover:text-[#c6ff91]'}>{link.label}</Link>)}{auth.showLogout && <button onClick={logout} className="text-sm text-[#a7adb4] transition-colors hover:text-[#f0f2f5]">Log out</button>}</div></div><button onClick={() => setOpen(true)} className="rounded-md border border-[#a6ff43]/35 px-3 py-2 text-sm text-[#f0f2f5] lg:hidden" aria-label="Open navigation" aria-expanded={open}>Menu</button></nav>{open && <><button onClick={() => setOpen(false)} aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/60 lg:hidden" /><aside className="fixed right-0 top-0 z-40 h-dvh w-[min(330px,85vw)] overflow-y-auto border-l border-[#a6ff43]/20 bg-[#191b20] p-6 shadow-2xl lg:hidden"><div className="flex items-center justify-between"><MasterGamingMark compact /><button onClick={() => setOpen(false)} className="rounded-md border border-white/15 px-3 py-2" aria-label="Close navigation">×</button></div><p className="mt-7 border-l border-[#a6ff43]/30 pl-3 text-xs leading-5 text-[#a7adb4]">Player sign-in is separate from administration. Admin access is available only after a secure session confirms the account role, and it is not exposed in public navigation.</p><div className="mt-6 grid gap-2">{navItems.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href} className="rounded-md px-3 py-3 text-[#dce0e5] hover:bg-white/5">{label}</Link>)}{auth.links.map(link => <Link onClick={() => setOpen(false)} key={link.href} href={link.href} className={link.href === '/register' ? 'platform-button mt-3' : 'rounded-md px-3 py-3 text-[#dce0e5]'}>{link.label}</Link>)}{auth.showLogout && <button onClick={logout} className="rounded-md px-3 py-3 text-left text-[#dce0e5] hover:bg-white/5">Log out</button>}</div></aside></>}</header>;
}
