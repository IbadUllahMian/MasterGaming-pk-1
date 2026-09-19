import { getPayload } from 'payload';
import config from '../src/payload.config';
import { PLATFORM_OWNER_EMAIL, promoteExistingPlatformOwner } from '../src/payload/collections/Users';

async function promotePlatformOwner() {
  const payload = await getPayload({ config });
  await promoteExistingPlatformOwner(payload);
  console.log(`Reconciled ${PLATFORM_OWNER_EMAIL} as the Platform Admin when its account exists.`);
}

promotePlatformOwner().catch((error) => {
  console.error('Unable to promote platform owner:', error);
  process.exitCode = 1;
});
