export function CreditsInfo() {
  return (
    <section className="bg-black px-5 py-16 sm:px-8">
      <div className="dark-card mx-auto max-w-7xl p-6 sm:p-8">
        <p className="kicker">Prize credits</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <h2 className="display-title text-4xl sm:text-5xl">Winnings stay as platform credits.</h2>
            <p className="body-copy mt-4 max-w-xl">When a tournament result is confirmed, any winnings are recorded as platform credits. Credits are maintained by the tournament desk, not in an automated player wallet.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[.03] p-5">
              <h3 className="text-base font-semibold text-white">Manual payout requests</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">When you need a withdrawal, contact the platform owner with your preferred payout details. Each request is checked and confirmed manually.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[.03] p-5">
              <h3 className="text-base font-semibold text-white">Choose your payout method</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">The platform owner can arrange a payout to your preferred EasyPaisa, JazzCash, or bank account when needed.</p>
            </div>
          </div>
        </div>
        <p className="mt-6 border-l border-[#d3ff24] pl-4 text-sm leading-6 text-white/70">This is a manual confirmation process. MasterGaming.pk does not provide an automated wallet, instant balance, or automatic withdrawal system.</p>
      </div>
    </section>
  );
}
