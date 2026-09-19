# Design selection

Apply this procedure on the turn where the user names one of the returned
designs.

Create a dedicated follow-up task: a new task, not a comment on the finished
build task. State the exact design number the user chose, with running
`kite-websites select-design <website_id> <N>` as its first acceptance
criterion. The assignee runs that command because the conversational website
listing is read-only. Until the command runs, the website continues offering
its design options.

State the order in the task. `select-design` is the first command that changes
anything: it follows the `kite-websites list` lookup and comes before any
`clone`, build, or edit step. A selection-only task finishes there, with no
clone and no submit. Report the design as selected only after the follow-up
confirms the selection ran.

Build-out after selection is separate work. Include it when the user requested
it and leave it out otherwise.
