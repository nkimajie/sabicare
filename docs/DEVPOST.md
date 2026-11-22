# Devpost write-up (draft: edit into your own words)

**Project name:** SabiCare · Mama & Pikin

**Tagline:** Know the pregnancy danger signs. Act early. Wake up the whole family.

## Inspiration
In 2023 an estimated 260,000 women died from pregnancy and childbirth, and Nigeria alone accounted for about 75,000 of them, more than a quarter of the world total (UN MMEIG, 2025). Most of these deaths were preventable. Many start with the "first delay": nobody at home recognised the danger sign, or the family decided to wait.

## What it does
A pregnant woman, new mother or family member taps pictures or types how she feels in English or Pidgin. SabiCare answers with one of three results: go to the hospital now, see a health worker today, or no danger sign found. It shows why, by placing her own words next to the danger sign they matched. One tap sends her family a WhatsApp alert with her saved birth plan: which hospital, which driver, which blood donors.

It covers three stages: pregnancy, the weeks after birth, and the newborn baby.

## How we built it
- Next.js (App Router), React, TypeScript and Tailwind CSS, deployed on Vercel.
- Claude API for one job only: turning free text into a fixed list of symptom ids.
- A deterministic rules engine, based on WHO danger signs, decides the result.
- A phrase list for English and Pidgin runs in the browser, so the check works offline and emergencies show instantly.
- A safety test page runs 46 test messages through the real pipeline and counts missed danger signs.
- MojoAuth passwordless login (email code, through Auth.js and OpenID Connect). It is optional and never blocks the symptom check. It gives each woman her own private birth plan when a phone is shared. [Confirm this works with your MojoAuth account before submitting.]

## Responsible AI
The AI never decides the result. If the AI fails, is unsure or does not understand, the app never shows green. A symptom found by either the AI or the phrase list counts. AI output is validated before use.

## Challenges
- Handling denials ("no bleeding") and Pidgin where "no" is part of the symptom ("baby no dey move").
- Designing every failure to land on the safe side.

## What we learned
[Write this yourself: 2-3 honest sentences.]

## Limits
It is a prototype and is not clinically validated. The rules have not been reviewed by a clinician. Hausa, Yoruba and Igbo are untested.

## What's next
Review by midwives, Hausa/Yoruba/Igbo with native speakers, read-aloud in local languages, offline install, and a health-worker view.

## Built with
nextjs, react, typescript, tailwindcss, claude, vercel, [mojoauth]

## What was built during the event / AI use
Everything was built during the event. [Describe your AI use honestly here, as the rules require.]
