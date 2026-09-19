// Contract for the pg pool 'error' listener (KITE-7172). Neon idle
// terminations (57P01) must log one warn and never throw; other pool errors
// must log at error without claiming an idle close; a missing pool must not
// fail onInit. The template ships no unit-test runner, so this is a
// self-contained tsx script (run in CI by nextjs-template-code-quality.yml).
//
// Run locally: pnpm exec tsx src/payload/pool-error-handler.test.ts

import { EventEmitter } from 'node:events';
import {
  attachPoolErrorHandler,
  NEON_IDLE_TERMINATION_CODE,
  type PoolErrorPayload,
} from './pool-error-handler';

let failures = 0;
function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
  }
}

function errorWithCode(message: string, code: string): Error {
  return Object.assign(new Error(message), { code });
}

function recordingLogger(): {
  payload: PoolErrorPayload;
  warns: string[];
  errors: string[];
} {
  const warns: string[] = [];
  const errors: string[] = [];
  return {
    warns,
    errors,
    payload: {
      logger: {
        warn: (message: string) => {
          warns.push(message);
        },
        error: (message: string) => {
          errors.push(message);
        },
      },
    },
  };
}

// --- 57P01 idle churn ------------------------------------------------------

{
  const pool = new EventEmitter();
  const { payload, warns, errors } = recordingLogger();
  payload.db = { pool };
  let threw = false;
  try {
    attachPoolErrorHandler(payload);
    pool.emit(
      'error',
      errorWithCode(
        'terminating connection due to administrator command',
        NEON_IDLE_TERMINATION_CODE,
      ),
    );
  } catch {
    threw = true;
  }
  check('57P01 does not throw', threw === false);
  check('57P01 logs exactly one warn', warns.length === 1);
  check('57P01 does not log at error', errors.length === 0);
  check(
    '57P01 warn names the idle close and code',
    warns[0]?.includes('server closed an idle connection') === true &&
      warns[0]?.includes(`code=${NEON_IDLE_TERMINATION_CODE}`) === true,
  );
}

// --- genuine pool failure --------------------------------------------------

{
  const pool = new EventEmitter();
  const { payload, warns, errors } = recordingLogger();
  payload.db = { pool };
  attachPoolErrorHandler(payload);
  pool.emit('error', errorWithCode('read ECONNRESET', 'ECONNRESET'));
  check('ECONNRESET does not log at warn', warns.length === 0);
  check('ECONNRESET logs exactly one error', errors.length === 1);
  check(
    'ECONNRESET message does not claim an idle close',
    errors[0]?.includes('idle connection') !== true &&
      errors[0]?.includes('connection error') === true &&
      errors[0]?.includes('code=ECONNRESET') === true,
  );
}

// --- missing pool must not fail onInit -------------------------------------

{
  const { payload } = recordingLogger();
  let threw = false;
  try {
    attachPoolErrorHandler(payload);
    attachPoolErrorHandler({ ...payload, db: {} });
    attachPoolErrorHandler({ ...payload, db: { pool: undefined } });
  } catch {
    threw = true;
  }
  check('unset pool does not throw during attach', threw === false);
}

// --- handler stays throw-proof if the logger throws ------------------------

{
  const pool = new EventEmitter();
  const payload: PoolErrorPayload = {
    db: { pool },
    logger: {
      warn: () => {
        throw new Error('logger.warn failed');
      },
      error: () => {
        throw new Error('logger.error failed');
      },
    },
  };
  attachPoolErrorHandler(payload);
  let threw = false;
  try {
    pool.emit(
      'error',
      errorWithCode('terminating connection', NEON_IDLE_TERMINATION_CODE),
    );
    pool.emit('error', errorWithCode('read ECONNRESET', 'ECONNRESET'));
  } catch {
    threw = true;
  }
  check('logger throw inside the handler does not escape', threw === false);
}

if (failures === 0) {
  console.log('pool-error-handler contract OK');
} else {
  console.error(`pool-error-handler contract: ${failures} FAILED`);
  process.exit(1);
}
