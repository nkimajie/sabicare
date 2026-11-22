"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SYMPTOMS, triage, followUp, nextAncWeek, type Level, type Mode, type SymptomId, type TriageResult } from "@/lib/rules";
import type { Evidence } from "@/lib/keywords";
import { extract } from "@/lib/pipeline";
import { usePlan } from "@/lib/usePlan";
import { T, LEVEL_TEXT, MODE_TEXT, SYMPTOM_PCM, ACTION_PCM, type Lang } from "@/lib/text";
import {
  Logo, TickBadge, Ring, Step, CheckIcon, CrossIcon, ArrowIcon, MicIcon, SpeakerIcon, GlobeIcon,
  LockIcon, PhoneIcon, ChatIcon, HeartPulseIcon, ClipboardIcon, InfoIcon, ShieldIcon,
} from "@/components/ui";

function ageOf(raw: string): number | null {
  const n = parseInt(raw, 10);
  return n >= 10 && n <= 60 ? n : null;
}
const MODES: Mode[] = ["pregnant", "postpartum", "newborn"];

// Each result has its own colour, icon and words, so colour is never the only signal.
const LOOK: Record<Level, { banner: string; icon: string; chip: string; body: string }> = {
  RED: { banner: "bg-linear-to-b from-danger-600 to-danger-800 text-white", icon: "🚨", chip: "bg-white text-danger-700", body: "text-white" },
  AMBER: { banner: "bg-sun-400 text-[#1f1300]", icon: "⚠️", chip: "bg-[#1f1300] text-sun-300", body: "text-[#3d2a00]" },
  GREEN: { banner: "bg-leaf-100 text-leaf-900", icon: "✅", chip: "bg-leaf-700 text-white", body: "text-[#1e4630]" },
};

// Soft pastel circles behind the symptom pictures.
const TINTS = ["bg-tint-peach", "bg-tint-sky", "bg-tint-butter", "bg-tint-lilac", "bg-tint-mint", "bg-tint-blush"];

// Remembers that the welcome screen has been answered, so it never shows again.
const WELCOME_KEY = "sabicare-welcomed";

// Shared input look: big, rounded, clear focus.
const INPUT = "mt-1.5 block min-h-13 w-full rounded-xl border-2 border-cream-300 bg-cream-50 px-3.5 py-3 text-base text-ink shadow-inner shadow-cream-200/60 transition placeholder:text-ink-muted focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100";

function weeksPregnant(dueDate: string): number | null {
  if (!dueDate) return null;
  const days = (new Date(dueDate).getTime() - Date.now()) / 86400000;
  const w = Math.round(40 - days / 7);
  return w >= 1 && w <= 44 ? w : null;
}

/** Nigerian local numbers (0801…) become international (234801…) for WhatsApp. */
function intlPhone(raw: string) {
  const d = raw.replace(/[^0-9]/g, "");
  return d.startsWith("0") ? "234" + d.slice(1) : d;
}

type Pending = { ev: Evidence[]; uncertain: boolean; motherAge: number | null };

/** Splits "🤰 I am pregnant" into its picture and its words. */
function splitEmoji(s: string) {
  const i = s.indexOf(" ");
  return { emoji: s.slice(0, i), words: s.slice(i + 1) };
}

export default function App() {
  // Login is optional. The page works at once as a guest; this just checks who is signed in.
  const [me, setMe] = useState<{ loginEnabled: boolean; user: string | null; loaded: boolean; cloud: boolean }>({ loginEnabled: false, user: null, loaded: false, cloud: false });
  // First-visit welcome. Only decided after /api/me answers, and skipped if she has already started using the page.
  const [welcome, setWelcome] = useState(false);
  const touched = useRef(false);
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d: { loginEnabled?: boolean; user?: string | null; cloud?: boolean }) => {
      setMe({ loginEnabled: !!d.loginEnabled, user: d.user ?? null, loaded: true, cloud: !!d.cloud });
      let seen = true;
      try { seen = localStorage.getItem(WELCOME_KEY) !== null; } catch {}
      if (d.loginEnabled && !d.user && !seen && !touched.current) setWelcome(true);
    }).catch(() => setMe({ loginEnabled: false, user: null, loaded: true, cloud: false })); // no answer: treat login as off
  }, []);
  const { user, loginEnabled } = me;
  // Guest: plan stays on this phone. Signed in: saved encrypted in the database (see lib/usePlan.ts).
  const { plan, savePlan, clearData, status: saveStatus, remote } = usePlan(user, me.cloud);
  const [lang, setLang] = useState<Lang>("en");
  const [tab, setTab] = useState<"check" | "plan">("check");
  const [mode, setMode] = useState<Mode>("pregnant");
  const [picked, setPicked] = useState<SymptomId[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null); // waiting for a follow-up answer
  const [result, setResult] = useState<TriageResult | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const t = T[lang];
  const name = (id: SymptomId) => (lang === "pcm" ? SYMPTOM_PCM[id] : SYMPTOMS[id].label);

  // Move screen-reader and keyboard focus to the result as soon as it shows.
  useEffect(() => { if (result) heading.current?.focus(); }, [result]);

  function toggle(id: SymptomId) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  // Voice typing with the browser's speech recognition, where the browser has it.
  function dictate() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return setError("Voice typing is not supported in this browser. Please type instead.");
    const rec = new SR();
    rec.lang = "en-NG";
    rec.onresult = (e: { results: { 0: { transcript: string } }[] }) => setText((x) => (x + " " + e.results[0][0].transcript).trim());
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  function speak(r: TriageResult) {
    const msg = LEVEL_TEXT[r.level][lang];
    const u = new SpeechSynthesisUtterance(`${msg.title}. ${msg.body}`);
    u.lang = "en-NG";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function finish(p: Pending) {
    setPending(null);
    setEvidence(p.ev);
    // Age from her profile or from her words: use the younger one, so the under-18 warning is never missed.
    const ages = [p.motherAge, ageOf(plan.age)].filter((n): n is number => n != null);
    const motherAge = ages.length ? Math.min(...ages) : null;
    setResult(triage({ mode, symptoms: p.ev.map((e) => e.symptom), uncertain: p.uncertain, motherAge }));
    window.scrollTo(0, 0);
  }

  async function check() {
    setError("");
    if (picked.length === 0 && !text.trim()) return setError(t.none);
    setBusy(true);
    let ev: Evidence[] = picked.map((s) => ({ symptom: s, phrase: name(s) }));
    let uncertain = false;
    let motherAge: number | null = null;
    const add = (more: Evidence[]) => {
      const have = new Set(ev.map((e) => e.symptom));
      ev = [...ev, ...more.filter((e) => !have.has(e.symptom))];
    };
    if (text.trim()) {
      const found = await extract(text, mode); // phone phrase list first, then AI
      add(found.evidence);
      uncertain = found.uncertain;
      motherAge = found.motherAge;
    }
    setBusy(false);
    const p = { ev, uncertain, motherAge };
    // The rules decide whether one more answer could make this more urgent.
    if (followUp(mode, ev.map((e) => e.symptom))) setPending(p);
    else finish(p);
  }

  function answer(yes: boolean) {
    if (!pending) return;
    const f = followUp(mode, pending.ev.map((e) => e.symptom));
    const ev = yes && f ? [...pending.ev, { symptom: f.ask, phrase: name(f.ask) }] : pending.ev;
    finish({ ...pending, ev });
  }

  function reset() {
    setResult(null); setPending(null); setPicked([]); setText(""); setEvidence([]);
    window.speechSynthesis?.cancel();
  }

  function alertText(r: TriageResult) {
    const weeks = weeksPregnant(plan.dueDate);
    // Don't list "Headache" next to "Severe headache" (same for belly pain).
    const have = new Set(evidence.map((e) => e.symptom));
    const signs = evidence
      .filter((e) => !(e.symptom === "headache" && have.has("severe_headache")) && !(e.symptom === "abdominal_pain" && have.has("severe_abdominal_pain")))
      .map((e) => SYMPTOMS[e.symptom].label).join(", ");
    const about = mode === "newborn" ? "My newborn baby needs help." : mode === "postpartum" ? "I gave birth recently." : weeks ? `I am ${weeks} weeks pregnant.` : "I am pregnant.";
    const age = ageOf(plan.age);
    return [
      r.level === "RED" ? "🚨 EMERGENCY - I need help NOW" : "⚠️ I need to see a health worker today",
      plan.name && `From: ${plan.name}${age ? `, age ${age}` : ""}.`,
      about,
      `Signs: ${signs}.`,
      plan.facility && `Take me to: ${plan.facility}.`,
      plan.driver && `Driver: ${plan.driver} ${plan.driverPhone}.`,
      plan.donors && `Blood donors: ${plan.donors}.`,
      "Sent with SabiCare",
    ].filter(Boolean).join("\n");
  }

  // Welcome choice: guests go straight to the check screen; either choice is remembered.
  function rememberWelcome() {
    try { localStorage.setItem(WELCOME_KEY, "1"); } catch {}
  }
  function continueAsGuest() {
    rememberWelcome();
    setWelcome(false);
    window.scrollTo(0, 0);
  }

  const week = weeksPregnant(plan.dueDate);
  const readiness = [plan.facility, plan.driverPhone, plan.donors, plan.familyPhone, plan.money].filter(Boolean).length;
  const question = pending && followUp(mode, pending.ev.map((e) => e.symptom));
  const showWelcome = welcome && me.loaded && loginEnabled && !user && !result && !question;
  const home = !result && !question && !showWelcome;

  // One birth-plan text field (label from lib/text.ts, so it shows in English or Pidgin).
  type Field = "dueDate" | "facility" | "driver" | "driverPhone" | "donors" | "familyPhone";
  const READY: Field[] = ["facility", "driverPhone", "donors", "familyPhone"];
  const field = (key: Field, type: "date" | "text" | "tel", emoji: string) => (
    <label key={key} className="block">
      <span className="flex items-center gap-2 text-base font-bold text-ink">
        <span aria-hidden>{emoji}</span>
        <span className="flex-1">{t[key]}</span>
        {READY.includes(key) && plan[key] && (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-leaf-600 text-white motion-safe:animate-pop" aria-hidden><CheckIcon className="h-3.5 w-3.5" /></span>
        )}
      </span>
      <input type={type} value={plan[key]} onChange={(e) => savePlan({ ...plan, [key]: e.target.value })} className={INPUT} />
    </label>
  );

  return (
    <main
      lang={lang === "en" ? "en" : "pcm"}
      onPointerDownCapture={() => { touched.current = true; }}
      onKeyDownCapture={() => { touched.current = true; }}
      className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-cream-100 text-ink md:my-6 md:min-h-[calc(100dvh-3rem)] md:overflow-clip md:rounded-[2.25rem] md:shadow-[0_40px_90px_-30px_rgb(74_32_42/0.45)] md:ring-1 md:ring-black/5"
    >
      {/* Wide screens only: a short intro beside the phone-width app */}
      <aside className="fixed right-[calc(50%+16.5rem)] top-1/2 hidden w-72 -translate-y-1/2 xl:block">
        <Logo className="h-16 w-16" />
        <p className="mt-5 text-4xl font-black leading-tight tracking-tight text-ink">{t.tagline}</p>
        <p className="mt-3 text-lg font-semibold text-ink-soft">{t.welcomeBody}</p>
        <ul className="mt-6 space-y-2.5">
          {([["🖐🏾", t.feat1], ["🚦", t.feat2], ["💬", t.feat3]] as const).map(([e, s]) => (
            <li key={s} className="flex items-center gap-3 rounded-2xl bg-white/80 p-2.5 font-bold shadow-soft backdrop-blur">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream-100 text-xl" aria-hidden>{e}</span>
              {s}
            </li>
          ))}
        </ul>
      </aside>

      <aside className="fixed left-[calc(50%+16.5rem)] top-1/2 hidden w-72 -translate-y-1/2 space-y-3 xl:block">
        {(["RED", "AMBER", "GREEN"] as const).map((lv) => (
          <div key={lv} className="flex items-center gap-3 rounded-2xl bg-white/85 p-3 shadow-soft backdrop-blur">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl ${LOOK[lv].banner}`} aria-hidden>{LOOK[lv].icon}</span>
            <div className="min-w-0">
              <p className={`inline-block rounded-full px-2 py-0.5 text-xs font-black tracking-widest ${lv === "RED" ? "bg-danger-700 text-white" : LOOK[lv].chip}`}>{lv}</p>
              <p className="mt-1 text-sm font-extrabold leading-snug">{LEVEL_TEXT[lv][lang].title}</p>
            </div>
          </div>
        ))}
      </aside>

      {/* Header: logo, name and language switch */}
      <header className="bg-cream-50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Logo />
          <h1 className="min-w-0 flex-1 leading-none">
            <span className="block text-[1.4rem] font-black tracking-tight text-ink">SabiCare</span>
            <span className="sr-only"> · </span>
            <span className="mt-1 block text-sm font-extrabold text-brand-700">Mama &amp; Pikin</span>
          </h1>
          <button onClick={() => setLang(lang === "en" ? "pcm" : "en")}
            className="inline-flex min-h-12 items-center gap-1.5 rounded-full border-2 border-cream-300 bg-white px-4 text-base font-extrabold text-ink shadow-soft transition hover:border-brand-300 active:scale-95">
            <GlobeIcon className="h-5 w-5 text-brand-600" />
            {lang === "en" ? "Pidgin" : "English"}
          </button>
        </div>
        <div className="naija-band" aria-hidden />
      </header>

      {/* Welcome: first visit only, when login is on and nobody is signed in */}
      {showWelcome && (
        <section aria-labelledby="welcome-title" className="flex flex-1 flex-col px-5 pb-4 pt-5 motion-safe:animate-rise">
          <div className="relative mx-auto h-36 w-60" aria-hidden>
            <div className="absolute inset-x-6 inset-y-0 rounded-full bg-linear-to-br from-brand-100 via-brand-50 to-sun-100" />
            <span className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-6xl shadow-lift">🤰🏾</span>
            <span className="absolute left-0 top-3 grid h-16 w-16 place-items-center rounded-full bg-tint-mint text-4xl shadow-soft motion-safe:animate-float">🤱🏾</span>
            <span className="absolute bottom-1 right-0 grid h-16 w-16 place-items-center rounded-full bg-tint-butter text-4xl shadow-soft motion-safe:animate-float [animation-delay:1.2s]">👶🏾</span>
            <span className="absolute right-6 top-0 text-2xl">💗</span>
          </div>
          <h2 id="welcome-title" className="mt-4 text-center text-[1.9rem] font-black leading-tight">{t.welcomeTitle}</h2>
          <p className="mt-2 text-center text-lg font-semibold text-ink-soft">{t.welcomeBody}</p>

          <div className="mt-6 space-y-3">
            <button onClick={continueAsGuest}
              className="group flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-brand-600 px-5 text-xl font-black text-white shadow-brand transition hover:bg-brand-700 active:scale-[0.98]">
              {t.guest}
              <ArrowIcon className="h-6 w-6 transition-transform motion-safe:group-hover:translate-x-1" />
            </button>
            <Link prefetch={false} href="/api/auth/signin" onClick={rememberWelcome}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-200 bg-white px-5 text-center text-lg font-extrabold text-brand-700 transition hover:border-brand-400 active:scale-[0.98]">
              <LockIcon className="h-5 w-5 shrink-0" />
              {t.signInSave}
            </Link>
          </div>
          <p className="mt-4 flex gap-2.5 rounded-2xl bg-cream-50 p-3.5 text-sm font-semibold leading-relaxed text-ink-soft ring-1 ring-cream-300">
            <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-leaf-700" />
            {t.welcomePrivacy}
          </p>

          <ul className="mt-5 space-y-2.5 xl:hidden">
            {([["🖐🏾", t.feat1, "bg-tint-peach"], ["🚦", t.feat2, "bg-tint-sky"], ["💬", t.feat3, "bg-tint-mint"]] as const).map(([e, s, bg]) => (
              <li key={s} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 font-bold shadow-soft">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl ${bg}`} aria-hidden>{e}</span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* One follow-up question, chosen by the rules */}
      {question && (
        <section className="flex flex-1 flex-col items-center px-5 pb-8 pt-10 text-center motion-safe:animate-rise">
          <span className="grid h-24 w-24 place-items-center rounded-full bg-white text-5xl shadow-lift ring-8 ring-brand-50" aria-hidden>🩺</span>
          <p className="mt-6 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-black uppercase tracking-wider text-brand-800">{t.oneMore}</p>
          <h2 className="mt-4 text-[1.7rem] font-black leading-snug">{question[lang]}</h2>
          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            <button onClick={() => answer(true)}
              className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-3xl bg-brand-600 text-2xl font-black text-white shadow-brand transition hover:bg-brand-700 active:scale-95">
              <CheckIcon className="h-8 w-8" />{t.yes}
            </button>
            <button onClick={() => answer(false)}
              className="flex min-h-24 flex-col items-center justify-center gap-1 rounded-3xl border-2 border-cream-300 bg-white text-2xl font-black text-ink shadow-soft transition hover:border-ink-muted active:scale-95">
              <CrossIcon className="h-8 w-8 text-ink-soft" />{t.no}
            </button>
          </div>
        </section>
      )}

      {/* Result: RED, AMBER or GREEN, with actions first, then the reasons */}
      {result && (
        <section className="flex-1 pb-4">
          <div className={`${LOOK[result.level].banner} px-5 pb-12 pt-8 text-center`}>
            <div className="relative mx-auto grid h-24 w-24 place-items-center" aria-hidden>
              {result.level === "RED" && <span className="absolute inset-0 rounded-full bg-white/50 motion-safe:animate-ping-soft" />}
              <span className="relative grid h-24 w-24 place-items-center rounded-full bg-white text-5xl shadow-lift motion-safe:animate-pop">{LOOK[result.level].icon}</span>
            </div>
            <p className={`mt-4 inline-block rounded-full px-3.5 py-1 text-sm font-black tracking-[0.2em] ${LOOK[result.level].chip}`}>{result.level}</p>
            <h2 ref={heading} tabIndex={-1} className="mt-3 text-[2rem] font-black leading-[1.1] outline-none">{LEVEL_TEXT[result.level][lang].title}</h2>
            <p className={`mt-3 text-lg font-bold ${LOOK[result.level].body}`}>{LEVEL_TEXT[result.level][lang].body}</p>
          </div>

          <div className="relative -mt-6 space-y-3 rounded-t-[1.75rem] bg-cream-100 px-4 pt-5 motion-safe:animate-rise">
            {result.level !== "GREEN" && (
              <>
                <a href={`https://wa.me/${intlPhone(plan.familyPhone)}?text=${encodeURIComponent(alertText(result))}`} target="_blank" rel="noreferrer"
                   className="flex min-h-16 items-center gap-3 rounded-2xl bg-leaf-700 px-4 text-lg font-black text-white shadow-lift transition hover:bg-leaf-900 active:scale-[0.98]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20 text-xl" aria-hidden>💬</span>
                  <span className="flex-1">{t.alarm}</span>
                  <ArrowIcon className="h-6 w-6 shrink-0" />
                </a>
                {result.level === "RED" && (
                  <a href="tel:112" className="flex min-h-16 items-center gap-3 rounded-2xl bg-danger-700 px-4 text-lg font-black text-white shadow-lift transition hover:bg-danger-800 active:scale-[0.98]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/20" aria-hidden><PhoneIcon className="h-5 w-5" /></span>
                    <span className="flex-1">{t.call}</span>
                    <ArrowIcon className="h-6 w-6 shrink-0" />
                  </a>
                )}
                <a href={`sms:${plan.familyPhone}?body=${encodeURIComponent(alertText(result))}`}
                   className="flex min-h-13 items-center justify-center gap-2 rounded-2xl border-2 border-cream-300 bg-white px-4 font-extrabold text-ink transition hover:border-ink-muted">
                  <ChatIcon className="h-5 w-5 text-ink-soft" />
                  {t.sms}
                </a>
                {plan.facility && (
                  <div className="rounded-2xl bg-white p-3.5 text-base shadow-soft ring-1 ring-cream-200">
                    <p className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tint-sky text-xl" aria-hidden>🏥</span>
                      <strong className="min-w-0 flex-1">{plan.facility}</strong>
                    </p>
                    {plan.driverPhone && (
                      <p className="mt-2 flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-tint-butter text-xl" aria-hidden>🚗</span>
                        <a className="inline-flex min-h-12 min-w-0 flex-1 items-center gap-1.5 font-extrabold text-brand-700" href={`tel:${plan.driverPhone}`}>
                          <span className="underline decoration-2 underline-offset-4">{plan.driver || plan.driverPhone}</span>
                          <PhoneIcon className="h-4 w-4 shrink-0" />
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <button onClick={() => speak(result)}
              className="flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl border-2 border-cream-300 bg-white font-extrabold text-ink transition hover:border-ink-muted active:scale-[0.98]">
              <SpeakerIcon className="h-5 w-5 text-brand-600" />{t.listen}
            </button>

            {result.notes.map((n) => (
              <p key={n} className="flex gap-2.5 rounded-2xl bg-sun-100 p-3.5 font-semibold text-[#3d2a00]">
                <InfoIcon className="mt-0.5 h-5 w-5 shrink-0" />{n}
              </p>
            ))}

            <div className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-cream-300">
              <h3 className="flex items-center gap-2 text-lg font-black"><span aria-hidden>💡</span>{t.why}</h3>
              {result.fired.length === 0 && <p className="mt-2 text-ink-soft">{t.watch}</p>}
              <ul className="mt-3 space-y-3">
                {result.fired.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-cream-50 p-3.5 ring-1 ring-cream-200">
                    <p className="text-sm font-bold uppercase tracking-wide text-ink-muted">{t.youSaid}:</p>
                    <p className="mt-1.5 flex flex-wrap gap-2">
                      {r.all.map((s) => (
                        <mark key={s} className="rounded-2xl rounded-tl-md bg-brand-50 px-3.5 py-2 text-base font-semibold italic text-ink ring-1 ring-brand-200">“{evidence.find((e) => e.symptom === s)?.phrase}”</mark>
                      ))}
                    </p>
                    <p className="mt-3 text-sm font-bold uppercase tracking-wide text-ink-muted">{t.matched} ({r.id}):</p>
                    <p className="mt-1 font-extrabold">{r.dangerSign}</p>
                    <p className="mt-1 flex items-start gap-1.5 font-bold text-brand-700">
                      <ArrowIcon className="mt-1 h-4 w-4 shrink-0" />
                      {lang === "pcm" ? ACTION_PCM[r.action] ?? r.action : r.action}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={reset}
              className="min-h-14 w-full rounded-2xl border-2 border-brand-600 bg-white text-lg font-black text-brand-700 transition hover:bg-brand-50 active:scale-[0.98]">
              {t.again}
            </button>
          </div>
        </section>
      )}

      {/* Check screen */}
      {home && tab === "check" && (
        <section className="flex-1 px-4 pt-4 motion-safe:animate-rise">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-100 via-brand-50 to-sun-100 p-4 shadow-soft">
            <span className="pointer-events-none absolute right-1 top-2 select-none text-[4.25rem] leading-none opacity-95 motion-safe:animate-float" aria-hidden>🤰🏾</span>
            <p className="max-w-[72%] text-xl font-black leading-snug text-ink">{t.tagline}</p>
            {plan.name ? (
              <p className="mt-3 inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-white/85 px-3 py-2 text-base">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-black uppercase text-white" aria-hidden>{plan.name.trim().charAt(0) || "👤"}</span>
                <span>{t.checkingFor} <strong>{plan.name}</strong>{week ? ` · ${t.week} ${week}` : ""}</span>
              </p>
            ) : (
              <button onClick={() => setTab("plan")}
                className="mt-3 flex min-h-12 w-full items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2 text-left font-extrabold text-brand-700 shadow-soft transition hover:bg-brand-50 active:scale-[0.98]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100" aria-hidden>👤</span>
                <span className="flex-1">{t.register}</span>
                <ArrowIcon className="h-5 w-5 shrink-0" />
              </button>
            )}
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2.5 flex items-center gap-2 text-lg font-black"><Step n={1} />{t.who}</legend>
            <div className="grid grid-cols-3 gap-2.5">
              {MODES.map((m) => {
                const on = mode === m;
                const { emoji, words } = splitEmoji(MODE_TEXT[m][lang]);
                return (
                  <button key={m} aria-pressed={on} onClick={() => { setMode(m); setPicked([]); }}
                    className={`relative flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2.5 text-center text-base font-extrabold leading-tight transition active:scale-95 ${on ? "bg-brand-600 text-white shadow-brand" : "bg-white text-ink shadow-soft ring-1 ring-cream-300 hover:ring-brand-300"}`}>
                    {on && (
                      <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-brand-700 motion-safe:animate-pop" aria-hidden><CheckIcon className="h-3 w-3" /></span>
                    )}
                    <span className="text-4xl leading-none" aria-hidden>{emoji}</span>
                    <span>{words}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mb-2.5 mt-6 flex items-center gap-2">
            <Step n={2} />
            <p className="flex-1 text-lg font-black leading-snug">{t.how}</p>
            {picked.length > 0 && (
              <span className="shrink-0 rounded-full bg-brand-600 px-2.5 py-1 text-sm font-black text-white motion-safe:animate-pop">{picked.length} {t.picked}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(SYMPTOMS) as SymptomId[]).filter((id) => SYMPTOMS[id].modes.includes(mode)).map((id, i) => {
              const on = picked.includes(id);
              return (
                <button key={id} onClick={() => toggle(id)} aria-pressed={on}
                  className={`relative flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center text-base font-bold leading-snug transition active:scale-[0.97] ${on ? "bg-brand-50 text-brand-800 shadow-lift ring-[3px] ring-brand-600" : "bg-white text-ink shadow-soft ring-1 ring-cream-300 hover:ring-brand-300"}`}>
                  {on && <TickBadge />}
                  <span className={`grid h-14 w-14 place-items-center rounded-full text-3xl transition ${TINTS[i % TINTS.length]} ${on ? "scale-110 ring-2 ring-white" : ""}`} aria-hidden>{SYMPTOMS[id].emoji}</span>
                  {name(id)}
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-cream-300">
            <label htmlFor="words" className="flex items-center gap-2 text-lg font-black leading-snug"><Step n={3} />{t.typeLabel}</label>
            <textarea id="words" value={text} onChange={(e) => setText(e.target.value)} rows={3}
              className={`${INPUT} resize-none text-lg`} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={dictate} disabled={listening}
                className={`inline-flex min-h-12 items-center gap-2 rounded-full px-5 font-extrabold transition active:scale-95 ${listening ? "bg-brand-600 text-white" : "border-2 border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-400"}`}>
                {listening ? (
                  <span className="relative grid h-5 w-5 place-items-center" aria-hidden>
                    <span className="absolute inset-0 rounded-full bg-white/60 motion-safe:animate-ping-soft" />
                    <span className="relative h-3 w-3 rounded-full bg-white" />
                  </span>
                ) : <MicIcon className="h-5 w-5" />}
                {listening ? t.listening : t.speak}
              </button>
            </div>
            <p className="mt-3 flex gap-2 text-sm font-semibold leading-relaxed text-ink-muted">
              <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-leaf-700" />
              {t.privacy}
            </p>
          </div>

          {/* Stays in reach above the bottom bar while she scrolls the pictures */}
          <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 bg-linear-to-t from-cream-100 from-70% to-transparent px-4 pb-3 pt-5">
            {error && (
              <p role="alert" className="mb-2 flex items-center gap-2 rounded-2xl bg-[#fdecea] p-3 font-bold text-danger-800 ring-1 ring-danger-600/30">
                <span aria-hidden>⚠️</span>{error}
              </p>
            )}
            <button onClick={check} disabled={busy}
              className="group flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-brand-600 text-xl font-black text-white shadow-brand transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-70">
              {busy ? (
                <span className="h-6 w-6 rounded-full border-[3px] border-white/40 border-t-white motion-safe:animate-spin" aria-hidden />
              ) : (
                <span aria-hidden>🔍</span>
              )}
              {busy ? t.checking : t.submit}
              {!busy && <ArrowIcon className="h-6 w-6 transition-transform motion-safe:group-hover:translate-x-1" />}
            </button>
          </div>
        </section>
      )}

      {/* Birth plan */}
      {home && tab === "plan" && (
        <section className="flex-1 space-y-4 px-4 pb-4 pt-4 motion-safe:animate-rise">
          <h2 className="flex items-center gap-2 text-2xl font-black"><span aria-hidden>📋</span>{t.myPlan}</h2>

          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-600 to-brand-800 p-4 text-white shadow-lift">
            <span className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-white/10" aria-hidden />
            <span className="pointer-events-none absolute -right-4 -top-12 h-28 w-28 rounded-full bg-white/10" aria-hidden />
            <div className="relative flex items-center gap-4">
              <Ring value={readiness} max={5} track="stroke-white/25" bar="stroke-white">
                <p className="text-[1.7rem] font-black leading-none">{readiness}/5</p>
              </Ring>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black leading-tight">{t.readiness}</p>
                {week ? (
                  <div className="mt-2">
                    <p className="text-base font-bold">{t.week} {week} <span className="font-semibold text-white/90">{t.weekOf}</span></p>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/25" aria-hidden>
                      <div className="h-full rounded-full bg-sun-300 transition-[width] duration-700" style={{ width: `${Math.min(100, (week / 40) * 100)}%` }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            {week && nextAncWeek(week) && (
              <p className="relative mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 font-extrabold text-brand-800">
                <span aria-hidden>📅</span>{t.nextVisit} {nextAncWeek(week)}
              </p>
            )}
          </div>

          <fieldset className="rounded-3xl bg-white p-4 shadow-soft ring-1 ring-cream-300">
            <legend className="float-left mb-3 flex w-full items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-tint-blush text-lg font-black uppercase text-brand-700" aria-hidden>{plan.name.trim().charAt(0) || "👤"}</span>
              <span className="text-lg font-black">{t.me}</span>
            </legend>
            <div className="clear-both grid grid-cols-[1fr_6.5rem] items-end gap-3">
              <label className="block">
                <span className="text-base font-bold">{t.myName}</span>
                <input type="text" autoComplete="given-name" value={plan.name} onChange={(e) => savePlan({ ...plan, name: e.target.value })} className={INPUT} />
              </label>
              <label className="block">
                <span className="text-base font-bold">{t.myAge}</span>
                <input type="number" inputMode="numeric" min={10} max={60} value={plan.age} onChange={(e) => savePlan({ ...plan, age: e.target.value })} className={INPUT} />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-cream-300">
            <legend className="float-left flex w-full items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-tint-sky text-2xl" aria-hidden>🏥</span>
              <span className="text-lg font-black">{t.planDates}</span>
            </legend>
            <div className="clear-both space-y-4">
              {field("dueDate", "date", "📅")}
              {field("facility", "text", "🏥")}
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-cream-300">
            <legend className="float-left flex w-full items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-tint-butter text-2xl" aria-hidden>🚗</span>
              <span className="text-lg font-black">{t.planRide}</span>
            </legend>
            <div className="clear-both space-y-4">
              {field("driver", "text", "🧑🏾")}
              {field("driverPhone", "tel", "📞")}
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-cream-300">
            <legend className="float-left flex w-full items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-tint-mint text-2xl" aria-hidden>🤝🏾</span>
              <span className="text-lg font-black">{t.planHelp}</span>
            </legend>
            <div className="clear-both space-y-4">
              {field("donors", "text", "🩸")}
              {field("familyPhone", "tel", "💬")}
              <label className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition ${plan.money ? "border-leaf-600 bg-leaf-50" : "border-cream-300 bg-cream-50 hover:border-brand-300"}`}>
                <input type="checkbox" checked={plan.money} onChange={(e) => savePlan({ ...plan, money: e.target.checked })} className="h-6 w-6 shrink-0 accent-leaf-600" />
                <span className="flex-1 font-bold">{t.money}</span>
                <span className="text-2xl" aria-hidden>💰</span>
              </label>
            </div>
          </fieldset>

          <p className="flex gap-2 px-1 text-sm font-semibold leading-relaxed text-ink-muted">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-leaf-700" />{remote ? t.savedCloud : t.saved}
          </p>
          {remote && t.sync[saveStatus] && (
            <p role="status" className={`px-1 text-sm font-extrabold ${saveStatus === "error" ? "text-danger-700" : saveStatus === "saved" ? "text-leaf-700" : "text-ink-muted"}`}>
              {t.sync[saveStatus]}
            </p>
          )}
          {loginEnabled && (
            <div className="rounded-3xl bg-white p-4 text-base shadow-soft ring-1 ring-cream-300">
              {user ? (
                <p className="leading-relaxed">
                  <span aria-hidden>🔒</span> {t.signedIn} <strong className="break-all">{user}</strong>.{" "}
                  <Link prefetch={false} href="/api/auth/signout" className="inline-flex min-h-12 items-center font-extrabold text-brand-700 underline decoration-2 underline-offset-4">{t.signOut}</Link>
                </p>
              ) : (
                <>
                  <p className="font-bold"><span aria-hidden>📱</span> {t.shared}</p>
                  <Link prefetch={false} href="/api/auth/signin"
                    className="mt-3 flex min-h-13 items-center gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 font-extrabold text-brand-700 ring-2 ring-brand-200 transition hover:ring-brand-400">
                    <LockIcon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{t.signIn}</span>
                    <ArrowIcon className="h-5 w-5 shrink-0" />
                  </Link>
                </>
              )}
            </div>
          )}
          <button onClick={clearData}
            className="inline-flex min-h-12 items-center gap-2 rounded-full px-2 font-extrabold text-danger-700 hover:text-danger-800">
            <span aria-hidden>🗑️</span><span className="underline decoration-2 underline-offset-4">{t.clear}</span>
          </button>
        </section>
      )}

      <footer className="px-4 pb-5 pt-3 text-center">
        <p className="mx-auto flex max-w-sm gap-2.5 rounded-2xl bg-cream-50 p-3.5 text-left text-sm font-semibold leading-relaxed text-ink-soft ring-1 ring-cream-300">
          <ShieldIcon className="h-5 w-5 shrink-0 text-leaf-700" />
          {t.disclaimer}
        </p>
        <p className="mt-2">
          <Link href="/tests" className="inline-flex min-h-12 items-center gap-1.5 font-extrabold text-brand-700">
            <span aria-hidden>🧪</span><span className="underline decoration-2 underline-offset-4">{t.tests}</span>
          </Link>
        </p>
      </footer>

      {/* Bottom navigation: easy to reach with a thumb */}
      {home && (
        <nav className="sticky bottom-0 z-20 border-t border-cream-300 bg-cream-50 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
          <div className="grid grid-cols-2 gap-2">
            {(["check", "plan"] as const).map((k) => {
              const on = tab === k;
              return (
                <button key={k} aria-current={on ? "page" : undefined} onClick={() => { setTab(k); window.scrollTo(0, 0); }}
                  className={`relative flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-black transition active:scale-95 ${on ? "bg-brand-100 text-brand-800" : "text-ink-muted hover:bg-cream-200"}`}>
                  {on && <span className="absolute -top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-brand-600" aria-hidden />}
                  {k === "check" ? <HeartPulseIcon className="h-6 w-6 shrink-0" /> : <ClipboardIcon className="h-6 w-6 shrink-0" />}
                  {t[k]}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </main>
  );
}
