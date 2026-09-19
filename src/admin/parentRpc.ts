// Requester half of the postMessage RPC bridge from the embedded admin up to the
// platform content tab — the mirror of the platform's useIframeRpcResponder.
// SectionAutofill and SessionKeepalive both ask the parent for something and await
// a matching reply, so that plumbing (requestId, correlate the response, time out)
// lives here once. Message-type strings come from bridgeProtocol.ts.

function newRequestId(fallback: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : fallback;
}

// True when this document is running inside a cross-origin iframe (the
// platform content tab). Shared by every caller of `requestFromParent` that
// needs to gate on it (SessionKeepalive, the admin-login recovery page) — the
// bridge is only reachable when embedded, so posting to `window.parent` from a
// standalone tab would just time out.
export function isEmbedded(): boolean {
  try {
    return Boolean(window.parent) && window.parent !== window;
  } catch {
    // Cross-origin parent access throws — which only happens when embedded.
    return true;
  }
}

export type ParentReply = { error?: boolean } & Record<string, unknown>;

// Posts a request to the parent window and resolves with the reply whose
// `requestId` matches, or `null` if the parent doesn't answer within `timeoutMs`
// (platform error, content tab navigated away, dropped message). Each call owns
// its own listener and timer, so concurrent requests stay independent.
export function requestFromParent(
  requestType: string,
  responseType: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<ParentReply | null> {
  return new Promise((resolve) => {
    const requestId = newRequestId(
      `${requestType}-${Date.now()}-${Math.random()}`,
    );
    let settled = false;
    const finish = (value: ParentReply | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
      resolve(value);
    };
    const onMessage = (event: MessageEvent) => {
      const d = event.data;
      if (
        !d ||
        typeof d !== 'object' ||
        d.type !== responseType ||
        d.requestId !== requestId
      )
        return;
      finish(d as ParentReply);
    };
    window.addEventListener('message', onMessage);
    const timer = window.setTimeout(() => finish(null), timeoutMs);
    window.parent.postMessage(
      { type: requestType, requestId, ...payload },
      '*',
    );
  });
}
