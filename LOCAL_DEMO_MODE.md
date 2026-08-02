# MeetBeat local demo mode

This copy runs without Bilt or Supabase credentials.

- The seeded event and synthetic attendee profiles are loaded from the repository.
- Authentication, onboarding, connections and answers are stored locally.
- AI-labelled screens use the deterministic fallback already included in the app.
- No attendee API, LinkedIn scraper or external database is required.

Run:

```bash
npm install
npx expo start --web
```

Optional hosted Bilt/Supabase mode can still be enabled later by creating `.env.local`:

```text
EXPO_PUBLIC_BILT_URL=...
EXPO_PUBLIC_BILT_ANON_KEY=...
```
