import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@payload-config';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const payload = await getPayload({ config });
  const session = await payload.auth({ headers: await headers() });
  const user = session.user as { collection?: string; role?: string } | null;
  if (user?.collection !== 'platform-users' || user.role !== 'Admin') redirect('/login');
  return children;
}
