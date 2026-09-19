// Contract for the scroll-reveal primitive's arming logic (KITE-7581): a
// `.reveal` element that enters the DOM AFTER the observer armed — on the same
// route, with no navigation — must still be observed and revealed. The CMS live
// preview refreshes the page in place on save (`router.refresh()`), so a newly
// added block's nodes arrive exactly this way; the mount-once
// `querySelectorAll` snapshot the primitive used to take never saw them and
// they stayed at `opacity: 0` forever.
//
// The template ships no unit-test runner, so this is a self-contained tsx
// script (run in CI by nextjs-template-code-quality.yml) that drives
// `armScrollReveal` against a hand-built stub DOM: a minimal element model plus
// IntersectionObserver / MutationObserver stand-ins the test can fire by hand.
// The stub's selector support covers the one shape the primitive uses
// (`.a:not(.b)`), and says so instead of pretending to be a DOM.
//
// Run locally: pnpm exec tsx src/components/scroll-reveal.test.ts

import { armScrollReveal } from './scroll-reveal';

let failures = 0;

function check(name: string, ok: boolean, detail = ''): void {
  if (ok) {
    console.log(`  ok  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL ${name}${detail ? `\n        ${detail}` : ''}`);
  }
}

// --- stub DOM ---------------------------------------------------------------

const SELECTOR_RE = /^\.([\w-]+)(?::not\(\.([\w-]+)\))?$/;

function selectorPredicate(selector: string): (el: StubElement) => boolean {
  const m = SELECTOR_RE.exec(selector);
  if (!m)
    throw new Error(`stub DOM only understands .a or .a:not(.b): ${selector}`);
  const [, required, excluded] = m;
  return (el) =>
    el.classes.has(required) && (!excluded || !el.classes.has(excluded));
}

class StubElement {
  nodeType = 1;
  classes: Set<string>;
  children: StubElement[] = [];
  classList = {
    add: (cls: string) => this.classes.add(cls),
    remove: (cls: string) => this.classes.delete(cls),
    contains: (cls: string) => this.classes.has(cls),
  };

  constructor(
    public readonly tag: string,
    classes: string[] = [],
  ) {
    this.classes = new Set(classes);
  }

  append(child: StubElement): StubElement {
    this.children.push(child);
    return child;
  }

  matches(selector: string): boolean {
    return selectorPredicate(selector)(this);
  }

  // Descendants only, document order — like the real thing.
  querySelectorAll(selector: string): StubElement[] {
    const test = selectorPredicate(selector);
    const out: StubElement[] = [];
    const walk = (el: StubElement) => {
      for (const child of el.children) {
        if (test(child)) out.push(child);
        walk(child);
      }
    };
    walk(this);
    return out;
  }
}

type IOCallback = (entries: IntersectionObserverEntry[]) => void;

class StubIntersectionObserver {
  static instances: StubIntersectionObserver[] = [];
  observed = new Set<StubElement>();
  disconnected = false;

  constructor(private readonly callback: IOCallback) {
    StubIntersectionObserver.instances.push(this);
  }

  observe(el: StubElement) {
    this.observed.add(el);
  }
  unobserve(el: StubElement) {
    this.observed.delete(el);
  }
  disconnect() {
    this.disconnected = true;
    this.observed.clear();
  }

  // Report `el` as intersecting, the way the browser would on the next frame.
  intersect(el: StubElement) {
    if (!this.observed.has(el)) return;
    this.callback([
      {
        isIntersecting: true,
        target: el,
      } as unknown as IntersectionObserverEntry,
    ]);
  }
}

type MOCallback = (records: MutationRecord[]) => void;

class StubMutationObserver {
  static instances: StubMutationObserver[] = [];
  target: StubElement | null = null;
  options: MutationObserverInit | null = null;
  disconnected = false;

  constructor(private readonly callback: MOCallback) {
    StubMutationObserver.instances.push(this);
  }

  observe(target: StubElement, options: MutationObserverInit) {
    this.target = target;
    this.options = options;
  }
  disconnect() {
    this.disconnected = true;
  }

  // Deliver what the browser would batch after `parent.append(...)`.
  emitChildList(added: StubElement[]) {
    this.callback([
      {
        type: 'childList',
        addedNodes: added,
      } as unknown as MutationRecord,
    ]);
  }
  // Deliver what the browser would batch after `el.className = ...`.
  emitClassChange(el: StubElement) {
    this.callback([
      { type: 'attributes', target: el } as unknown as MutationRecord,
    ]);
  }
}

type Env = {
  body: StubElement;
  io: () => StubIntersectionObserver | undefined;
  mo: () => StubMutationObserver;
};

function installEnv(reducedMotion: boolean): Env {
  StubIntersectionObserver.instances = [];
  StubMutationObserver.instances = [];
  const body = new StubElement('body');
  const g = globalThis as unknown as Record<string, unknown>;
  g.document = {
    body,
    querySelectorAll: (selector: string) => body.querySelectorAll(selector),
  };
  g.window = {
    matchMedia: () => ({ matches: reducedMotion }),
  };
  g.Node = { ELEMENT_NODE: 1 };
  g.IntersectionObserver = StubIntersectionObserver;
  g.MutationObserver = StubMutationObserver;
  return {
    body,
    io: () => StubIntersectionObserver.instances[0],
    mo: () => StubMutationObserver.instances[0],
  };
}

const SELECTOR = '.reveal:not(.is-revealed)';
const SHOWN = 'is-revealed';

// --- cases ------------------------------------------------------------------

function elementsPresentAtArmTimeStillReveal(): void {
  const env = installEnv(false);
  const section = env.body.append(new StubElement('section'));
  const h1 = section.append(new StubElement('h1', ['reveal']));
  const teardown = armScrollReveal(SELECTOR, SHOWN);

  const io = env.io()!;
  check('hard load: existing .reveal is observed', io.observed.has(h1));
  io.intersect(h1);
  check(
    'hard load: intersecting adds is-revealed and stops observing',
    h1.classes.has(SHOWN) && !io.observed.has(h1),
  );
  teardown();
}

function nodesInsertedLaterAreObserved(): void {
  const env = installEnv(false);
  armScrollReveal(SELECTOR, SHOWN);
  const io = env.io()!;
  const mo = env.mo();

  check(
    'mutation observer watches <body> for inserted nodes and class rewrites',
    mo.target === env.body &&
      mo.options?.childList === true &&
      mo.options?.subtree === true &&
      mo.options?.attributes === true &&
      Array.isArray(mo.options?.attributeFilter) &&
      mo.options.attributeFilter.includes('class'),
    JSON.stringify(mo.options),
  );

  // The KITE-7581 shape: the CMS save re-renders the route in place and a new
  // block subtree lands under <body> — the block root is NOT itself a match,
  // its descendants are.
  const block = new StubElement('section');
  const eyebrow = block.append(new StubElement('p', ['reveal']));
  const inner = block.append(new StubElement('div'));
  const heading = inner.append(new StubElement('h1', ['reveal']));
  const img = block.append(new StubElement('img'));
  env.body.append(block);
  mo.emitChildList([block]);

  check(
    'in-place refresh: descendants of an inserted subtree are observed',
    io.observed.has(eyebrow) && io.observed.has(heading),
  );
  check(
    'in-place refresh: non-reveal nodes are left alone',
    !io.observed.has(img),
  );
  io.intersect(heading);
  check(
    'in-place refresh: the inserted heading reveals on intersection',
    heading.classes.has(SHOWN),
  );

  // An inserted node that is itself the match (no wrapper).
  const bare = new StubElement('h2', ['reveal']);
  env.body.append(bare);
  mo.emitChildList([bare]);
  check(
    'in-place refresh: an inserted node that is itself a match is observed',
    io.observed.has(bare),
  );

  // Text nodes ride along in addedNodes; they have no `matches`.
  const text = { nodeType: 3 } as unknown as StubElement;
  let threw = false;
  try {
    mo.emitChildList([text]);
  } catch {
    threw = true;
  }
  check('in-place refresh: non-element nodes are skipped', !threw);
}

function classRewriteRearmsARevealedElement(): void {
  const env = installEnv(false);
  const h1 = env.body.append(new StubElement('h1', ['reveal', SHOWN]));
  armScrollReveal(SELECTOR, SHOWN);
  const io = env.io()!;
  const mo = env.mo();

  check(
    'already-revealed element is not observed at arm time',
    !io.observed.has(h1),
  );

  // React sets `className` wholesale when the prop changes, dropping the
  // imperatively added is-revealed.
  h1.classList.remove(SHOWN);
  mo.emitClassChange(h1);
  check(
    'class rewrite that drops is-revealed re-observes the element',
    io.observed.has(h1),
  );
  io.intersect(h1);
  check('...and it reveals again', h1.classes.has(SHOWN));

  // The reveal itself is a class mutation; it must not re-observe (no loop).
  mo.emitClassChange(h1);
  check('adding is-revealed does not re-observe', !io.observed.has(h1));
}

function reducedMotionRevealsInsertedNodesImmediately(): void {
  const env = installEnv(true);
  const existing = env.body.append(new StubElement('h1', ['reveal']));
  armScrollReveal(SELECTOR, SHOWN);
  check(
    'reduced motion: no IntersectionObserver is created',
    env.io() === undefined,
  );
  check(
    'reduced motion: existing match is revealed immediately',
    existing.classes.has(SHOWN),
  );

  const later = new StubElement('p', ['reveal']);
  env.body.append(later);
  env.mo().emitChildList([later]);
  check(
    'reduced motion: inserted match is revealed immediately',
    later.classes.has(SHOWN),
  );
}

// A caller may pair a selector with a shown class that does not exclude it
// (`.fade-in` + `shown`). Under reduced motion the reveal writes the class,
// the class observer reports it, the element still matches — an unconditional
// `classList.add` would re-serialise the attribute and loop forever.
function reducedMotionRevealIsIdempotentForANonExcludingSelector(): void {
  const env = installEnv(true);
  const el = env.body.append(new StubElement('p', ['fade-in']));
  let writes = 0;
  const add = el.classList.add;
  el.classList.add = (cls: string) => {
    writes++;
    return add(cls);
  };
  armScrollReveal('.fade-in', 'shown');
  check('non-excluding selector: revealed once at arm time', writes === 1);
  env.mo().emitClassChange(el);
  env.mo().emitClassChange(el);
  check(
    'non-excluding selector: class mutations do not rewrite the class again',
    writes === 1,
    `writes=${writes}`,
  );
}

// Same non-excluding pairing on the animated path: the reveal's class write
// is reported, the element still matches, and it must not be re-observed —
// otherwise it reveals, re-arms and reveals again on every frame.
function animatedRevealDoesNotReobserveANonExcludingSelector(): void {
  const env = installEnv(false);
  const el = env.body.append(new StubElement('p', ['fade-in']));
  armScrollReveal('.fade-in', 'shown');
  const io = env.io()!;
  check(
    'non-excluding selector, animated: observed at arm time',
    io.observed.has(el),
  );
  io.intersect(el);
  check(
    'non-excluding selector, animated: revealed and unobserved',
    el.classes.has('shown') && !io.observed.has(el),
  );
  env.mo().emitClassChange(el);
  check(
    'non-excluding selector, animated: the reveal itself does not re-observe',
    !io.observed.has(el),
  );
}

function teardownDisconnectsBothObservers(): void {
  const env = installEnv(false);
  env.body.append(new StubElement('h1', ['reveal']));
  const teardown = armScrollReveal(SELECTOR, SHOWN);
  teardown();
  check(
    'teardown disconnects the intersection and mutation observers',
    env.io()!.disconnected && env.mo().disconnected,
  );
}

function main(): void {
  console.log('scroll-reveal arming contract');
  elementsPresentAtArmTimeStillReveal();
  nodesInsertedLaterAreObserved();
  classRewriteRearmsARevealedElement();
  reducedMotionRevealsInsertedNodesImmediately();
  reducedMotionRevealIsIdempotentForANonExcludingSelector();
  animatedRevealDoesNotReobserveANonExcludingSelector();
  teardownDisconnectsBothObservers();

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
  console.log('\nall checks passed');
}

main();
