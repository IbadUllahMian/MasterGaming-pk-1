import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@payload-config';

/** Guards player-private routes with the Payload platform-users session cookie. */
export async function requirePlatformUser() {
  const payload = await getPayload({ config });
  const session = await payload.auth({ headers: await headers() });
  const user = session.user as { collection?: string } | null;

  if (user?.collection !== 'platform-users') redirect('/login');

  return user;
}
