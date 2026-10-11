# CampusConnect

Events, clubs and student services for Vellore Institute of Technology, in one place.
React 19, Vite, Tailwind CSS 4 and Firebase (sign-in, profiles, live discussions).

## Run it

```bash
npm install
cp .env.example .env.local   # then add your GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

Other commands: `npm run build`, `npm run lint` (type check), `npm test` (time logic).

## How time works

Every date and time goes through `src/utils/campusTime.ts`.

- **Campus time zone.** An event's `date` and `startTime` are wall-clock time on campus
  (Asia/Kolkata). They are converted to an exact instant, so the event starts at the same
  moment for everyone. Viewers in another time zone see times labelled `IST`.
- **Clock correction.** `syncClock()` compares the device clock with the server's `Date`
  header and corrects for the difference, so countdowns are right on a device whose clock is off.
- **One ticker.** `useNow()` (`src/hooks/useNow.ts`) gives every component the same "now".
  It ticks on 30-second boundaries, pauses in a hidden tab and catches up when the tab returns.
- **Nothing is stored as a label.** "Today", "Starts in 2h", "Live", "3m ago" and
  "Open until 9 PM" are computed from that clock each time they are shown.
- **Calendar export** (`src/services/calendarService.ts`) writes UTC instants with a UID,
  so events land correctly in Google Calendar, Outlook and Apple Calendar.

## Design system

Tokens, motion and dark mode live in `src/index.css`.

- Colour: `ink-*` (neutrals), `brand-*` (ultramarine), Tailwind `amber-*` as the marigold accent.
- Type: Bricolage Grotesque for headings (`font-display`), Hanken Grotesk for text.
- Dark mode: the `dark` class on `<body>` remaps the colour scales, so components need no
  `dark:` variants. Wrap anything that must keep fixed colours in `.cc-static`.
- Motion: `.cc-page`, `.cc-dialog`, `.cc-stagger`, `.cc-card`, `.cc-reveal`. All of it is
  disabled for people who ask for reduced motion.

## Before a real launch

- **Sample data.** Events, clubs and services come from `src/data`. The sample events run on
  a repeating five-day schedule so there is always something on today. Replace with your database.
- **Organizer role.** The passcode check runs in the browser. Move the role to a Firebase
  custom claim and enforce it in `firestore.rules`.
- **Email.** Tickets and notices are previews saved in the email center. Nothing is sent.
- **AI matching.** `/api/ai/match` exists only in the Vite dev server (`src/server`). A
  production build needs it hosted; until then the app uses the built-in keyword matcher.
- **Database rules.** Deploy `firestore.rules` with `firebase deploy --only firestore:rules`.
