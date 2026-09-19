// @ts-nocheck — runs under Bun on the sandbox (node/Bun globals); no
// TypeScript toolchain in this repo compiles it.
//
// The OpenCode server is started at E2B template build time and lives in the
// snapshot every sandbox resumes from, so its process environment is the
// image's — it has never seen a turn, a thread, or a deployment. opencode runs
// every tool shell out of that process, so this hook is the ONLY path by which
// a turn's environment reaches the commands an agent launches: trace
// attribution, the short-lived capability token, the backend URL and internal
// token every skill and capability CLI calls with, and this turn's Slack reply
// destination. The runner publishes each with atomic renames before
// `opencode run --attach`, so no hook can read a partially-written value.
// Platform conversations are single-flight, making the newest values
// unambiguous.
import { readState, readStateBuffer } from "./lib/runtime-state";

// NUL-delimited KEY=VALUE, written by opencode_persistent_server.sh from the
// key list _warm_server.turn_env_keys derives. NUL rather than newline because
// values legitimately contain newlines.
function readTurnEnv(): Record<string, string> {
  const raw = readStateBuffer("turn-env");
  if (!raw) return {};
  const env: Record<string, string> = {};
  for (const entry of raw.toString("utf8").split("\0")) {
    if (!entry) continue;
    const split = entry.indexOf("=");
    if (split <= 0) continue;
    env[entry.slice(0, split)] = entry.slice(split + 1);
  }
  return env;
}

export const TurnContext = async () => {
  if (process.env["KITE_OPENCODE_REUSE_SERVER"] !== "1") return {};

  return {
    "shell.env": async (
      _input: unknown,
      output: { env: Record<string, string> }
    ) => {
      // Merged first so the explicit assignments below stay authoritative for
      // the values they own; a missing or unreadable file degrades to whatever
      // the server process has, never to a thrown hook.
      Object.assign(output.env, readTurnEnv());

      const messageID = readState("active-message-id");
      const sandboxToken = readState("sandbox-token");
      // An existing empty state file is an explicit clear for this turn, not a
      // request to inherit the persistent server's environment.
      if (messageID !== undefined) output.env.OR_TRACE_MESSAGE_ID = messageID;
      if (sandboxToken !== undefined)
        output.env.KITE_SANDBOX_TOKEN = sandboxToken;
      // kite-slack's own-reply redirect compares against these. Without the
      // per-turn refresh a warm turn would see the first turn's Slack target
      // (or none), and the redirect that stops a reply being hand-sent as well
      // as delivered would misfire on every follow-up turn (V2-6681). An empty
      // file clears the var, so a non-Slack turn's `-n` guard stays false.
      const replyChannel = readState("slack-reply-channel");
      const replyThreadTs = readState("slack-reply-thread-ts");
      const replyMessageTs = readState("slack-reply-message-ts");
      if (replyChannel !== undefined)
        output.env.KITE_SLACK_REPLY_CHANNEL = replyChannel;
      if (replyThreadTs !== undefined)
        output.env.KITE_SLACK_REPLY_THREAD_TS = replyThreadTs;
      if (replyMessageTs !== undefined)
        output.env.KITE_SLACK_REPLY_MESSAGE_TS = replyMessageTs;
    },
  };
};
