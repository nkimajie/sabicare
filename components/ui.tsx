// Small presentational pieces shared by the app and the tests page.
// No logic lives here: only markup, inline SVG icons and styles.
import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      {children}
    </svg>
  );
}

/** Brand mark: a big heart (mama) holding a small heart (pikin). */
export function Logo({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <span className={`relative inline-grid shrink-0 place-items-center rounded-2xl bg-linear-to-br from-brand-400 to-brand-700 shadow-brand ${className}`} aria-hidden>
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]">
        <path fill="#fff" d="M16 28s-11-6.6-11-14.3C5 9.4 8 6.5 11.6 6.5c2 0 3.5 1 4.4 2.4.9-1.4 2.4-2.4 4.4-2.4C24 6.5 27 9.4 27 13.7 27 21.4 16 28 16 28z" />
        <path fill="#e8436b" d="M16 21.5s-4.6-2.8-4.6-6c0-1.7 1.2-2.9 2.6-2.9.9 0 1.6.5 2 1.1.4-.6 1.1-1.1 2-1.1 1.4 0 2.6 1.2 2.6 2.9 0 3.2-4.6 6-4.6 6z" />
      </svg>
      <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-cream-50 bg-leaf-500" />
    </span>
  );
}

export function CheckIcon(p: IconProps) {
  return <Svg strokeWidth={3.2} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
}
export function CrossIcon(p: IconProps) {
  return <Svg strokeWidth={3} {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
}
export function ArrowIcon(p: IconProps) {
  return <Svg strokeWidth={2.6} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
}
export function MicIcon(p: IconProps) {
  return <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Svg>;
}
export function SpeakerIcon(p: IconProps) {
  return <Svg {...p}><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></Svg>;
}
export function GlobeIcon(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></Svg>;
}
export function LockIcon(p: IconProps) {
  return <Svg {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></Svg>;
}
export function PhoneIcon(p: IconProps) {
  return <Svg {...p}><path d="M5 4h3.5l1.8 4.5-2.3 1.5a11 11 0 0 0 6 6l1.5-2.3L20 15.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Svg>;
}
export function ChatIcon(p: IconProps) {
  return <Svg {...p}><path d="M4 5h16v11H9l-5 4V5z" /><path d="M8 9.5h8M8 12.5h5" /></Svg>;
}
export function HeartPulseIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 20s-8-4.8-8-10.4C4 6.6 6.2 4.5 8.8 4.5c1.4 0 2.5.7 3.2 1.7.7-1 1.8-1.7 3.2-1.7C17.8 4.5 20 6.6 20 9.6 20 15.2 12 20 12 20z" /><path d="M4.5 12h4l1.5-2.5 2.5 5 1.5-2.5h5.5" /></Svg>;
}
export function ClipboardIcon(p: IconProps) {
  return <Svg {...p}><rect x="5" y="4.5" width="14" height="16.5" rx="2.5" /><path d="M9 4.5V3.5h6v1M8.5 10h7M8.5 13.5h7M8.5 17h4" /></Svg>;
}
export function InfoIcon(p: IconProps) {
  return <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.8v.2" /></Svg>;
}
export function ShieldIcon(p: IconProps) {
  return <Svg {...p}><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6L12 3z" /><path d="M8.8 12.2l2.2 2.2 4.3-4.4" /></Svg>;
}

/** Round "selected" badge so the picked state never relies on colour alone. */
export function TickBadge() {
  return (
    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-white shadow-soft ring-2 ring-white motion-safe:animate-pop" aria-hidden>
      <CheckIcon className="h-4 w-4" />
    </span>
  );
}

/** Circular progress ring, e.g. birth readiness 3 of 5. */
export function Ring({ value, max, children, size = 96, track = "stroke-brand-100", bar = "stroke-brand-600" }:
  { value: number; max: number; children: ReactNode; size?: number; track?: string; bar?: string }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="11" className={track} />
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="11" strokeLinecap="round"
          className={`${bar} transition-[stroke-dashoffset] duration-700 ease-out`}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}

/** Rounded progress bar. */
export function Bar({ pct, className = "bg-brand-600" }: { pct: number; className?: string }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-cream-200" aria-hidden>
      <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${className}`} style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} />
    </div>
  );
}

/** Small numbered step marker for section headings. */
export function Step({ n }: { n: number }) {
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-700" aria-hidden>
      {n}
    </span>
  );
}
