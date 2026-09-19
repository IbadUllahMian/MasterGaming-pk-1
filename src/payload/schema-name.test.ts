// Contract for the Payload postgres adapter's schema name (KITE-7305). The
// adapter calls drizzle's `pgSchema(name)` for any name it is given, and
// `pgSchema('public')` throws by design ("Postgres is using public schema by
// default … just use pgTable()"). That throw happens in Payload init, so a
// config that names the default schema when `PAYLOAD_SCHEMA` is missing serves
// 500 on every SSR route of the deployed site instead of degrading to the
// default schema. A runtime with no usable schema in its env must therefore
// resolve to "no explicit schema", never to a name.
//
// drizzle-orm is a transitive dependency of the adapter, not a template one, so
// its rejection rule is pinned here as the reason rather than executed.
// The template ships no unit-test runner, so this is a self-contained tsx
// script (run in CI by nextjs-template-code-quality.yml).
//
// Run locally: pnpm exec tsx src/payload/schema-name.test.ts

import { resolveSchemaName } from './schema-name';

// The no-argument call reads `process.env`, and the migration sandbox exports
// PAYLOAD_SCHEMA — so clear it first, or "a missing PAYLOAD_SCHEMA" would be
// whatever the shell happens to hold and this script's verdict would depend on
// where it runs.
delete process.env.PAYLOAD_SCHEMA;

let failures = 0;
function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
  }
}

// --- env states a deployed runtime can be in -------------------------------

check(
  'a missing PAYLOAD_SCHEMA names no schema, leaving the connection default',
  resolveSchemaName() === undefined,
);
check(
  'an empty PAYLOAD_SCHEMA names no schema either',
  resolveSchemaName('') === undefined,
);
check(
  'a set PAYLOAD_SCHEMA isolates content in that schema',
  resolveSchemaName('payload_iter3') === 'payload_iter3',
);

// The one name the adapter cannot be handed, from any env state.
check(
  "an absent PAYLOAD_SCHEMA never resolves to the rejected 'public'",
  resolveSchemaName() !== 'public',
);
for (const value of ['', 'public']) {
  check(
    `${JSON.stringify(value)} never resolves to the rejected 'public'`,
    resolveSchemaName(value) !== 'public',
  );
}

if (failures === 0) {
  console.log('schema-name contract OK');
} else {
  console.error(`schema-name contract: ${failures} FAILED`);
  process.exit(1);
}
