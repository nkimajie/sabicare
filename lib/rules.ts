// SabiCare triage rules engine.
// Deterministic: the AI never decides the colour. It only extracts symptoms;
// this table (based on WHO danger signs for pregnancy, after birth and
// newborns) decides. See README for sources.

export type Level = "RED" | "AMBER" | "GREEN";
export type Mode = "pregnant" | "postpartum" | "newborn";

export type SymptomId =
  | "bleeding" | "convulsions" | "severe_headache" | "blurred_vision" | "swelling"
  | "fever" | "severe_abdominal_pain" | "abdominal_pain" | "difficult_breathing"
  | "reduced_fetal_movement" | "waters_broken" | "headache" | "vomiting"
  | "painful_urination" | "foul_discharge" | "breast_pain" | "very_weak"
  | "not_feeding" | "baby_cold" | "baby_weak" | "jaundice" | "cord_infection";

const P: Mode[] = ["pregnant"];
const PP: Mode[] = ["pregnant", "postpartum"];
const M: Mode[] = ["postpartum"];
const N: Mode[] = ["newborn"];
const ALL: Mode[] = ["pregnant", "postpartum", "newborn"];

export const SYMPTOMS: Record<SymptomId, { label: string; emoji: string; modes: Mode[] }> = {
  bleeding: { label: "Bleeding from the vagina", emoji: "🩸", modes: PP },
  convulsions: { label: "Fits / convulsions / fainting", emoji: "⚡", modes: ALL },
  severe_headache: { label: "Severe headache", emoji: "🤕", modes: PP },
  blurred_vision: { label: "Blurred vision", emoji: "👁️", modes: PP },
  swelling: { label: "Swollen face, hands or legs", emoji: "🦶", modes: PP },
  fever: { label: "Fever / hot body", emoji: "🌡️", modes: ALL },
  severe_abdominal_pain: { label: "Severe belly pain", emoji: "😣", modes: PP },
  abdominal_pain: { label: "Belly pain", emoji: "🤰", modes: PP },
  difficult_breathing: { label: "Fast or difficult breathing", emoji: "😮‍💨", modes: ALL },
  reduced_fetal_movement: { label: "Baby moving less or not moving", emoji: "👶", modes: P },
  waters_broken: { label: "Water has broken", emoji: "💧", modes: P },
  headache: { label: "Headache", emoji: "🙍", modes: PP },
  vomiting: { label: "Vomiting a lot", emoji: "🤢", modes: P },
  painful_urination: { label: "Pain when passing urine", emoji: "🚻", modes: PP },
  foul_discharge: { label: "Bad-smelling discharge", emoji: "👃", modes: M },
  breast_pain: { label: "Swollen, red or painful breast", emoji: "🤱", modes: M },
  very_weak: { label: "Too weak to get out of bed", emoji: "🛌", modes: PP },
  not_feeding: { label: "Baby not sucking / not feeding", emoji: "🍼", modes: N },
  baby_cold: { label: "Baby's body is cold", emoji: "🥶", modes: N },
  baby_weak: { label: "Baby weak or not moving", emoji: "😴", modes: N },
  jaundice: { label: "Yellow eyes, palms or soles", emoji: "🟡", modes: N },
  cord_infection: { label: "Cord red or has pus", emoji: "🩹", modes: N },
};

export interface Rule {
  id: string;
  level: Level;
  modes: Mode[];
  /** all of these must be present */
  all: SymptomId[];
  dangerSign: string;
  action: string;
}

const NOW = "Go to the hospital now.";
const TODAY = "See a health worker today.";

// The highest level that fires wins.
export const RULES: Rule[] = [
  // Pregnancy and after birth (mother)
  { id: "R1", level: "RED", modes: PP, all: ["bleeding"], dangerSign: "Vaginal bleeding", action: NOW },
  { id: "R2", level: "RED", modes: PP, all: ["convulsions"], dangerSign: "Convulsions or loss of consciousness", action: NOW },
  { id: "R3", level: "RED", modes: PP, all: ["severe_headache", "blurred_vision"], dangerSign: "Severe headache with blurred vision", action: NOW },
  { id: "R4", level: "RED", modes: PP, all: ["severe_abdominal_pain"], dangerSign: "Severe abdominal pain", action: NOW },
  { id: "R5", level: "RED", modes: PP, all: ["difficult_breathing"], dangerSign: "Fast or difficult breathing", action: NOW },
  { id: "R6", level: "RED", modes: P, all: ["reduced_fetal_movement"], dangerSign: "Baby moving less or not at all", action: NOW },
  { id: "R7", level: "RED", modes: PP, all: ["headache", "swelling"], dangerSign: "Headache with swelling of face, hands or legs", action: NOW },
  { id: "R8", level: "RED", modes: PP, all: ["blurred_vision", "swelling"], dangerSign: "Blurred vision with swelling", action: NOW },
  { id: "R9", level: "RED", modes: PP, all: ["severe_headache", "swelling"], dangerSign: "Severe headache with swelling", action: NOW },
  { id: "R10", level: "RED", modes: PP, all: ["fever", "very_weak"], dangerSign: "Fever and too weak to get out of bed", action: NOW },
  { id: "A1", level: "AMBER", modes: PP, all: ["fever"], dangerSign: "Fever", action: TODAY },
  { id: "A2", level: "AMBER", modes: PP, all: ["abdominal_pain"], dangerSign: "Abdominal pain", action: TODAY },
  { id: "A3", level: "AMBER", modes: PP, all: ["swelling"], dangerSign: "Swelling of face, hands or legs", action: TODAY },
  { id: "A4", level: "AMBER", modes: P, all: ["waters_broken"], dangerSign: "Waters have broken", action: "Go to the health facility today." },
  { id: "A5", level: "AMBER", modes: PP, all: ["severe_headache"], dangerSign: "Severe headache", action: TODAY },
  { id: "A6", level: "AMBER", modes: PP, all: ["blurred_vision"], dangerSign: "Blurred vision", action: TODAY },
  { id: "A7", level: "AMBER", modes: P, all: ["vomiting"], dangerSign: "Persistent vomiting", action: TODAY },
  { id: "A8", level: "AMBER", modes: PP, all: ["painful_urination"], dangerSign: "Pain when passing urine", action: TODAY },
  { id: "A9", level: "AMBER", modes: PP, all: ["headache"], dangerSign: "Headache", action: "See a health worker today if it does not go away." },
  { id: "A10", level: "AMBER", modes: M, all: ["foul_discharge"], dangerSign: "Bad-smelling discharge after birth", action: TODAY },
  { id: "A11", level: "AMBER", modes: M, all: ["breast_pain"], dangerSign: "Swollen, red or tender breast", action: TODAY },
  { id: "A12", level: "AMBER", modes: PP, all: ["very_weak"], dangerSign: "Feeling very weak or ill", action: TODAY },
  // Newborn: every danger sign means go now
  { id: "N1", level: "RED", modes: N, all: ["not_feeding"], dangerSign: "Baby not feeding well", action: NOW },
  { id: "N2", level: "RED", modes: N, all: ["convulsions"], dangerSign: "Baby has convulsions", action: NOW },
  { id: "N3", level: "RED", modes: N, all: ["difficult_breathing"], dangerSign: "Baby breathing fast or with difficulty", action: NOW },
  { id: "N4", level: "RED", modes: N, all: ["fever"], dangerSign: "Baby has fever", action: NOW },
  { id: "N5", level: "RED", modes: N, all: ["baby_cold"], dangerSign: "Baby's body is cold", action: NOW },
  { id: "N6", level: "RED", modes: N, all: ["baby_weak"], dangerSign: "Baby weak, floppy or moving only when touched", action: NOW },
  { id: "N7", level: "RED", modes: N, all: ["jaundice"], dangerSign: "Yellow eyes, palms or soles", action: NOW },
  { id: "N8", level: "AMBER", modes: N, all: ["cord_infection"], dangerSign: "Cord red or draining pus", action: TODAY },
];

export interface TriageInput {
  mode?: Mode;
  symptoms: SymptomId[];
  /** true when the AI was unsure or failed: never return GREEN */
  uncertain?: boolean;
  motherAge?: number | null;
}

export interface TriageResult {
  level: Level;
  fired: Rule[];
  notes: string[];
}

const RANK: Record<Level, number> = { GREEN: 0, AMBER: 1, RED: 2 };

export function triage(input: TriageInput): TriageResult {
  const mode = input.mode ?? "pregnant";
  const have = new Set(input.symptoms);
  const fired = RULES.filter((r) => r.modes.includes(mode) && r.all.every((s) => have.has(s)));
  let level: Level = "GREEN";
  for (const r of fired) if (RANK[r.level] > RANK[level]) level = r.level;

  const notes: string[] = [];
  // Fail safe: uncertainty can raise GREEN to AMBER. It never lowers anything.
  if (level === "GREEN" && input.uncertain) {
    level = "AMBER";
    notes.push("We could not understand everything clearly. To be safe, see a health worker.");
  }
  // A symptom was reported but no rule covers it in this mode: do not say GREEN.
  if (level === "GREEN" && input.symptoms.length > 0) {
    level = "AMBER";
    notes.push("You reported a symptom. To be safe, see a health worker.");
  }
  if (level !== "GREEN" && mode !== "newborn" && input.motherAge != null && input.motherAge < 18) {
    notes.push("Mothers under 18 are at higher risk. Do not delay care.");
  }
  const top = fired.filter((r) => r.level === level);
  return { level, fired: top.length ? top : fired, notes };
}

// One follow-up question, chosen by the rules (not by the AI): we only ask when
// a "yes" would raise the result to a more urgent colour.
const FOLLOW_UPS: { have: SymptomId; ask: SymptomId; en: string; pcm: string }[] = [
  { have: "headache", ask: "severe_headache", en: "Is the headache very strong, or has it refused to go away?", pcm: "Di headache strong well well, or e no gree go?" },
  { have: "severe_headache", ask: "blurred_vision", en: "Are your eyes blurry, or are you seeing flashes or double?", pcm: "Your eye dey blur, or you dey see double?" },
  { have: "headache", ask: "swelling", en: "Are your face, hands or legs swollen?", pcm: "Your face, hand or leg don swell?" },
  { have: "abdominal_pain", ask: "severe_abdominal_pain", en: "Is the belly pain very strong or constant?", pcm: "Di belle pain strong well well or e no dey stop?" },
  { have: "fever", ask: "very_weak", en: "Are you too weak to get out of bed?", pcm: "You too weak to stand up from bed?" },
  { have: "swelling", ask: "headache", en: "Do you also have a headache?", pcm: "Head dey pain you join?" },
];

export function followUp(mode: Mode, symptoms: SymptomId[]) {
  const now = RANK[triage({ mode, symptoms }).level];
  if (now === RANK.RED) return null;
  for (const f of FOLLOW_UPS) {
    if (!symptoms.includes(f.have) || symptoms.includes(f.ask)) continue;
    if (!SYMPTOMS[f.ask].modes.includes(mode)) continue;
    if (RANK[triage({ mode, symptoms: [...symptoms, f.ask] }).level] > now) return f;
  }
  return null;
}

// WHO 2016 antenatal care model: 8 contacts, at these weeks of pregnancy.
export const ANC_WEEKS = [12, 20, 26, 30, 34, 36, 38, 40];
export function nextAncWeek(week: number): number | null {
  return ANC_WEEKS.find((w) => w >= week) ?? null;
}
