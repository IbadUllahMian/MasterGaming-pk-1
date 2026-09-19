# Reconnect an existing account

Replacing a connection is destructive. If the user did not explicitly ask to
reconnect, re-authorize, or replace it, explain that the team's current account
connection will be removed and ask for confirmation; stop until they confirm.

After explicit confirmation, run `kite-integrations reconnect <name_slug>` with
the exact connector slug. The command prepares a durable reconnect CTA; it does
not disconnect anything while composing the reply. Opening the CTA starts fresh
authorization while keeping the current account available. After the provider
confirms one healthy new account, Kite removes only the account id that was
current when the link was prepared. Cancelling or failing authorization keeps
the current account. A cleanup failure keeps both accounts, does not resume
agent work, and sends the user to Integrations.

Each CTA authorizes one replacement. A second click while the first is in
flight, or any click after the connection was replaced, is refused. Finish or
cancel an active authorization. If its browser flow was abandoned or closed,
wait for the short safety window to expire before trying again; close any old
provider page, and do not complete the old link after starting a new flow. A
fresh link is also refused while that claim remains.

Tell the user what clicking will do, emit the CTA using SKILL.md's connect-CTA
grammar, and end the turn. GitHub and team-wide CMS write connections may send
the user to Integrations so their first-party or site-impact safeguards remain
in charge. `reconnect_cleanup_required` also sends the user there to choose and
remove legacy duplicate accounts; never turn that result into a normal connect
CTA.
