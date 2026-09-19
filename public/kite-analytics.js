/*
 * Kite analytics SDK — STAMP-DRIVEN.
 *
 * Emits events derived purely from the `data-kite-*` DOM stamps. What is CLOSED
 * and identical on every site is the `kite_event_type` PROPERTY (the machine
 * vocabulary below); event NAMES for interactions/conversions are per-site via
 * `data-kite-event` (evName) — cross-site queries MUST group on
 * kite_event_type, never on the event name. There is NO per-site plan/config engine: what is
 * tracked is decided by the stamps baked into the Payload block templates
 * (RenderBlocks surfaces + block-component CTAs), never by an agent-authored
 * events list.
 *
 * Inputs (inline from the server-rendered bootstrap):
 *   - window.__KITE_ENV__ : per-site identity (website id, account id, token,
 *     goal type, schema version). There is no host field — the ingest host is
 *     baked into the posthog.init the layout emits.
 *   - window.__KITE_PH__  : OPTIONAL. The PostHog instance these events belong
 *     to, published by that init's `loaded` callback. Present only on a site
 *     that runs its own analytics client, where window.posthog is that client's
 *     instance and pointed at that client's project.
 * (the backend site_event_catalog is reference data for the analytics layer; the
 *  SDK does NOT read it at runtime.)
 *
 * Closed vocabulary (the single source for this contract — keep exact):
 *   Lifecycle: page_viewed, page_engaged, scroll_depth_reached,
 *     section_viewed, section_engaged, item_viewed.
 *   Interactions: cta_clicked, nav_clicked, content_expanded, media_engaged,
 *     form_submitted (incl. conversion_attempt:true on hooked forms),
 *     form_submit_failed.
 *   Conversions: the event NAME is the authored data-kite-event (else
 *     "<goal_type>_completed"); the closed handle is the PROPERTY
 *     kite_event_type="goal_completed" + is_conversion + goal_type — a literal
 *     "goal_completed" event name is only the no-goal-type fallback.
 *   Mirrored: kite_event_type="mirrored" — an event a THIRD-PARTY analytics
 *     client on the page fired, copied here so a site Kite did not instrument
 *     still reports its own triggers. Only the event NAME and mirror_source
 *     travel; the vendor call's property values never leave the page — they
 *     are unclassified customer data the positive allowlist below has not
 *     approved (see the mirroring section for why). Wraps only the providers
 *     the site DECLARES (env.mirrorProviders — the platform detector's
 *     findings for this exact site), covering vendor clients exposed on
 *     `window` (snippet/CDN installs); a module-local ESM client is out of
 *     interception reach by construction.
 * Interaction event NAMES honor data-kite-event via evName(); nav is
 * deliberately non-nameable (fixed "nav_clicked" — nav identity rides in
 * nav_id). Per-site variation rides in PROPERTY VALUES the SDK itself assigns
 * (surface_id, cta_id, role, goal_type, item_id), never in new event types.
 * Caller-supplied names (data-kite-prop-* stamps, window.__kite.conversion
 * props) are captured ONLY after the key is registered with a sensitivity
 * class in the backend contract and named in APPROVED_EXTRA_PROP_NAMES below
 * — the allowlist is empty today, so every caller-defined key is dropped.
 */
(function () {
  'use strict';

  // Deliberately NOT gated on a PostHog global being present yet. Both handles
  // this SDK can capture into arrive asynchronously (see `destination`), and a
  // site whose own analytics client is an npm `posthog-js` import never assigns
  // window.posthog at all — posthog-js only does that on its CDN path. Returning
  // here on that site meant a correctly retrofitted page emitted nothing, with
  // no error to find.
  var env = window.__KITE_ENV__;
  if (!env || !env.posthogToken) return;

  var SCHEMA_VERSION = env.schemaVersion || '1.0';
  var DEBUG = !!env.debug || /[?&]kite_debug=1/.test(window.location.search);

  // ---- helpers -------------------------------------------------------------

  // The PostHog instance these events belong to, resolved at CALL TIME. Nothing
  // here may be captured at boot: the inline loader stub is swapped for the real
  // instance once array.js finishes its async load, and __KITE_PH__ is published
  // by that same init's `loaded` callback, so a reference taken at boot is either
  // stale or absent and silently drops every later event.
  //
  // __KITE_PH__ wins because it is the instance built with THIS site's Kite token
  // and ingest host, published by the named init's `loaded` callback once
  // array.js finishes loading.
  //
  // window.posthog.kite is the SAME instance BEFORE that load completes. Every
  // template inits with the name 'kite', and the vendor snippet attaches its
  // queueing method stubs to `window.posthog[name]` on a named init
  // (`void 0!==a?u=e[a]=[]:a="posthog"`) — `window.posthog` itself then carries
  // only `_i`/`init`/`__SV` and NO capture. posthog-js drains this named queue
  // when the real instance initializes, so events captured here are delivered in
  // order. Without this middle step, every capture between DOMContentLoaded and
  // array.js load — the first page_viewed and the once-per-boot identity
  // envelope — threw a swallowed TypeError on the bare stub and vanished.
  // ('kite' is hand-synced with the helper's KITE_INSTANCE_NAME constant; the
  // package cannot be imported from this standalone IIFE. The contract test
  // pins both.)
  //
  // And that is the WHOLE ladder — there is deliberately no bare window.posthog
  // fallback. Every Kite integration is a NAMED instance ('kite'), so a Kite
  // client is only ever reachable through these two handles. On a site that runs
  // its own analytics client, window.posthog belongs to that client, and a
  // fallback to it would file Kite's stamped events into the site owner's own
  // project — cross-tenant, with no error anywhere. Emitting nothing (and
  // warning under debug, below) is the correct behaviour when the named handles
  // are absent: it means the init that publishes them has not run, i.e. the
  // installed helper predates naming, which is a build-pipeline fault to fix,
  // not one to paper over by guessing at destinations.
  function destination() {
    return window.__KITE_PH__ || (window.posthog && window.posthog.kite);
  }

  // One-shot: a page that never resolves a destination would otherwise warn on
  // every interaction for the rest of the session.
  var warnedNoDestination = false;
  function noDestination() {
    if (DEBUG && !warnedNoDestination && window.console) {
      warnedNoDestination = true;
      window.console.warn('[kite] no PostHog instance; dropping events');
    }
  }

  // One-shot per key: an author whose stamped or programmatic property is not
  // contract-registered sees WHY the field is missing under DEBUG, matching
  // the other drop paths (noDestination, capture) instead of a silent drop.
  // Null prototype: a plain {} both resolves inherited members on lookup and
  // routes '__proto__' assignment through the inherited setter (never creating
  // the own key), so those rejected names would warn wrongly. See rejectedProp.
  var warnedRejectedProps = Object.create(null);
  function rejectedProp(name) {
    // Own-property check: a plain lookup resolves inherited Object.prototype
    // members ('constructor', 'toString'), silently suppressing the warning
    // for exactly those rejected keys.
    if (
      DEBUG &&
      !Object.prototype.hasOwnProperty.call(warnedRejectedProps, name) &&
      window.console
    ) {
      warnedRejectedProps[name] = true;
      window.console.warn(
        '[kite] dropping unregistered property "' +
          name +
          '" — register it with a sensitivity class in the backend contract first',
      );
    }
  }

  // A swallowed failure is surfaced when DEBUG is on (env.debug or ?kite_debug=1)
  // so zero-delivery is detectable instead of invisible.
  function capture(event, props) {
    var ph = destination();
    if (!ph) return noDestination();
    try {
      ph.capture(event, props || {});
    } catch (e) {
      if (DEBUG && window.console)
        window.console.warn('[kite] capture failed:', event, e);
    }
  }

  // Interaction/conversion events use PostHog's DEFAULT transport (fetch +
  // keepalive), which survives page unload — verified live. Do NOT reintroduce
  // a { transport: 'sendBeacon' } capture option: that override silently
  // dropped 100% of interaction events (64KB batching interaction).

  function each(nodelist, fn) {
    for (var i = 0; i < nodelist.length; i++) fn(nodelist[i]);
  }

  function closestAttr(el, attr) {
    var node = el;
    while (node && node.nodeType === 1) {
      if (node.hasAttribute(attr)) return node;
      node = node.parentElement;
    }
    return null;
  }

  function surfaceContext(el) {
    var surface =
      el && el.nodeType === 1 ? closestAttr(el, 'data-kite-surface') : null;
    if (!surface) return {};
    return {
      surface_id: surface.getAttribute('data-kite-surface'),
      surface_type: surface.getAttribute('data-kite-surface-type') || undefined,
    };
  }

  // POSITIVE allowlist for caller-extensible properties, on every emission
  // path (stamps and window.__kite.conversion alike). The canonical contract
  // (backend kite_event_contract.py, decision 2026-08-18) approves each
  // event's parameters WITH a sensitivity class; every parameter it approves
  // is assigned by this SDK itself, so the extensible set is EMPTY today.
  // Unknown keys are rejected before capture — an unclassified key must
  // never reach analytics (a deny-list made {email: …} capturable by
  // default). Extending this set requires registering the key with a
  // sensitivity class in the backend contract first, then naming it here.
  var APPROVED_EXTRA_PROP_NAMES = {};

  // data-kite-prop-* → { name: value }: only contract-approved extensible
  // names are captured; everything else — reserved SDK fields and
  // unclassified keys alike — is dropped before capture.
  function propsFromEl(el) {
    var out = {};
    if (!el || !el.attributes) return out;
    for (var i = 0; i < el.attributes.length; i++) {
      var a = el.attributes[i];
      if (a.name.indexOf('data-kite-prop-') === 0) {
        var name = a.name.slice('data-kite-prop-'.length);
        if (APPROVED_EXTRA_PROP_NAMES.hasOwnProperty(name)) out[name] = a.value;
        else rejectedProp(name);
      }
    }
    return out;
  }

  function text(el) {
    return el && el.textContent
      ? el.textContent.trim().slice(0, 120)
      : undefined;
  }

  function toInt(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? undefined : n;
  }

  // Merge surface ctx + element props into a base props object.
  function withSurface(el, base) {
    var ctx = surfaceContext(el);
    if (ctx.surface_id !== undefined) base.surface_id = ctx.surface_id;
    if (ctx.surface_type !== undefined) base.surface_type = ctx.surface_type;
    var extra = propsFromEl(el);
    for (var k in extra) base[k] = extra[k];
    return base;
  }

  // Each interaction emits ONE event. Its NAME is the element's data-kite-event
  // (the PM-facing name); its machine class rides as the kite_event_type property
  // so cross-site/agent queries work regardless of the per-site name.
  function evName(el, fallback) {
    return (
      (el && el.getAttribute && el.getAttribute('data-kite-event')) || fallback
    );
  }

  // One stamped interaction event: NAME resolved via evName (authored
  // data-kite-event, else the machine fallback), surface context merged, and
  // the closed kite_event_type ALWAYS riding as the fallback name — the
  // invariant every interaction call site must hold, in one place so a future
  // call site can't get it wrong. nav_clicked and the hooked-form attempt use
  // literal names on purpose (see their call sites) and stay outside.
  function emitStamped(el, fallbackName, extraProps) {
    extraProps.kite_event_type = fallbackName;
    capture(evName(el, fallbackName), withSurface(el, extraProps));
  }

  // Fire a conversion goal event. The event NAME is the element's data-kite-event,
  // else "<goal_type>_completed" (never the generic "goal_completed", which would
  // not match the catalog's primary_conversion_event). Shared by DOM stamps
  // (emitGoal) and the JS success hook (window.__kite.conversion).
  function fireGoal(goalType, extraProps, el) {
    var props = el ? withSurface(el, {}) : {};
    props.kite_event_type = 'goal_completed';
    props.is_conversion = true;
    if (goalType) props.goal_type = goalType;
    if (el) {
      var cid = el.getAttribute('data-kite-cta-id');
      if (cid) props.cta_id = cid;
      var lbl = text(el);
      if (lbl) props.label = lbl;
      // Item dimension: which product/plan/service this conversion belongs to
      // (the stamp may sit on the element itself or an ancestor card).
      var itemEl = closestAttr(el, 'data-kite-item');
      if (itemEl) props.item_id = itemEl.getAttribute('data-kite-item');
      // How the goal completes: a form is a verifiable OUTCOME; mailto/tel is
      // INTENT (the click is all we can observe) — lets dashboards split them.
      // A conversion element INSIDE a stamped form also completes via that
      // form's submit (onSubmit resolves it via querySelector), so it is a
      // verifiable outcome too — 'button' would misclassify it as intent.
      var href = el.getAttribute && el.getAttribute('href');
      props.conversion_medium =
        (el.tagName && el.tagName.toLowerCase() === 'form') ||
        closestAttr(el, 'data-kite-form-type')
          ? 'form'
          : href && href.indexOf('mailto:') === 0
            ? 'mailto'
            : href && href.indexOf('tel:') === 0
              ? 'tel'
              : href
                ? 'link'
                : 'button';
    }
    // Programmatic props pass the same reserved-name gate as data-kite-prop-*
    // stamps: the public window.__kite.conversion API takes an arbitrary props
    // object, and letting it overwrite kite_event_type / is_conversion (or any
    // other contract field assigned above) would make a real conversion vanish
    // from conversion totals. The closed machine-event contract holds on every
    // emission path, not only DOM-derived properties.
    if (extraProps)
      for (var k in extraProps)
        if (APPROVED_EXTRA_PROP_NAMES.hasOwnProperty(k))
          props[k] = extraProps[k];
        else rejectedProp(k);
    capture(
      evName(el, goalType ? goalType + '_completed' : 'goal_completed'),
      props,
    );
  }

  // A conversion element (a fire-and-forget link/button, or a submitted <form>)
  // emits its goal event and nothing else.
  function emitGoal(el) {
    var conv = closestAttr(el, 'data-kite-conversion');
    if (!conv) return false;
    fireGoal(conv.getAttribute('data-kite-conversion'), null, conv);
    return true;
  }

  // Success hook for JS/async conversions (marked data-kite-conversion-hook) —
  // forms AND non-form widgets: the element's own success handler calls this so
  // the goal fires ONLY on a real success, not on the submit/click attempt (the
  // native submit event fires even for a submission the app later rejects, and
  // onClick skips hooked conversions for the same reason). Guard the call site:
  // `window.__kite && window.__kite.conversion('booking')`.
  window.__kite = window.__kite || {};
  window.__kite.conversion = function (goalType, props) {
    // The platform records Kite contact-form conversions SERVER-side, so they
    // survive a blocked posthog-js. When it did, submitContactForm sets this
    // one-shot flag and the client stands down — otherwise the same conversion
    // counts twice for every visitor who is NOT blocking. Consumed (not just
    // read) so a second, genuinely different conversion later on the page still
    // fires. If the server did not record — capture failed, an older platform,
    // or a custom form that never went through submitContactForm — the flag is
    // absent and the client fires as before, so the conversion is never lost.
    if (window.__kite.serverRecorded) {
      window.__kite.serverRecorded = false;
      return;
    }
    // Auto-resolve the stamped element so the goal inherits surface_id /
    // cta_id / the authored data-kite-event name — call sites pass only the
    // goal type. Explicit non-reserved props still win (applied last in
    // fireGoal); reserved contract fields cannot be overwritten there.
    // Prefer the form the visitor ACTUALLY submitted (recorded by onSubmit):
    // the same goal form can legitimately appear more than once on a page
    // (hero + footer), and document.querySelector would always attribute to
    // the document-first copy. The regex guard keeps the attribute selector
    // safe to build for the fallback.
    var el = null;
    if (
      lastHookedSubmitEl &&
      lastHookedSubmitEl.getAttribute &&
      lastHookedSubmitEl.getAttribute('data-kite-conversion') === goalType
    ) {
      el = lastHookedSubmitEl;
    } else if (goalType && /^[a-z_]+$/.test(goalType)) {
      try {
        el = document.querySelector(
          '[data-kite-conversion="' + goalType + '"]',
        );
      } catch (e) {
        el = null;
      }
    }
    fireGoal(goalType, props, el);
  };

  // ---- Layer 1 envelope ----------------------------------------------------

  function viewportBucket() {
    var w = window.innerWidth || 0;
    if (w < 480) return 'xs';
    if (w < 768) return 'sm';
    if (w < 1024) return 'md';
    if (w < 1440) return 'lg';
    return 'xl';
  }

  function trafficSource() {
    var p = new URLSearchParams(window.location.search);
    var medium = (p.get('utm_medium') || '').toLowerCase();
    var ref = document.referrer || '';
    var host = '';
    try {
      host = ref ? new URL(ref).host : '';
    } catch (e) {
      host = '';
    }
    if (
      p.get('gclid') ||
      p.get('msclkid') ||
      ['cpc', 'ppc', 'paid_search'].indexOf(medium) >= 0
    )
      return 'paid_search';
    if (
      p.get('fbclid') ||
      p.get('ttclid') ||
      p.get('li_fat_id') ||
      medium === 'paid_social'
    )
      return 'paid_social';
    if (medium === 'email') return 'email';
    if (
      /(chatgpt\.com|perplexity\.ai|claude\.ai|gemini\.google\.com)/.test(host)
    )
      return 'ai_assistant';
    if (/(google|bing|duckduckgo|yahoo|ecosia)\./.test(host) && host)
      return 'organic_search';
    if (
      /(facebook|instagram|twitter|x\.com|linkedin|reddit|youtube|tiktok|t\.co)/.test(
        host,
      )
    )
      return 'organic_social';
    if (host) return 'referral';
    return 'direct';
  }

  var CONSENT = env.consentState || 'granted';

  // NOTE: visit_number counts lifetime FULL PAGE LOADS (localStorage counter
  // incremented once per hard load), not sessions — a reload mid-visit
  // increments it. Rename/re-derive if session semantics are ever needed.
  function firstTouch() {
    if (CONSENT !== 'granted')
      return { is_new_visitor: null, visit_number: null };
    try {
      var raw = window.localStorage.getItem('__kite_ft');
      if (!raw) {
        window.localStorage.setItem('__kite_ft', JSON.stringify({ v: 1 }));
        return { is_new_visitor: true, visit_number: 1 };
      }
      var data = JSON.parse(raw);
      var n = (data.v || 1) + 1;
      window.localStorage.setItem('__kite_ft', JSON.stringify({ v: n }));
      return { is_new_visitor: false, visit_number: n };
    } catch (e) {
      return { is_new_visitor: null, visit_number: null };
    }
  }

  function pageContext() {
    var main = document.querySelector('[data-kite-page-id]');
    return {
      page_id: main ? main.getAttribute('data-kite-page-id') : undefined,
      page_type: main ? main.getAttribute('data-kite-page-type') : undefined,
    };
  }

  function registerEnvelope(includeFirstTouch) {
    var props = {
      schema_version: SCHEMA_VERSION,
      website_id: env.websiteId,
      account_id: env.accountId,
      traffic_source: trafficSource(),
      viewport_bucket: viewportBucket(),
      consent_state: CONSENT,
    };
    if (env.goalType) props.site_goal = env.goalType;
    var page = pageContext();
    for (var k in page) if (page[k] !== undefined) props[k] = page[k];
    if (includeFirstTouch) {
      var ft = firstTouch();
      props.is_new_visitor = ft.is_new_visitor;
      props.visit_number = ft.visit_number;
    }
    try {
      // Super-properties go on the SAME instance capture() uses, never the page
      // default: posthog-js keys persistence on the token (ph_<token>_posthog),
      // so registering on the other instance would both miss every Kite event
      // and write Kite's envelope into the site's own client.
      var ph = destination();
      if (ph) ph.register(props);
      else noDestination();
    } catch (e) {
      if (DEBUG && window.console)
        window.console.warn('[kite] register failed', e);
    }
  }

  // ---- once-per-pageview guards -------------------------------------------

  var seen = {};
  function once(key) {
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  }

  var keyCounter = 0;
  function elementKey(el) {
    if (!el.__kiteKey) el.__kiteKey = ++keyCounter;
    return el.__kiteKey;
  }

  // ---- universal page lifecycle -------------------------------------------

  var pageStart = Date.now();
  var activeMs = 0;
  var lastActive = Date.now();
  var maxScrollPct = 0;
  var interactionCount = 0;
  var loadSource = 'initial';
  // The conversion-hook form the visitor last submitted, so __kite.conversion
  // attributes the goal to that copy (not the document-first match). Null after
  // navigation: a hook fired on a later page falls back to querySelector.
  var lastHookedSubmitEl = null;

  // ONE reset point for every per-pageview counter. Resetting fields ad hoc in
  // onRouteChange is how interaction_count once leaked across SPA routes
  // (cumulative counts in every later page_engaged) — add new per-page state
  // HERE, never as a loose assignment at a call site.
  function resetPageState(source) {
    seen = {};
    // Clear PENDING section_viewed timers, not just the map: a surface >=50%
    // visible for <1s at navigation still has a live setTimeout that would fire
    // against the NEW page (stray section_viewed, and via the fresh once-key it
    // could even suppress the new page's legitimate one).
    for (var k in surfaceTimers) clearTimeout(surfaceTimers[k]);
    surfaceTimers = {};
    pageStart = Date.now();
    activeMs = 0;
    lastActive = Date.now();
    maxScrollPct = 0;
    interactionCount = 0;
    loadSource = source;
    lastHookedSubmitEl = null;
  }
  // Track path (excluding hash) so in-page anchor clicks (#features) are not
  // counted as pageviews — only real route changes (pathname/search) are.
  var lastPath = location.pathname + location.search;

  function emitPageViewed() {
    var ctx = pageContext();
    capture('page_viewed', {
      load_source: loadSource,
      page_id: ctx.page_id,
      page_type: ctx.page_type,
    });
  }

  function accumulateActive() {
    if (document.visibilityState === 'visible')
      activeMs += Date.now() - lastActive;
    lastActive = Date.now();
  }

  function emitPageEngagement() {
    // visibilitychange(hidden) and pagehide both fire on a normal unload — guard
    // so dwell/scroll/interaction metrics are not double-counted. Reset per SPA
    // route via onRouteChange's `seen = {}`.
    if (!once('page_engaged')) return;
    accumulateActive();
    // Flush dwell for any surface still in view at unload; section_engaged
    // otherwise only fires when a surface LEAVES the viewport, losing the
    // terminal surface of nearly every session.
    each(document.querySelectorAll('[data-kite-surface]'), function (el) {
      maybeSectionEngaged(el);
    });
    capture('page_engaged', {
      active_time_ms: activeMs,
      wall_time_ms: Date.now() - pageStart,
      max_scroll_pct: maxScrollPct,
      interaction_count: interactionCount,
    });
  }

  function onScroll() {
    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) {
      // Page fits the viewport — nothing to scroll. Record full depth for
      // page_engaged but do NOT emit synthetic scroll_depth_reached events
      // (which previously fired all of 25/50/75/100 at load with time≈0).
      maxScrollPct = 100;
      return;
    }
    var pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
    if (pct > maxScrollPct) maxScrollPct = pct;
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && once('scroll_' + m)) {
        capture('scroll_depth_reached', {
          depth_pct: m,
          time_to_depth_ms: Date.now() - pageStart,
        });
      }
    });
  }

  // ---- universal surface lifecycle ----------------------------------------

  var surfaceTimers = {};
  var surfaceObserver = null;
  function observeSurfaces() {
    if (!('IntersectionObserver' in window)) return;
    // SPA navigations re-run this; disconnect the previous observer so it does
    // not keep firing on the old DOM and double-count section views.
    if (surfaceObserver) surfaceObserver.disconnect();
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var el = entry.target;
          var key = elementKey(el);
          // A surface taller than the viewport can never have >=50% of ITS OWN
          // area on screen, so also treat "fills >=50% of the viewport" as viewed
          // (otherwise hero / long-form sections never emit section_viewed).
          var rect = entry.intersectionRect;
          var enough =
            entry.isIntersecting &&
            (entry.intersectionRatio >= 0.5 ||
              (rect && rect.height >= (window.innerHeight || 0) * 0.5));
          if (enough) {
            if (surfaceTimers[key]) return;
            surfaceTimers[key] = setTimeout(function () {
              emitSectionViewed(el);
            }, 1000);
          } else {
            if (surfaceTimers[key]) {
              clearTimeout(surfaceTimers[key]);
              delete surfaceTimers[key];
            }
            maybeSectionEngaged(el);
          }
        });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    surfaceObserver = io;
    each(document.querySelectorAll('[data-kite-surface]'), function (n) {
      io.observe(n);
    });
  }

  function emitSectionViewed(el) {
    var ctx = surfaceContext(el);
    if (once('section_viewed_' + ctx.surface_id)) {
      capture('section_viewed', {
        surface_id: ctx.surface_id,
        surface_type: ctx.surface_type,
        position_index: toInt(el.getAttribute('data-kite-position')),
        time_to_view_ms: Date.now() - pageStart,
      });
    }
    el.__kiteEnteredAt = Date.now();
  }

  function maybeSectionEngaged(el) {
    if (!el.hasAttribute('data-kite-surface') || !el.__kiteEnteredAt) return;
    var ctx = surfaceContext(el);
    capture('section_engaged', {
      surface_id: ctx.surface_id,
      dwell_ms: Date.now() - el.__kiteEnteredAt,
    });
    el.__kiteEnteredAt = 0;
  }

  // ---- stamp-driven interaction handlers (the closed vocabulary) ----------

  function onClick(e) {
    interactionCount++;

    // Fire-and-forget conversion (call / WhatsApp / external link): the goal
    // completes on click, so count it now. A conversion on (or inside) a <form>
    // completes on SUBMIT, not click — skip it here; onSubmit / the success hook
    // fires it, and a scroll-to-form CTA carries no conversion stamp at all.
    var conv = closestAttr(e.target, 'data-kite-conversion');
    if (conv) {
      var convIsForm =
        (conv.tagName && conv.tagName.toLowerCase() === 'form') ||
        !!closestAttr(e.target, 'data-kite-form-type');
      if (!convIsForm) {
        // A hook-marked NON-form conversion (JS/async widget: booking modal,
        // checkout popover) completes in its own success handler via
        // window.__kite.conversion — the click is only the attempt. Firing
        // here too would double-count every widget conversion.
        if (!conv.hasAttribute('data-kite-conversion-hook')) {
          emitGoal(conv);
        }
        return; // the goal is the only event for this interaction
      }
      // Form-conversion submit control clicked: fall through to plain click
      // tracking; the goal is emitted only on a successful submit.
    }

    var cta = closestAttr(e.target, 'data-kite-cta-id');
    if (cta && !cta.hasAttribute('data-kite-conversion')) {
      // Item dimension: loop-rendered CTAs share one cta_id (the slot); the
      // per-item stamp (on the CTA or an ancestor card) tells items apart.
      var ctaItem = closestAttr(e.target, 'data-kite-item');
      emitStamped(cta, 'cta_clicked', {
        cta_id: cta.getAttribute('data-kite-cta-id'),
        role: cta.getAttribute('data-kite-role') || undefined,
        label: text(cta),
        item_id: ctaItem ? ctaItem.getAttribute('data-kite-item') : undefined,
      });
    }

    var nav = closestAttr(e.target, 'data-kite-nav');
    if (nav) {
      // Deliberately NOT evName(): nav links are non-nameable (fixed event,
      // identity rides in nav_id) or per-site nav names would explode cardinality.
      capture('nav_clicked', {
        kite_event_type: 'nav_clicked',
        nav_id: nav.getAttribute('data-kite-nav'),
        nav_location: nav.getAttribute('data-kite-nav-location') || undefined,
        link_text: text(nav),
        destination_url: nav.getAttribute('href') || undefined,
      });
    }

    var expand = closestAttr(e.target, 'data-kite-expand');
    // Once-key by the STAMP value, not elementKey(): a React re-render replaces
    // the DOM node, and a per-instance key would re-fire content_expanded for a
    // section the visitor already expanded this pageview.
    if (expand && once('expand_' + expand.getAttribute('data-kite-expand'))) {
      emitStamped(expand, 'content_expanded', {
        expand_id: expand.getAttribute('data-kite-expand'),
        label: text(expand),
      });
    }
  }

  function onSubmit(e) {
    var form = closestAttr(e.target, 'data-kite-form-type');
    if (!form) return;
    // The conversion may be on the <form> itself or on a control inside it.
    var convEl = form.hasAttribute('data-kite-conversion')
      ? form
      : form.querySelector && form.querySelector('[data-kite-conversion]');
    if (convEl) {
      // JS/async form (data-kite-conversion-hook): it fires the goal from its own
      // success handler via window.__kite.conversion(...). The native submit event
      // fires even for a submission the app later rejects, so do NOT fire the goal
      // here — but DO record the ATTEMPT, or attempted-vs-completed is invisible
      // (server-side failures would look identical to never trying). Literal
      // 'form_submitted' on purpose: evName(form, …) would resolve to the GOAL's
      // authored name and corrupt the funnel.
      if (
        (convEl.hasAttribute &&
          convEl.hasAttribute('data-kite-conversion-hook')) ||
        form.hasAttribute('data-kite-conversion-hook')
      ) {
        lastHookedSubmitEl = convEl;
        capture(
          'form_submitted',
          withSurface(form, {
            kite_event_type: 'form_submitted',
            form_type: form.getAttribute('data-kite-form-type'),
            conversion_attempt: true,
          }),
        );
        return;
      }
      // Plain HTML form: the submit event fires only AFTER native validation
      // passes (empty/invalid required fields block it), so reaching here means a
      // successful submit → the goal.
      emitGoal(convEl);
      return;
    }
    emitStamped(form, 'form_submitted', {
      form_type: form.getAttribute('data-kite-form-type'),
    });
  }

  // Track a FAILED submit attempt (e.g. Submit clicked with an empty/invalid
  // required field) as a plain, non-conversion event so it is visible without
  // inflating the goal. The `invalid` event fires per-field and does not bubble,
  // so listen in the capture phase and de-dupe the per-field burst to one event
  // per attempt (a new attempt fires a fresh burst on the next tick).
  var formFailPending = false;
  function onInvalid(e) {
    var field = e.target;
    var form =
      field && field.form
        ? closestAttr(field.form, 'data-kite-form-type')
        : null;
    if (!form || formFailPending) return;
    formFailPending = true;
    setTimeout(function () {
      formFailPending = false;
    }, 0);
    capture(
      'form_submit_failed',
      withSurface(form, {
        kite_event_type: 'form_submit_failed',
        form_type: form.getAttribute('data-kite-form-type'),
      }),
    );
  }

  // Item exposure: one item_viewed per unique data-kite-item value per pageview
  // when the element is >=50% visible. The once-key is the ITEM VALUE, so a
  // card and its inner button sharing a slug emit a single event, and a React
  // re-render (new DOM node) cannot re-fire it. Answers "how many items does a
  // visitor browse" — the gallery/collection blind spot.
  var itemObserver = null;
  function observeItems() {
    if (!('IntersectionObserver' in window)) return;
    if (itemObserver) itemObserver.disconnect();
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
          var el = entry.target;
          var value = el.getAttribute('data-kite-item');
          if (!value || !once('item_view_' + value)) return;
          io.unobserve(el);
          capture(
            'item_viewed',
            withSurface(el, {
              kite_event_type: 'item_viewed',
              item_id: value,
            }),
          );
        });
      },
      { threshold: [0.5] },
    );
    itemObserver = io;
    each(document.querySelectorAll('[data-kite-item]'), function (n) {
      io.observe(n);
    });
  }

  function wireMedia() {
    each(document.querySelectorAll('[data-kite-media]'), function (el) {
      // SPA navigations re-run this; a media element that persists across routes
      // would otherwise accumulate listeners and fire media_engaged N times. Mark
      // each element once.
      if (el.__kiteMediaWired) return;
      el.__kiteMediaWired = true;
      el.addEventListener('play', function () {
        // Stamp-keyed like content_expanded above: a re-rendered (replaced)
        // media node must not re-fire media_engaged within the same pageview.
        if (once('media_play_' + el.getAttribute('data-kite-media'))) {
          emitStamped(el, 'media_engaged', {
            media_id: el.getAttribute('data-kite-media'),
            action: 'play',
          });
        }
      });
    });
  }

  // ---- SPA navigation ------------------------------------------------------

  function onRouteChange() {
    var path = location.pathname + location.search;
    if (path === lastPath) return; // hash-only / in-page anchor — not a pageview
    lastPath = path;
    accumulateActive();
    emitPageEngagement();
    resetPageState('spa_navigation');
    registerEnvelope(false);
    emitPageViewed();
    observeSurfaces();
    observeItems();
    wireMedia();
    // Mirror start()'s load-time scroll seeding: a page that fits the viewport
    // never fires a scroll event, so without this a short SPA-navigated page
    // reports max_scroll_pct 0 while the same page hard-loaded reports 100.
    onScroll();
  }

  function patchHistory() {
    ['pushState', 'replaceState'].forEach(function (m) {
      var orig = history[m];
      history[m] = function () {
        var r = orig.apply(this, arguments);
        setTimeout(onRouteChange, 0);
        return r;
      };
    });
    window.addEventListener('popstate', function () {
      setTimeout(onRouteChange, 0);
    });
  }

  // ---- boot ----------------------------------------------------------------

  // ---- Third-party client mirroring -------------------------------------
  //
  // A site instrumented before Kite arrived fires its events through a vendor
  // client, not through `data-kite-*` stamps. Nothing here can see those
  // triggers, so built-in analytics reports traffic and no conversions while
  // the site's own dashboard shows both. Wrapping the vendor's own track
  // function is what reaches them WITHOUT editing a single call site — the
  // customer's analytics keeps working byte-for-byte, and Kite gets a copy.
  //
  // The site DECLARES its providers (env.mirrorProviders, provider names the
  // platform's detector recorded for this exact site); nothing is sniffed.
  // That is what makes a generic global like `window.analytics` safe to
  // touch — it is wrapped only on a site whose own source carries Segment —
  // and what a site with no vendor pays: nothing. Late-loading clients are
  // caught by property traps (an accessor on the global that wraps whatever
  // the vendor eventually assigns), not by polling.
  //
  // BOUNDARY: only clients exposed on `window` are reachable — the
  // snippet/CDN install shape. A module-local client
  // (`import mixpanel from 'mixpanel-browser'`) never touches `window`, so
  // its events are detected by the backend inventory but cannot be mirrored
  // from here; the inventory deliberately records more than this file wraps.
  //
  // Mirrored events carry the vendor's event NAME and the source, NOTHING
  // ELSE. The vendor call's properties are the customer's, arbitrary by
  // construction, and carry no sensitivity classification — the same
  // positive-allowlist contract that makes propsFromEl drop every
  // unregistered key (APPROVED_EXTRA_PROP_NAMES) applies here, so vendor
  // property values never leave the page. That also closes the collision
  // class: a customer `website_id` or `page_id` that is never transmitted
  // cannot override an envelope super-property. See
  // docs/decisions/2026-08-24-existing-provider-events-mirror-into-built-in-analytics.md
  var MIRROR_EVENT_TYPE = 'mirrored';

  // Marks a function this SDK has already wrapped, so a re-install of the
  // same function (a trap firing twice) can never double-mirror one call.
  var MIRROR_FLAG = '__kiteMirrored';

  // Consent, read LIVE at capture time. The `kite_consent` cookie is the
  // sitewide authority — middleware.ts and src/lib/experiments.ts read the
  // same cookie, and only the exact value 'denied' refuses; absent means
  // granted, the documented client default. Production's __KITE_ENV__ carries
  // no consentState (the CONSENT snapshot above resolves to 'granted' there),
  // so mirroring must consult the live signal itself: a visitor who denies
  // consent — before load or mid-session — stops being mirrored on their next
  // vendor call. An unreadable cookie jar fails CLOSED for mirroring.
  function mirrorConsentDenied() {
    if (CONSENT !== 'granted') return true;
    try {
      return document.cookie.split(';').some(function (part) {
        return part.replace(/^\s+/, '') === 'kite_consent=denied';
      });
    } catch (e) {
      return true;
    }
  }

  function mirrorCapture(source, name) {
    if (mirrorConsentDenied()) return;
    if (!name || typeof name !== 'string') return;
    // Name and source only — the vendor call's property values are
    // unclassified customer data and never leave the page (see the section
    // comment above).
    capture(name, {
      kite_event_type: MIRROR_EVENT_TYPE,
      mirror_source: source,
    });
  }

  // Each extractor returns the vendor event's NAME, or null for a call that
  // is not an analytics event. Names only, by contract — see mirrorCapture.

  // `track(name, props)` — the shape Mixpanel, Amplitude and Segment share.
  function trackArgs(args) {
    return args[0];
  }

  // `gtag('event', name, params)`. Only the 'event' command is an analytics
  // event; 'config', 'set', 'consent' and 'js' are configuration.
  function gtagArgs(args) {
    if (args[0] !== 'event') return null;
    return args[1];
  }

  // `dataLayer.push({ event: 'name', ... })` — GTM's queue. Entries without an
  // `event` key are variable assignments, not events.
  function dataLayerArgs(args) {
    var entry = args[0];
    if (!entry || typeof entry !== 'object' || typeof entry.event !== 'string')
      return null;
    return entry.event;
  }

  // Wrap one vendor function: the vendor's own call runs FIRST and
  // unconditionally — the site's existing analytics is the behaviour being
  // preserved, and it must never depend on Kite succeeding.
  function mirrorWrap(original, source, extract) {
    if (typeof original !== 'function' || original[MIRROR_FLAG])
      return original;
    var wrapped = function () {
      var result = original.apply(this, arguments);
      try {
        var name = extract(arguments);
        if (name) mirrorCapture(source, name);
      } catch (e) {
        if (DEBUG && window.console)
          window.console.warn('[kite] mirror failed:', source, e);
      }
      return result;
    };
    try {
      wrapped[MIRROR_FLAG] = true;
    } catch (e) {
      /* a frozen function cannot be marked; wrapping still works */
    }
    return wrapped;
  }

  // Keep `owner[method]` wrapped across vendor lifecycle: stub libraries
  // replace their own methods in place once the real client loads, so a plain
  // one-shot wrap silently unhooks. An accessor keeps every later assignment
  // wrapped with no polling. Guarded throughout — `owner` is third-party, and
  // a non-configurable property must degrade to a best-effort direct wrap,
  // never take the SDK down (an unwrappable client mirrors nothing, and the
  // site's own analytics is untouched either way).
  function trapMethod(owner, method, source, extract) {
    var current = mirrorWrap(owner[method], source, extract);
    try {
      Object.defineProperty(owner, method, {
        configurable: true,
        enumerable: true,
        get: function () {
          return current;
        },
        set: function (value) {
          current = mirrorWrap(value, source, extract);
        },
      });
    } catch (e) {
      try {
        owner[method] = current;
      } catch (e2) {
        if (DEBUG && window.console)
          window.console.warn('[kite] cannot mirror', source, e2);
      }
    }
  }

  // Trap a window global so a client that ARRIVES after this SDK ran is
  // wrapped the moment the vendor assigns it — the async snippet-load case —
  // with `onValue` deciding what wrapping the arriving value needs.
  function trapGlobal(name, onValue) {
    var current = window[name];
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        enumerable: true,
        get: function () {
          return current;
        },
        set: function (value) {
          current = onValue(value);
        },
      });
      if (current !== undefined) current = onValue(current);
    } catch (e) {
      // Non-configurable global: wrap whatever is present now, best effort.
      if (current !== undefined) {
        try {
          window[name] = onValue(current);
        } catch (e2) {
          if (DEBUG && window.console)
            window.console.warn('[kite] cannot mirror via', name, e2);
        }
      }
    }
  }

  // How each DECLARED provider is intercepted, keyed by the DETECTOR's
  // provider names (the deploy env carries those names verbatim, so there is
  // no second vocabulary to drift). `posthog` never appears here: on a site
  // running its own PostHog that global is the customer's client, and Kite's
  // destination is a separate named instance — wrapping it would mirror
  // events into the project they already came from.
  var MIRROR_INSTALLERS = {
    mixpanel: function () {
      trapGlobal('mixpanel', function (client) {
        if (client && typeof client === 'object')
          trapMethod(client, 'track', 'mixpanel', trackArgs);
        return client;
      });
    },
    amplitude: function () {
      trapGlobal('amplitude', function (client) {
        if (client && typeof client === 'object')
          trapMethod(client, 'track', 'amplitude', trackArgs);
        return client;
      });
    },
    // Segment's analytics.js publishes `window.analytics` — a generic name,
    // which is exactly why only a DECLARED segment site ever reaches here.
    //
    // The snippet's STUB is skipped on purpose. Segment starts with
    // `window.analytics = window.analytics || []` and pushes each early call
    // onto that array; when analytics-next loads it replaces the global and
    // REPLAYS the queue through the real instance's own track(). Wrapping the
    // stub would mirror such a call twice — once when it queued, once when it
    // replayed — for one user action. MIRROR_FLAG cannot catch that: it
    // dedupes wrapped FUNCTIONS, not calls. Skipping the array means the
    // queued call is mirrored exactly once, on replay, by the real client.
    segment: function () {
      trapGlobal('analytics', function (client) {
        if (client && typeof client === 'object' && !Array.isArray(client))
          trapMethod(client, 'track', 'segment', trackArgs);
        return client;
      });
    },
    google_analytics: function () {
      trapGlobal('gtag', function (fn) {
        return mirrorWrap(fn, 'google_analytics', gtagArgs);
      });
    },
    google_tag_manager: function () {
      trapGlobal('dataLayer', function (queue) {
        // GTM replaces `push` on the SAME array when the container loads;
        // the method trap keeps that replacement wrapped too.
        if (queue && typeof queue.push === 'function')
          trapMethod(queue, 'push', 'google_tag_manager', dataLayerArgs);
        return queue;
      });
    },
  };

  function installMirrors() {
    var declared = env.mirrorProviders;
    if (!declared || !declared.length) return;
    for (var i = 0; i < declared.length; i++) {
      var install = MIRROR_INSTALLERS[declared[i]];
      if (!install) continue;
      try {
        install();
        if (DEBUG && window.console)
          window.console.log('[kite] mirroring', declared[i]);
      } catch (e) {
        if (DEBUG && window.console)
          window.console.warn('[kite] mirror install failed:', declared[i], e);
      }
    }
  }

  function start() {
    registerEnvelope(true);
    // Before the first emit: a vendor client already on the page must not fire
    // an event this SDK is not yet wrapping. Guarded twice over (here and per
    // installer): mirroring is optional, and a failure inside it must never
    // stop the core instrumentation below from installing.
    try {
      installMirrors();
    } catch (e) {
      if (DEBUG && window.console)
        window.console.warn('[kite] mirroring disabled', e);
    }
    emitPageViewed();
    observeSurfaces();
    observeItems();
    wireMedia();
    patchHistory();

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('invalid', onInvalid, true);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', function () {
      interactionCount++;
    });
    document.addEventListener('visibilitychange', function () {
      accumulateActive();
      if (document.visibilityState === 'hidden') emitPageEngagement();
    });
    window.addEventListener('pagehide', emitPageEngagement);
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
