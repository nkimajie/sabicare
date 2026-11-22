"use client";

// Safety test dashboard: runs every test case through the REAL pipeline
// (phone phrase list, then AI, then the rules engine) and counts missed danger signs.
import { useState } from "react";
import Link from "next/link";
import { triage, type Level, type Mode } from "@/lib/rules";
import { TEST_CASES } from "@/lib/testcases";
import { extract } from "@/lib/pipeline";
import { Logo } from "@/components/ui";

const RANK: Record<Level, number> = { GREEN: 0, AMBER: 1, RED: 2 };
const CHIP: Record<Level, string> = { RED: "bg-danger-700 text-white", AMBER: "bg-sun-400 text-[#1f1300]", GREEN: "bg-leaf-700 text-white" };
const STAGE: Record<Mode, string> = { pregnant: "🤰", postpartum: "🤱", newborn: "👶" };

interface Row { got: Level; source: string }

export default function Tests() {
  const [rows, setRows] = useState<(Row | null)[]>([]);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    const out: (Row | null)[] = TEST_CASES.map(() => null);
    setRows([...out]);
    for (let i = 0; i < TEST_CASES.length; i++) {
      const c = TEST_CASES[i];
      const d = await extract(c.text, c.mode);
      const got = triage({ mode: c.mode, symptoms: d.evidence.map((e) => e.symptom), uncertain: d.uncertain, motherAge: d.motherAge }).level;
      const source = d.source;
      out[i] = { got, source };
      setRows([...out]);
    }
    setRunning(false);
  }

  const done = rows.filter(Boolean) as Row[];
  const missed = rows.filter((r, i) => r && RANK[r.got] < RANK[TEST_CASES[i].expected]).length;
  const over = rows.filter((r, i) => r && RANK[r.got] > RANK[TEST_CASES[i].expected]).length;
  const exact = done.length - missed - over;
  const usedAi = done.some((r) => r.source === "ai");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 text-ink sm:py-10">
      <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/90 px-4 font-extrabold text-brand-700 shadow-soft ring-1 ring-cream-300 transition hover:ring-brand-300">
        <span aria-hidden>←</span> Back to SabiCare
      </Link>

      <header className="mt-5 flex items-center gap-4">
        <Logo className="h-14 w-14" />
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-brand-700">SabiCare · Mama &amp; Pikin</p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Safety tests</h1>
        </div>
      </header>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-cream-300">
        <p className="text-base leading-relaxed text-ink-soft sm:text-lg">
          {TEST_CASES.length} messages in English and Pidgin, including denials like “no bleeding”. Each one goes through the same
          pipeline as the app. A <strong className="text-ink">missed danger sign</strong> means the app showed a less urgent colour than it should.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button onClick={run} disabled={running}
            className="inline-flex min-h-14 items-center gap-2.5 rounded-2xl bg-brand-600 px-6 text-lg font-black text-white shadow-brand transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-80">
            {running ? <span className="h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white motion-safe:animate-spin" aria-hidden /> : <span aria-hidden>🧪</span>}
            {running ? `Running… ${done.length}/${TEST_CASES.length}` : "Run all tests"}
          </button>
          {done.length > 0 && (
            <div className="min-w-40 flex-1" aria-hidden>
              <div className="h-3 overflow-hidden rounded-full bg-cream-200">
                <div className="h-full rounded-full bg-brand-600 transition-[width] duration-300" style={{ width: `${(done.length / TEST_CASES.length) * 100}%` }} />
              </div>
              <p className="mt-1 text-sm font-bold text-ink-muted">{done.length} of {TEST_CASES.length} done</p>
            </div>
          )}
        </div>
      </section>

      {done.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 text-center" aria-live="polite">
          <div className={`rounded-3xl p-4 shadow-soft ${missed ? "bg-danger-700 text-white" : "bg-leaf-700 text-white"}`}>
            <p className="text-4xl font-black">{missed}</p><p className="mt-1 text-sm font-bold leading-tight">Missed danger signs</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-cream-300"><p className="text-4xl font-black">{exact}</p><p className="mt-1 text-sm font-bold leading-tight text-ink-soft">Exactly right</p></div>
          <div className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-cream-300"><p className="text-4xl font-black">{over}</p><p className="mt-1 text-sm font-bold leading-tight text-ink-soft">Over-cautious</p></div>
        </div>
      )}
      {done.length > 0 && (
        <p className="mt-3 text-sm font-semibold text-ink-muted">Symptom extraction used: {usedAi ? "AI + phrase list" : "phrase list only (no AI key set)"}.</p>
      )}

      <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-cream-300">
        <table className="w-full text-left text-sm sm:text-base">
          <thead className="bg-cream-50 text-xs font-black uppercase tracking-wider text-ink-muted">
            <tr className="border-b border-cream-300">
              <th className="py-3 pl-4 pr-2">Message</th>
              <th className="hidden px-2 sm:table-cell">Stage</th>
              <th className="px-1">Min.</th>
              <th className="px-1">Got</th>
              <th className="pl-1 pr-4"><span className="sr-only">Result</span></th>
            </tr>
          </thead>
          <tbody>
            {TEST_CASES.map((c, i) => {
              const r = rows[i];
              const bad = r && RANK[r.got] < RANK[c.expected];
              return (
                <tr key={i} className={`border-b border-cream-200 last:border-0 ${bad ? "bg-[#fdecea]" : "even:bg-cream-50/60"}`}>
                  <td className="py-2.5 pl-4 pr-2 font-semibold">
                    {c.text}
                    <span className="mt-0.5 block text-xs font-bold text-ink-muted sm:hidden"><span aria-hidden>{STAGE[c.mode]}</span> {c.mode}</span>
                  </td>
                  <td className="hidden whitespace-nowrap px-2 text-ink-soft sm:table-cell"><span aria-hidden>{STAGE[c.mode]}</span> {c.mode}</td>
                  <td className="px-1"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-black ${CHIP[c.expected]}`}>{c.expected}</span></td>
                  <td className="px-1">{r ? <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-black ${CHIP[r.got]}`}>{r.got}</span> : <span className="text-ink-muted">…</span>}</td>
                  <td className="whitespace-nowrap pl-1 pr-4 font-bold">
                    {r ? (bad
                      ? <>❌<span className="sr-only sm:not-sr-only"> missed</span></>
                      : RANK[r.got] > RANK[c.expected] ? <>⚠️<span className="sr-only sm:not-sr-only"> cautious</span></> : "✅") : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
