/** Postgres' own default schema — never a schema the adapter may be *told* to use. */
const DEFAULT_SCHEMA = 'public';

/**
 * Resolve the Postgres schema the Payload adapter should isolate content in.
 *
 * Each generated site keeps its design iterations in per-iter schemas
 * (`payload_iter1/2/3`), carried through as `PAYLOAD_SCHEMA`. When that env is
 * absent — or names the default schema — the answer is `undefined`, meaning
 * "use the connection's default", and NOT the literal `'public'`: the adapter
 * reaches for drizzle's `pgSchema()` for any name it is given, and
 * `pgSchema('public')` throws by design. Naming the default explicitly
 * therefore kills Payload init, and with it every SSR route of the site, on any
 * runtime whose env lost the variable.
 */
export function resolveSchemaName(
  schemaName: string | undefined = process.env.PAYLOAD_SCHEMA,
): string | undefined {
  if (!schemaName || schemaName === DEFAULT_SCHEMA) return undefined;
  return schemaName;
}
