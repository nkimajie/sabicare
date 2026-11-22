// Safety test set. "expected" is the MINIMUM acceptable level:
// getting a lower colour than expected is a missed danger sign (the bad error).
import type { Level, Mode } from "./rules";

export interface TestCase { mode: Mode; text: string; expected: Level }

export const TEST_CASES: TestCase[] = [
  // Pregnancy: RED
  { mode: "pregnant", text: "I am bleeding", expected: "RED" },
  { mode: "pregnant", text: "blood dey comot from my body since morning", expected: "RED" },
  { mode: "pregnant", text: "small small blood dey come", expected: "RED" },
  { mode: "pregnant", text: "my head dey pain me well well and my eye dey blur", expected: "RED" },
  { mode: "pregnant", text: "severe headache and blurred vision", expected: "RED" },
  { mode: "pregnant", text: "she had a fit and fainted", expected: "RED" },
  { mode: "pregnant", text: "my wife is jerking and shaking on the floor", expected: "RED" },
  { mode: "pregnant", text: "baby no dey move since yesterday", expected: "RED" },
  { mode: "pregnant", text: "the baby is not moving like before", expected: "RED" },
  { mode: "pregnant", text: "belle dey pain me well well", expected: "RED" },
  { mode: "pregnant", text: "I cannot breathe well", expected: "RED" },
  { mode: "pregnant", text: "headache and my leg don swell", expected: "RED" },
  { mode: "pregnant", text: "my face is swollen and my vision is blurry", expected: "RED" },
  { mode: "pregnant", text: "I have fever and I am too weak, cannot get out of bed", expected: "RED" },
  { mode: "pregnant", text: "no fever but I am bleeding", expected: "RED" },
  // Pregnancy: AMBER
  { mode: "pregnant", text: "body dey hot", expected: "AMBER" },
  { mode: "pregnant", text: "I have a headache", expected: "AMBER" },
  { mode: "pregnant", text: "my legs are swollen", expected: "AMBER" },
  { mode: "pregnant", text: "water don break", expected: "AMBER" },
  { mode: "pregnant", text: "I am vomiting everything I eat", expected: "AMBER" },
  { mode: "pregnant", text: "pain when passing urine", expected: "AMBER" },
  { mode: "pregnant", text: "belle dey pain small", expected: "AMBER" },
  { mode: "pregnant", text: "no bleeding, but head dey pain", expected: "AMBER" },
  { mode: "pregnant", text: "qwerty zxcv something unclear", expected: "AMBER" },
  // Tricky wording found in code review
  { mode: "pregnant", text: "No bleeding yesterday, today blood dey rush", expected: "RED" },
  { mode: "pregnant", text: "I can’t breathe", expected: "RED" },
  { mode: "pregnant", text: "I collapse this morning", expected: "RED" },
  { mode: "pregnant", text: "I went for my blood test and blood pressure check", expected: "AMBER" },
  // Pregnancy: GREEN (denials must not trigger)
  { mode: "pregnant", text: "no bleeding", expected: "GREEN" },
  { mode: "pregnant", text: "I no get fever", expected: "GREEN" },
  { mode: "pregnant", text: "I dont have any bleeding", expected: "GREEN" },
  // After birth: mother
  { mode: "postpartum", text: "heavy bleeding, blood dey comot plenty", expected: "RED" },
  { mode: "postpartum", text: "severe headache and my eye dey blur", expected: "RED" },
  { mode: "postpartum", text: "fever and I no fit stand", expected: "RED" },
  { mode: "postpartum", text: "she is having convulsions", expected: "RED" },
  { mode: "postpartum", text: "the discharge has a bad smell", expected: "AMBER" },
  { mode: "postpartum", text: "my breast dey pain and e don swell", expected: "AMBER" },
  { mode: "postpartum", text: "hot body since yesterday", expected: "AMBER" },
  // Newborn
  { mode: "newborn", text: "baby no wan suck, body hot", expected: "RED" },
  { mode: "newborn", text: "the baby is not feeding", expected: "RED" },
  { mode: "newborn", text: "baby is breathing fast", expected: "RED" },
  { mode: "newborn", text: "pikin body dey cold", expected: "RED" },
  { mode: "newborn", text: "her eyes are yellow, yellow eyes and palms", expected: "RED" },
  { mode: "newborn", text: "the baby is floppy and not waking", expected: "RED" },
  { mode: "newborn", text: "baby had a fit", expected: "RED" },
  { mode: "newborn", text: "the cord is red and has pus", expected: "AMBER" },
];
