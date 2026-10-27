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

## Roles and security

| Role | How someone gets it | What they can do |
|---|---|---|
| Student | Creates an account | Browse, register, join clubs, chat |
| Organizer | Requests access in the app; an admin approves | Publish events, delete their own events, see attendees |
| Admin | Added by hand in the Firebase console | Everything above, plus approve or remove organizers, load the schedule, delete any event, read the activity log |

- **Roles live in the database, not the browser.** `admins/{uid}` and `organizers/{uid}`
  documents decide who can do what, and `firestore.rules` enforces it on every request.
  Nobody can make themselves an organizer or admin from the app.
- **Verified email required** for organizer requests and for any organizer or admin action.
- **Passwords** need 8+ characters with a letter and a number. Password reset by email.
- **Activity log.** Every admin action is written to `auditLog`, which can be added to but
  never edited or deleted.

### Make yourself the first admin (one time)

1. Sign in to the live site once, with Google or with a verified email account.
2. Firebase console → Authentication → Users: copy your **User UID**.
3. Firebase console → Firestore Database. Pick the database named `ai-studio-…` in the
   database dropdown. Click **Start collection**, name it `admins`.
4. Document ID: paste your UID. Add a field `email` (string) with your email. Save.
5. Reload the site. An **Admin** button appears in the top bar.

## Events in the database

All events are read from the `events` collection. In the admin console → Events, **Add
missing events** fills the schedule: 2 or 3 events a day from 30 days ago to 60 days ahead
(`src/data/eventSchedule.ts`). Ids are fixed per day (`sched-YYYY-MM-DD-n`), so running it
again only adds new days and never duplicates. Organizers' own events sit alongside them.

| Data | Where | Who can change it |
|---|---|---|
| Profile, joined clubs, saved services | `users/{uid}` | Only that person |
| Events | `events/{eventId}` | Its organizer, or an admin |
| Registrations (RSVPs) | `registrations/{eventId}__{date}__{uid}` | Only that person (admins can remove) |
| Organizer requests | `organizerRequests/{uid}` | The person asks; an admin decides |
| Roles | `admins/{uid}`, `organizers/{uid}` | Console only / admins only |
| Activity log | `auditLog/{id}` | Admins add; nobody edits |
| Discussion messages | `campus_chats/{messageId}` | Anyone signed in can post; admins can delete |

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
- **Email.** Tickets and notices are previews saved in the email center. Nothing is sent.
- **AI matching.** `/api/ai/match` exists only in the Vite dev server (`src/server`). A
  production build needs it hosted; until then the app uses the built-in keyword matcher.
- **Attendee names.** Any signed-in person can read registrations (name, major, year), which
  is what makes live counts work. Restrict this if real student data is involved.
