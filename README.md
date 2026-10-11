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

## What is shared between people

Everything below lives in Firebase, so it is the same for every account on every device.

| Data | Where | Who can change it |
|---|---|---|
| Accounts | Firebase Authentication | The person |
| Profile, joined clubs, saved services | `users/{uid}` | Only that person |
| Events organizers publish | `events/{eventId}` | Only the organizer who published it |
| Registrations (RSVPs) | `registrations/{eventId}__{date}__{uid}` | Only that person |
| Discussion messages | `campus_chats/{messageId}` | Anyone signed in can post |

The "going" number on an event is its starting number plus real registrations, and it
updates live for everyone. Organizers see who registered under Post event > Attendees.
The built-in sample events (`src/data/mockEvents.ts`) are not in the database, but
registrations for them are.

## Put it online

One-time setup:

```bash
npm install -g firebase-tools
firebase login
```

In the [Firebase console](https://console.firebase.google.com), open the project and check
that Authentication has Email/Password and Google turned on.

Every time you want to publish:

```bash
npm run deploy
```

That builds the app and uploads the site and the database rules. The command prints your
public link, `https://campus-connect-825d2.web.app`. Firebase Hosting domains are already
authorized for sign-in. If you host anywhere else, add that domain under
Authentication > Settings > Authorized domains.

## Before a real launch

- **Sample data.** Clubs, services and the starter events come from `src/data`. The starter
  events run on a repeating five-day schedule so there is always something on today.
- **Organizer role.** The passcode check runs in the browser. Move the role to a Firebase
  custom claim and enforce it in `firestore.rules`.
- **Email.** Tickets and notices are previews saved in the email center. Nothing is sent.
- **AI matching.** `/api/ai/match` exists only in the Vite dev server (`src/server`). A
  production build needs it hosted; until then the app uses the built-in keyword matcher.
- **Attendee names.** Any signed-in person can read registrations (name, major, year), which
  is what makes live counts work. Restrict this if real student data is involved.
