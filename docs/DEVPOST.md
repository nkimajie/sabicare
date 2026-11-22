# SabiCare · Mama & Pikin: Devpost submission

## Paste notes

- **[LIVE DEMO LINK]:** replace this placeholder with the Vercel URL when it is live. It appears at the end of the story; also add the URL to Devpost's "Try it out" links.
- **MojoAuth caveat:** the sign-in redirect works, but a full real email-code sign-in had not been completed when this was written. The story says login is "built and integrated" and makes no claim beyond that. Test sign-in on the live site before submitting, because judges may try it.
- **LaTeX:** the formula uses `$$ … $$`. Check it in Devpost's preview. If it shows as raw text, delete that line and end the sentence before it with a full stop instead of a colon. The rule still reads correctly without it.
- **70% figure:** this is quoted from the WHO maternal mortality fact sheet (7 April 2025). Open the page once and confirm the quote before submitting.
- Paste everything under "Project Story" into the story field, and paste the "Built with" line into the tags field.

## Project Story

### Inspiration

Imagine Amina, an illustrative character, not a real case. At 34 weeks pregnant in Nigeria, she wakes one night with a severe headache, swollen feet and blurred vision. Her family says to wait until morning, because nobody knows these are danger signs. I built SabiCare for that night.

- About **260,000** women died from pregnancy and childbirth in 2023, and most of those deaths were preventable (WHO / UN MMEIG, 2025).
- Sub-Saharan Africa accounted for around **70%** of them (WHO maternal mortality fact sheet, 7 April 2025).
- **Nigeria** lost about **75,000** women: **28.7%** of the world total, more than any other country (UN MMEIG, 2025).
- Bleeding and hypertensive disorders cause **over 40%** of maternal deaths worldwide (Cresswell et al., *Lancet Global Health*, 2025).

So I started in Nigeria, where the need is greatest. SabiCare targets the first of the "three delays" (Thaddeus & Maine, 1994): the decision to seek care.

### What it does

*Sabi* is Pidgin for "to know". It helps a pregnant woman, new mother or her family decide quickly whether to go to hospital.

- **Three stages:** pregnant, just gave birth, or newborn.
- **Tap or type:** a tap-a-picture symptom picker, or free text in English or Pidgin.
- **RED / AMBER / GREEN:** hospital now, health worker today, or no danger sign found.
- **"Why this result?"** shows her own words next to the matched rule, such as R3: severe headache + blurred vision = RED.
- **One follow-up question,** chosen by the rules and asked only when a "yes" would raise the urgency.
- **Birth plan:** hospital, driver, two blood donors, family number and saved money give a readiness score out of 5, plus her pregnancy week and next clinic visit (WHO 8-contact schedule).
- **Family alert:** one tap opens WhatsApp or SMS, filled in from the birth plan. RED also shows a 112 call button.
- **Voice:** voice typing and read-aloud through browser APIs (not yet tested on a real device).
- **Guest first:** "Continue as guest" takes one tap and never blocks the check. Passwordless sign-in is optional.

### How we built it

1. **Phone first.** An offline English/Pidgin phrase list runs on the phone. If it finds RED, the app doesn't wait for the AI.
2. **The AI extracts.** Otherwise the server asks the Claude API (`claude-haiku-5-5`) only to map free text to symptom ids from a fixed list.
3. **Rules decide.** A deterministic table, based on WHO danger signs (PCPNC guide, 3rd ed. 2015, and WHO postnatal care recommendations), takes the most urgent rule that fired:

$$\text{level} = \max_{r \in \text{fired}} \operatorname{rank}(r), \qquad \text{GREEN} < \text{AMBER} < \text{RED}$$

Uncertainty raises GREEN to AMBER.

**Fail-safe:** a symptom found by either source counts. If the AI is unsure or fails, or the text isn't understood, the result is never GREEN. Unknown ids are dropped and quotes are checked against her text. Her message is wrapped in tags, and the model is told never to follow instructions inside them.

**Privacy:** guests' plans stay in localStorage. For signed-in users, the server encrypts the name, age and birth plan with AES-256-GCM (HKDF-derived keys, row id bound as associated data) before storing them in Supabase Postgres. Rows are keyed by an HMAC of the user id, so no emails are stored. Row-level security is on with no policies, so only the server's secret key reaches the table. Honest limit: the server holds the key, so this protects against a database leak, not against the operator.

**Stack:** Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript, Tailwind CSS v4, Nunito, Auth.js (next-auth v5) with MojoAuth as an OIDC provider (PKCE), Supabase JS client, Claude API, Vercel and GitHub. Login is built and integrated.

**Safety tests:** `/tests` runs 46 English and Pidgin messages through the real pipeline, including denials like "no bleeding". Result: 0 missed danger signs, 46 exactly right, 0 over-cautious, with the phrase list alone and with the AI on. I wrote these messages myself, so this is not an independent accuracy study.

AI coding assistance (Claude Code) was used for research, code generation, UI design and review.

### Challenges we ran into

- **Thinking block first:** with the newest Claude model, a thinking block can come before the text, so reading `content[0]` silently fell back. The fix: read the text block.
- **The AI alone under-called Amina:** for "my head dey pain me well well and my eye dey blur", it called the headache ordinary, which would give AMBER. The phrase list caught "well well" as severe. Counting either source gives RED via R3.
- **Negation:** "no bleeding yesterday, today I dey bleed" must still count.
- **Login:** MojoAuth's sign-up required a work email. OIDC in Auth.js v5 needed PKCE and `client_secret_post`.
- **Encryption:** the database must never see plaintext or emails.
- **Cache Components:** Next.js 16 API routes needed `connection()` to stay dynamic.
- **Scope:** keeping AI out of the decision while still reading free text, against a same-day deadline.

### Accomplishments that we're proud of

- The AI never picks the colour, and every AI error, timeout or "unsure" lands on the cautious side.
- 0 missed danger signs on my own test set, with and without the AI.
- Encrypted save, load and delete were tested end to end, with no emails stored.

### What we learned

- **AI for language, rules for decisions.** A model reads messy Pidgin well. A rules table can be tested and reviewed by a clinician.
- **Two imperfect readers cover each other's gaps,** as "well well" showed.
- **Honesty is part of safety.** This is a prototype, not clinically validated. No clinician has reviewed the rules, and some are deliberately more cautious than WHO. Hausa, Yoruba and Igbo are untested and depend on the AI.

### What's next for SabiCare: Mama & Pikin (Mom & Child)

SabiCare is built for Africa, starting in Nigeria, and designed to scale to the world. The WHO-based rules stay the same; only the language, emergency number and clinic schedule change.

1. **Now: Nigeria.** English and Pidgin, with Hausa, Yoruba and Igbo next.
2. **Next: sub-Saharan Africa.** Swahili, French and Amharic, with local emergency numbers.
3. **Vision:** South Asia, and anywhere families decide alone.

I also plan:

- a clinician review of the rules
- testing with real users and community health workers
- an offline PWA, plus USSD/SMS for feature phones
- a per-country config: emergency number, phone country code, languages and clinic schedule
- a real security review

**Try it:** [LIVE DEMO LINK]

## Built with

next.js, react, typescript, tailwindcss, node.js, turbopack, claude-api, anthropic, auth.js, mojoauth, openid-connect, oauth, supabase, postgresql, vercel, github, web-speech-api, whatsapp, html5, css3, google-fonts
