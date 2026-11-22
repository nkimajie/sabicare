// Offline extractor: phrase matching for English and Pidgin.
// Runs on the phone (works with no network) and again on the server as a
// second safety net beside the AI. A symptom found by either one counts.
import { SYMPTOMS, type Mode, type SymptomId } from "./rules";

export interface Evidence {
  symptom: SymptomId;
  phrase: string; // the user's own words that matched
}

// Each phrase matches at a word start and may have a word ending ("bleed" also matches "bleeding").
const PHRASES: Record<SymptomId, string[]> = {
  bleeding: ["bleed", "blood dey", "dey bleed", "blood is coming", "blood coming", "seeing blood", "blood come", "blood comot", "haemorrhage", "hemorrhage"],
  convulsions: ["convuls", "fits", "a fit", "seizure", "faint", "jerking", "shaking", "fall down", "collapse", "unconscious", "passed out"],
  severe_headache: ["severe headache", "bad headache", "strong headache", "terrible headache", "serious headache", "head dey pain me well well", "head dey pain well well", "head dey burst", "headache no gree go", "headache will not go"],
  blurred_vision: ["blurred vision", "blurry", "blur", "cannot see well", "cant see well", "eye dey turn", "seeing double", "no dey see well", "seeing flashes"],
  swelling: ["swell", "swollen", "don swell"],
  fever: ["fever", "hot body", "body dey hot", "body hot", "body is hot", "high temperature", "malaria"],
  severe_abdominal_pain: ["severe belly pain", "severe stomach pain", "severe abdominal pain", "belle dey pain me well well", "belle dey pain well well", "serious belle pain", "terrible stomach pain"],
  abdominal_pain: ["belly pain", "stomach pain", "abdominal pain", "belle dey pain", "belle pain", "cramps", "stomach dey pain"],
  difficult_breathing: ["cannot breathe", "cant breathe", "breathing fast", "fast breathing", "difficult breathing", "difficulty breathing", "short of breath", "no fit breathe", "breath dey hook", "chest pain"],
  reduced_fetal_movement: ["baby not moving", "baby is not moving", "baby moving less", "baby no dey move", "pikin no dey move", "baby no dey kick", "not kicking", "stopped moving", "stopped kicking"],
  waters_broken: ["water broke", "water has broken", "waters broke", "water don break", "water dey leak", "leaking water", "water break"],
  headache: ["headache", "head dey pain", "head pain", "head is paining"],
  vomiting: ["vomit", "throwing up", "throw up"],
  painful_urination: ["pain when i urinate", "painful urine", "burning urine", "pain when passing urine", "piss dey pain", "urine dey pain"],
  foul_discharge: ["bad smell", "smelling discharge", "smelly discharge", "foul", "dey smell"],
  breast_pain: ["breast pain", "breast dey pain", "breast is swollen", "breast don swell", "breast is red", "painful breast", "sore nipple"],
  very_weak: ["too weak", "cannot get out of bed", "cant get out of bed", "no fit stand", "very weak", "no get power"],
  not_feeding: ["not feeding", "not sucking", "refuse breast", "refusing breast", "no wan suck", "no dey suck", "not breastfeeding", "wont feed", "no dey chop", "stopped feeding"],
  baby_cold: ["body is cold", "body cold", "body dey cold", "cold body", "feels cold"],
  baby_weak: ["floppy", "not waking", "no dey wake", "baby is weak", "baby weak", "pikin weak", "not moving", "no dey move"],
  jaundice: ["yellow eye", "eye yellow", "eyes are yellow", "eye don yellow", "yellow skin", "jaundice", "yellow palm"],
  cord_infection: ["cord is red", "cord red", "pus", "cord dey smell", "navel red", "cord infection"],
};

const NEGATION_WORDS = new Set(["no", "not", "never", "without", "dont", "didnt", "doesnt", "isnt", "havent", "none", "nor"]);
const CLAUSE_BREAK = /\b(but|and|today|now|then)\b/;

/** Lower-case, drop apostrophes (so "can't" = "cant"), turn punctuation into clause breaks. */
function normalise(text: string) {
  return text.toLowerCase().replace(/[’'`]/g, "").replace(/[.,!?;:\n]/g, " | ").replace(/\s+/g, " ");
}

function isNegated(before: string) {
  // Only the words since the last clause break, and at most the last four.
  const clause = before.split("|").pop()!.split(CLAUSE_BREAK).pop()!;
  return clause.trim().split(" ").slice(-4).some((w) => NEGATION_WORDS.has(w));
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function keywordExtract(text: string, mode: Mode = "pregnant"): { evidence: Evidence[]; uncertain: boolean } {
  const norm = normalise(text);
  const evidence: Evidence[] = [];
  let denied = 0; // symptoms the user clearly said they do NOT have
  for (const id of Object.keys(PHRASES) as SymptomId[]) {
    if (!SYMPTOMS[id].modes.includes(mode)) continue;
    let found: string | null = null;
    let wasDenied = false;
    for (const p of PHRASES[id]) {
      // Check EVERY occurrence: "no bleeding yesterday, today I dey bleed" must count.
      for (const m of norm.matchAll(new RegExp(`\\b${escape(p)}\\w*`, "g"))) {
        if (isNegated(norm.slice(0, m.index))) wasDenied = true;
        else found ??= m[0];
      }
      if (found) break;
    }
    if (found) evidence.push({ symptom: id, phrase: found });
    else if (wasDenied) denied++;
  }
  // If we recognised nothing at all in a non-empty message, we did not understand it.
  const uncertain = evidence.length === 0 && denied === 0 && text.trim().length > 0;
  return { evidence, uncertain };
}
