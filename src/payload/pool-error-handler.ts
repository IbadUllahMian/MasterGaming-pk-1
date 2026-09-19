// Pool-level 'error' listener for the Payload postgres adapter.
//
// Neon terminates idle connections server-side (Postgres 57P01,
// "terminating connection due to administrator command"). node-postgres
// surfaces that as a pool-level 'error' event for the dead idle client, and
// with no listener Node escalates every one to an uncaughtException
// stack-trace burst. The pool has already discarded the dead client and the
// next query dials a fresh connection, so expected idle churn is one warn
// line. Other pool errors (network, TLS, credentials) stay at error so they
// remain distinguishable from that churn.
//
// Registration must not throw: an adapter change that leaves `pool` unset
// should degrade to the previous unhandled-event logging, not fail onInit.

export const NEON_IDLE_TERMINATION_CODE = '57P01';

type PoolLike = {
  on?(event: 'error', listener: (err: Error) => void): unknown;
};

export type PoolErrorPayload = {
  db?: { pool?: PoolLike };
  logger: {
    warn(message: string): unknown;
    error(message: string): unknown;
  };
};

export function attachPoolErrorHandler(payload: PoolErrorPayload): void {
  payload.db?.pool?.on?.('error', (err) => {
    try {
      const code = (err as { code?: string }).code ?? 'unknown';
      if (code === NEON_IDLE_TERMINATION_CODE) {
        payload.logger.warn(
          `db pool: server closed an idle connection (code=${code}): ${err.message}`,
        );
      } else {
        payload.logger.error(
          `db pool: connection error (code=${code}): ${err.message}`,
        );
      }
    } catch {
      // The error handler itself must never throw.
    }
  });
}
