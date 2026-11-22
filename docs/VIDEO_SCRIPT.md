# 3-minute video script (draft)

**0:00-0:25 · Problem** (talking, or stats on screen)
"In 2023 an estimated 260,000 women died from pregnancy and childbirth. More than a quarter of them were in Nigeria. Most of those deaths were preventable. Often it starts at home: nobody recognised the danger sign, or the family decided to wait."

**0:25-0:35 · Solution in one line**
"SabiCare listens in English or Pidgin, shows her exactly why it is dangerous, and wakes up her whole family."

**0:35-1:35 · Demo 1: pregnancy**
1. Open the birth plan (already filled in). Show 5/5, week 34, next clinic visit.
2. Go to Check symptoms. Type: "my head dey pain me well well and my eye dey blur".
3. Red screen. Point at "Why this result?": her words next to the danger sign and rule number.
4. Tap "Alert my family". Show the WhatsApp message with the hospital, driver and donors.

**1:35-1:55 · Demo 2: follow-up question**
Type "I have a headache". The app asks one question. Answer yes. It turns red.
"The rules choose that question, not the AI, and only when the answer could change the result."

**1:55-2:10 · Demo 3: newborn, in Pidgin**
Switch to Pidgin, choose "My new pikin", type "baby no wan suck, body hot". Red.

**2:10-2:40 · Explain the code** (required by the rules)
Show `lib/rules.ts`. "This table decides the colour. Each rule lists the symptoms that must be present. The AI only fills in the symptom list. If the AI fails or is unsure, this line makes sure we never show green."
Show `/tests`: run it. "46 test messages, 0 missed danger signs."

**2:40-3:00 · Honest close**
"SabiCare is a prototype and is not clinically validated. Next steps are review by midwives and adding Hausa, Yoruba and Igbo. Built with Next.js, Claude and MojoAuth. Thank you."
