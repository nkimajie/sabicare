# SabiCare · Mama & Pikin

**Know the danger signs. Act early.**

SabiCare is a web app that helps pregnant women, new mothers and their families in Nigeria recognise danger signs early and act on them. A woman taps pictures or types how she feels in English or Pidgin. The app tells her whether to go to hospital now, see a health worker today, or keep watching, shows her why, and alerts her family on WhatsApp with her birth plan.

Built for EvoHacks 2.0 (theme: Social Good).

## The problem

- In 2023 an estimated 260,000 women died from pregnancy and childbirth. Most of these deaths were preventable. (WHO / UN MMEIG, 2025)
- Nigeria accounted for about 75,000 of them, 28.7% of the world total. (UN MMEIG, 2025)
- Bleeding and high blood pressure disorders cause over 40% of maternal deaths worldwide. Both give warning signs. (Cresswell et al., Lancet Global Health, 2025)
- The "three delays" model (Thaddeus & Maine, 1994) names the first delay as the decision to seek care. SabiCare targets that delay.

## What it does

| Feature | What happens |
|---|---|
| Symptom check | Tap picture buttons or type in English or Pidgin. Three stages: pregnant, just gave birth, newborn baby. |
| Red / amber / green result | Go to hospital now, see a health worker today, or no danger sign found. |
| "Why this result?" | Shows the user's own words next to the danger sign they matched and the rule number. |
| One follow-up question | The rules pick one question, and only when a "yes" would make the result more urgent. |
| Birth plan | Hospital, driver, two blood donors, family number, money saved. Readiness score out of 5, pregnancy week and next clinic visit. |
| Family alert | One tap opens WhatsApp (or SMS) with the signs and the birth plan details. |
| Voice | Speak instead of typing, and have the result read aloud (where the browser supports it). |
| Guest or sign in | The first screen offers "Continue as guest" (one tap to the symptom check) or "Sign in to save my details". Login is never required. |
| Passwordless login (optional) | MojoAuth email code, no password. A signed-in woman's name, age and birth plan are encrypted (AES-256-GCM) on the server and saved in Supabase, so she can come back to them. Guests' plans stay on the phone. |
| Safety tests | `/tests` runs 46 test messages through the real pipeline and counts missed danger signs. |

## How it works

```
words or taps
   │
   ├─ 1. Phrase list on the phone (lib/keywords.ts)   instant, works offline
   ├─ 2. AI extraction on the server (app/api/extract) only turns words into symptom ids
   │
   ▼
3. Rules engine (lib/rules.ts)   fixed table decides RED / AMBER / GREEN
   ▼
result + why + family alert
```

**The AI never decides the result.** It only maps free text to a fixed list of symptom ids. A fixed rules table makes the decision, so the same symptoms always give the same answer.

**Built to fail safe:**
- A symptom found by either the phrase list or the AI counts.
- If the AI is unsure, fails, or the text is not understood, the result is never green.
- If the phone's own check already finds an emergency, the app does not wait for the AI.
- AI output is validated: unknown symptom ids are dropped and quotes are checked against the user's text.

## Run it

Needs Node.js 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000.

To turn on MojoAuth login, create an OIDC application in the MojoAuth dashboard, register the callback URL `http://localhost:3000/api/auth/callback/mojoauth` (and the same path on your live domain), and fill in the four `AUTH_` values in `.env.local`. Without them the sign-in option stays hidden.

To save signed-in users' plans, create a Supabase project, run `supabase/schema.sql` in its SQL Editor, and fill in `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `PLAN_ENCRYPTION_KEY` (`openssl rand -base64 32`). Without them, signed-in plans stay on the phone.

To turn on AI extraction, copy `.env.example` to `.env.local` and add a Claude API key. Without a key the app still works using the phrase list.

## Limits (please read)

- SabiCare is a prototype. It is **not clinically validated** and does not replace a doctor or midwife.
- The rules are based on the WHO danger signs in *Pregnancy, Childbirth, Postpartum and Newborn Care: a guide for essential practice* (3rd ed., 2015) and the WHO postnatal care recommendations. They were written from summaries of those documents and have not been reviewed by a clinician. A few rules are deliberately more cautious than WHO (for example, headache with swelling is treated as red).
- The 46 test messages were written by the builder alongside the phrase list, so they show the pipeline works as designed. They are not an independent accuracy study.
- The phrase list covers English and Pidgin. Hausa, Yoruba and Igbo depend on the AI and are untested.
- Voice typing uses the browser's speech recognition, which is unreliable for Nigerian accents and unavailable in some browsers.
- Typed text is sent to the AI provider (Anthropic) for extraction.
- A guest's birth plan stays in the browser's local storage. A signed-in user's plan is encrypted on the server before it is stored in Supabase, and rows are labelled with a keyed hash instead of the email. The server holds the encryption key, so this protects against a database leak, not against the app's operator. This is a prototype and has not had a security or data-protection review (for example under Nigeria's Data Protection Act 2023).

## What was built during the event

Everything in this repository was built during EvoHacks 2.0, starting from `create-next-app`.

## Credits

- Next.js, React, Tailwind CSS
- Claude API (Anthropic) for symptom extraction
- MojoAuth and Auth.js for passwordless login
- Supabase (Postgres) for encrypted saved plans
- Nunito font (Google Fonts)
- AI assistance: Claude Code was used for research, code generation, UI design and review. <!-- Edit this line to describe your own use accurately. -->
- Sources: WHO / UN MMEIG *Trends in maternal mortality 2000-2023*; WHO PCPNC guide; Cresswell et al. 2025; Thaddeus & Maine 1994.
