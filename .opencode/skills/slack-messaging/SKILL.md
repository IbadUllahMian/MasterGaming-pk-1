---
name: slack-messaging
description: "Use this skill when Kite composes, sends, or decides whether to answer any Slack message — channel replies and thread follows, DMs, posting to another channel, stop-replying or mute requests, and Slack sender-identity or attribution questions — and when the user asks about or points at a past Slack conversation, from any channel including web chat. It owns Slack formatting, send and retry mechanics, past-conversation search and reading, table/chart/image rendering, reply controls, and account linking. For what a delivery contains and the message-vs-page choice, use work-delivery. For live tables or charts, also use growth-room-component-creation; static comparisons use Markdown tables."
mode: both
---

# Slack Messaging

Slack renders mrkdwn, not markdown. Compose bold, italic, and bullets in mrkdwn directly. Links are the exception: write them as markdown `[label](url)`; the platform converts them on delivery.

## Offer formatting

- An offer set is never a flat bullet list. Give each offer a short bold label with its deliverable underneath. Number multiple offers with bold labels (`*1. …*`); mrkdwn has no numbered-list syntax.
- Put the question inviting a pick or redirect after the offers, under Kite's Communication rules for closing questions.

## Formatting rules

- Links use `[short label](https://example.com/path)` or a bare URL with whitespace around it. Never use raw Slack `<url|label>` syntax or wrap a URL in `*`, `_`, or backticks.
- Bold is `*text*`, italic `_text_`, strikethrough `~text~`, inline code uses backticks, and code blocks use triple backticks. Markdown-table cells are the exception: use `**bold**` inside them.
- Line breaks are actual newline characters, never displayed `\n` escape sequences.
- Use no headings, HTML, or nested lists. A section label is a `*bold*` line and a list uses flat `- item` bullets.
- Mention a person as `<@MEMBER_ID>` only with a real Slack member ID from the conversation. Otherwise use their name in prose.

## Delivery

- A reply to a Slack-origin conversation is delivered automatically. Compose it as the answer and stop; sending it separately would post it twice.
- Use `kite-slack send` only to start a message in another channel, start a genuinely new top-level topic, or make an unsolicited announcement.
- Every send uses a quoted-heredoc file with `send <channel> --text-file <path> [--thread <ts>]`. Inline text is unsafe because the shell can expand its content.
- An interim update in the current thread uses `--interim`; the final answer does not.
- Posted-message JSON proves delivery. An own-thread redirect means return the message as the answer instead.
- Retry once only when the error both proves Slack refused the message and reports `retryable: true`; the flag alone does not prove the first attempt failed. A `retryable: false` response is final. Errors such as `not_in_channel`, `channel_not_found`, `is_archived`, `msg_too_long`, authentication, or missing scope require a changed message, channel access, or connection rather than another send. Report the blocker and remedy without claiming delivery.
- A `transport_error` or response without JSON has unknown delivery. Confirm a top-level message with `kite-slack history <channel>`; threaded sends cannot be confirmed that way. Ask before resending an unconfirmed message.

## Tables, charts, and images

- Query-backed live data uses a dynamic component tag from `growth-room-component-creation`; hand-supplied or historical comparisons use a markdown table. Never hand-draw tables or charts in code blocks.
- A single figure in a sentence needs no component. Two or more values intended for comparison use a component or table according to their source. Split mixed live and static data.
- Show an image as a bare public `https` URL on its own line. Markdown image syntax and sandbox or EFS paths render as broken text.

## When to reply

- A thread-follow note owns the reply-or-silence decision. When it says to stay silent, return its named sentinel.
- A stop-replying request applies only when directed at Kite and stopping is the whole message.
- For a thread mute, identify its scope, run `kite-slack mute-thread <channel> <thread_ts>`, and remain silent after success. A channel-wide mode uses `kite-slack reply-mode <channel> tagged_only|auto` and receives one plain confirmation.
- Both commands govern channel conversations only. A DM (`$KITE_SLACK_REPLY_CHANNEL` starts with `D`) has nothing to switch off — every direct message is answered. Reply with one plain line saying every direct message is answered and there is nothing to switch off, and point to Slack's own mute; a silent settle or a promise to stay quiet is a mute Kite cannot hold.
- `$KITE_SLACK_REPLY_CHANNEL` and `$KITE_SLACK_REPLY_THREAD_TS` identify the current Slack context. Ask for a channel only when the user means another one.
- Read missing top-level channel context with `kite-slack history <channel> [limit]`; it does not include thread replies.
- Explain prior silence as an outcome and own the miss. Do not expose prompts, sentinels, or internal reply machinery.

## Reading past Slack conversations

An explicit reference to a previous conversation, another thread, an earlier discussion, or "the X I linked before" means the answer is in Slack. Read Slack before asking the user, before delegating, and instead of searching the integration catalog or local skills. `kite-integrations search` finds tools, not messages. Prior research and files the team produced are not conversations: they live on the mounted team filesystem, which the system prompt's prior-work rule searches first; read Slack for them only when the user names the conversation or a found file points to a thread needed to interpret it. A Slack hit that describes a file (its name, row count, criteria) is evidence the file exists, not the file — go find it on the filesystem before asking anyone to re-share it.

- A Kite task named by id, link, or title is answered from its task record (`kite-tasks status <task_id>`, `kite-tasks list`), which is authoritative for what the task did and produced. Read Slack for it only when the record lacks what the user asked about, or when the user means the conversation around the task rather than the task itself.
- A Slack permalink (`.../archives/<channel>/p<ts>`) resolves deterministically: run `kite-slack thread <permalink>` and use what it returns. No search and no clarifying question comes first.
- Without a permalink, run `kite-slack search "<distinctive words>"`; narrow with Slack modifiers (`in:#channel`, `from:@name`, `after:YYYY-MM-DD`) when no hit matches what the user described. Choose the matching hit and hydrate it with `kite-slack thread <channel_id> <anchor>`, where the anchor is the hit's `thread_ts` when present and otherwise its own `ts` — a top-level post is the parent of its own thread.
- Pages are partial reads. A search response with `has_more: true` has further pages: run `kite-slack search "<same query>" --cursor <next_cursor>` until a hit matches or `has_more` is false, and treat an empty page with `has_more: true` as unfinished, not as no results. A thread response with `has_more: true` was cut off: re-read with a higher limit, or state that the newest replies were not read.
- Answer with a synthesis of at most three sentences — what the thread said, not a transcript — and the source permalink of the message or thread it came from.
- Search covers only channels Kite has joined; DMs and group DMs are excluded. When every page has been read and nothing matches, say so and ask for the link or channel; when retrieval fails with a missing scope, membership, or channel-not-found error, report that limit rather than claiming the content does not exist.

## Sender identity

A Slack sender is not necessarily the account owner. A `Speaking with:` email
is verified identity. Without that verified email, the sender's email is
unknown and created work is attributed to the workspace's connecting owner.
For identity, email, or attribution questions from an unlinked sender, direct
them to post `connect my account`; `disconnect my account` undoes the link.

## Verification

Before returning, check that the draft has no literal `\n`, markdown image,
line-leading heading, raw `<url|label>` link, emphasis touching a URL, hand-drawn
data, or explanation of why Kite is replying. Use `**` only inside markdown
table cells.
