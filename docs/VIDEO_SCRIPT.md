# SabiCare demo video script (under 3 minutes)

About 390 spoken words: about 2 min 50 s at a calm pace. Read the VOICE lines; the SCREEN lines say what the video shows.
Leave about one second of silence between sections, so the voice can be lined up with the screens.

---

**1. The problem (0:00–0:20)**
SCREEN: Title card "SabiCare · Mama & Pikin: Know the danger signs. Act early." Then the welcome screen.
VOICE:
> In 2023, about 260,000 women died from pregnancy and childbirth. Most of those deaths were preventable, and about 70% were in sub-Saharan Africa. Nigeria lost about 75,000 women, more than any other country. So we started where the need is greatest.

**2. Imagine Amina: the birth plan (0:20–0:38)**
SCREEN: Birth plan tab: name Amina, age 24, hospital, driver, two donors, husband's number, money saved. The ring shows 5/5 and the bar shows "Week 34 of 40".
VOICE:
> Imagine Amina. She isn't a real patient, but her story is common. She's 34 weeks pregnant, and weeks ago she made her birth plan in SabiCare: her hospital, a driver, two blood donors and her husband's WhatsApp number.

**3. The night (0:38–1:15)**
SCREEN: Check symptoms. Choose "I am pregnant", type the Pidgin sentence and press "Check now". The red screen appears. Scroll to "Why this result?", then tap "Alert my family on WhatsApp" and show the prefilled message.
VOICE:
> One night, she has a severe headache, swollen feet and blurred vision. Her family says: wait till morning. Nobody knows these are danger signs.
> Imagine Amina types, in Pidgin: "my head dey pain me well well and my eye dey blur." The screen turns red: go to the hospital now. It shows her why, in her own words. One tap sends her husband a WhatsApp alert with the hospital, the driver and the blood donors. A decision that took hours now takes a minute.

**4. The newborn (1:15–1:27)**
SCREEN: Check again. Choose "My new baby", tap "Baby not sucking / not feeding", and the result is red.
VOICE:
> After the birth, SabiCare checks the baby too. Not feeding, fever, yellow eyes: for a newborn, most danger signs mean go now.

**5. The code (1:27–2:10)**
SCREEN: `lib/rules.ts`: the RULES table (rule R3 is on line 65), then the `triage()` function (lines 112–129), with the fail-safe lines highlighted.
VOICE (say it in your own words):
> Now the code. The AI never decides the result. Claude only turns her words into symptoms from a fixed list. This rules table, based on WHO danger signs, makes the decision. Rule R3: severe headache plus blurred vision is red. The triage function checks every rule, and the most urgent colour wins. It also fails safe: if the AI is unsure or fails, the answer can never be green. A symptom found by either the AI or our offline phrase list counts. For Amina, the AI only saw a headache; the phrase list caught "well well" as severe.

**6. Safety and privacy (2:10–2:30)**
SCREEN: `/tests`: press "Run all tests" and show "0 missed danger signs". On-screen text: "46 test messages written by the team, not a clinical study." Then the welcome screen with "Continue as guest" and "Sign in".
VOICE:
> Our safety test page runs 46 messages in English and Pidgin, including denials like "no bleeding". Zero missed danger signs. Login is optional: she can continue as a guest, or sign in with an email code, and her birth plan is saved encrypted. This is a prototype, not yet clinically validated.

**7. How it scales (2:30–2:48)**
SCREEN: Three stages: Now: Nigeria (English, Pidgin). Next: sub-Saharan Africa. Vision: anywhere families decide alone.
VOICE:
> SabiCare is built for Nigeria first and designed to scale. The rules follow WHO guidance used everywhere, so only the language, the emergency number and the clinic schedule change. Now: Nigeria, in English and Pidgin. Next: sub-Saharan Africa. Then anywhere a family must decide alone whether to go to hospital.

**8. Close (2:48–3:00)**
SCREEN: End card "SabiCare · Mama & Pikin". Show github.com/nkimajie/sabicare and the live link. Small print: "Prototype. Not clinically validated. Amina is an illustrative character."
VOICE:
> Amina is in Nigeria. The same night is happening in Kenya, in Ethiopia, in Bangladesh. No mother should die because nobody knew the signs. SabiCare: know the danger signs, act early.

---

## Before recording
- **The 70% figure:** WHO's maternal mortality fact sheet (dated 7 April 2025) says "Sub-Saharan Africa alone accounted for around 70% of maternal deaths (182 000)". Open https://www.who.int/news-room/fact-sheets/detail/maternal-mortality once and confirm it yourself.
- **The email-code line (section 6):** say "sign in with an email code" only if sign-in works on the live site. Otherwise say: "Login is optional: she can continue as a guest."
- **The other numbers** (260,000; most preventable; 75,000; more than any other country) come from the README sources: WHO / UN MMEIG 2025.
