import type { ReactNode } from 'react';

// Minimal, isolated root layout for the login-recovery page. Deliberately does
// NOT nest under the Payload admin RootLayout ((payload)/layout.tsx) or the
// public-site layout ((frontend)/layout.tsx): recovery must render even when
// the DB is unreachable or the frontend fails to compile — the exact degraded
// states it exists to recover from. Route groups let it be its own root layout
// (the app has no shared app/layout.tsx), so it pulls in neither.
export const metadata = { title: 'Signing in…' };

export default function RecoverRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#6b7280',
        }}
      >
        {children}
      </body>
    </html>
  );
}
