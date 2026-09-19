// Contract for sharp's libvips shared library reaching the deployed bundle
// (KITE-7305 follow-up). `payload.config.ts` imports sharp at module scope, so
// sharp loads during Payload init — a failure there throws on EVERY SSR
// request, not just image handling. The library itself is opened by the OS
// dynamic linker through the native binding's rpath, never by a JS `require`,
// so Next's file tracing does not discover it on its own: without the
// `outputFileTracingIncludes` entry in `next.config.mjs` the lambda ships
// sharp's binding but not `libvips-cpp.so.*`, and every route answers 500 with
// `ERR_DLOPEN_FAILED: libvips-cpp.so.<v>: cannot open shared object file`.
//
// Asserted against the real `next build` trace output rather than the config
// shape, so the test tracks what actually gets deployed: it fails if the
// include is removed, and equally if a pnpm layout or package-name change
// makes the glob stop matching. The template ships no unit-test runner, so
// this is a self-contained tsx script (run in CI by
// nextjs-template-code-quality.yml, after the build step).
//
// Run locally: pnpm run build && pnpm exec tsx src/payload/sharp-tracing.test.ts

import fs from 'node:fs';
import path from 'node:path';

let failures = 0;
function check(name: string, condition: boolean): void {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}`);
  }
}

const serverDir = path.join(process.cwd(), '.next', 'server');

function traceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...traceFiles(full));
    else if (entry.name.endsWith('.nft.json')) out.push(full);
  }
  return out;
}

const traces = traceFiles(serverDir);

// A missing build is a broken test run, not a passing contract: without it
// every assertion below would vacuously hold.
check(
  'the build produced route traces to inspect (run `pnpm run build` first)',
  traces.length > 0,
);

if (traces.length > 0) {
  // The shared library ships under a platform-specific package
  // (@img/sharp-libvips-<platform>) and carries the libvips version in its
  // filename — `libvips-cpp.so.8.18.3` on linux, `libvips-cpp.8.17.3.dylib` on
  // macOS. Match the stem so a libvips bump does not need a test edit.
  const withLibvips = traces.filter((file) =>
    fs.readFileSync(file, 'utf8').includes('libvips-cpp'),
  );

  check(
    `the libvips shared library is traced into the deployed bundle ` +
      `(${withLibvips.length}/${traces.length} routes)`,
    withLibvips.length > 0,
  );

  // Payload init runs on every dynamic route, so a partial trace would still
  // leave routes dead while the count above stayed non-zero. Pin the two that
  // matter by name.
  //
  // The visitor-facing catch-all is the one whose 500 was the reported
  // symptom, and it is the route most likely to regress silently: if it ever
  // moves into Next's prerendered set, `collect-build-traces` stops applying
  // includes to it while Payload still runs at request time — every visitor
  // page 500s with CI green. The cms-api route is the narrowest Payload proof.
  for (const [label, marker] of [
    ['frontend catch-all', `${path.sep}[[...slug]]${path.sep}`],
    ['Payload cms-api', `${path.sep}cms-api${path.sep}`],
  ] as const) {
    const trace = traces.find((file) => file.includes(marker));
    check(
      `the ${label} route traces the libvips shared library`,
      trace !== undefined &&
        fs.readFileSync(trace, 'utf8').includes('libvips-cpp'),
    );
  }
}

if (failures === 0) {
  console.log('sharp-tracing contract OK');
} else {
  console.error(`sharp-tracing contract: ${failures} FAILED`);
  process.exit(1);
}
