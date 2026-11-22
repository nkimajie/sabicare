// The one extraction pipeline used by both the app and the safety tests.
import { keywordExtract, type Evidence } from "./keywords";
import { triage, type Mode } from "./rules";

export interface Extracted {
  evidence: Evidence[];
  uncertain: boolean;
  motherAge: number | null;
  source: "phone" | "ai" | "keywords" | "fallback";
}

export async function extract(text: string, mode: Mode): Promise<Extracted> {
  // 1. Phrase list on the phone: instant, and works with no network.
  const local = keywordExtract(text, mode);
  const symptoms = local.evidence.map((e) => e.symptom);
  // Already an emergency: do not wait for the AI.
  if (triage({ mode, symptoms }).level === "RED") {
    return { evidence: local.evidence, uncertain: false, motherAge: null, source: "phone" };
  }
  // 2. AI on the server. Anything it finds is added to what the phone found.
  try {
    const res = await fetch("/api/extract", { method: "POST", body: JSON.stringify({ text, mode }) });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const have = new Set(symptoms);
    const extra = (data.evidence as Evidence[]).filter((e) => !have.has(e.symptom));
    return { evidence: [...local.evidence, ...extra], uncertain: data.uncertain, motherAge: data.motherAge, source: data.source };
  } catch {
    // Offline or server error: rely on the phone's own check.
    return { ...local, motherAge: null, source: "phone" };
  }
}
