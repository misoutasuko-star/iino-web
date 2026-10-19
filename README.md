# iino web

The web version of iino, the coffee-themed planner. It uses the **same Supabase project, tables and accounts** as the iPhone app, so people can sign in on a computer and see the same tasks, habits, exams and study windows.

The full app spec is in [`docs/iino-spec.md`](docs/iino-spec.md).

## Run it locally

```bash
npm install
cp .env.example .env.local   # then paste the publishable key
npm run dev                  # http://localhost:5173
npm test                     # streak, beans, priority and planner tests
```

Without a key the site still works in **"Continue without an account"** mode, which keeps data in that browser only.

## Environment variables

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://nipcxvboowscqinnxgjz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The `sb_publishable_…` key from `iinos/SupabaseConfig.swift` |

Both are safe to ship in a browser. **Never** use the `service_role` / secret key.

## Deploy on Vercel

1. Import this repo at vercel.com/new. Vercel detects Vite automatically.
2. Add the two environment variables above, then deploy.
3. In Supabase → Authentication → URL Configuration:
   - set **Site URL** to the production address (e.g. `https://iinoapp.com`),
   - add `https://iinoapp.com/**`, the `*.vercel.app` address and `http://localhost:5173/**` to **Redirect URLs**.
4. To use your own domain, add it in Vercel → Settings → Domains and copy the DNS records it shows to your domain registrar.

## What's in this first version

- Sign in with Google or email (sign up, confirm, forgot password), or continue without an account.
- Today, Plan, Tasks + Exams, Habits + habit detail, Insights and Settings (account, study-window grid, week start).
- Task, habit, exam and study-time editors, the miss-reason picker, the focus timer and the "How did that feel?" sheet.
- Live updates when the phone syncs, once Realtime is switched on for the six tables in Supabase.

Not yet: Apple sign-in on the web (needs an Apple Services ID), calendar events, and reminders (the iPhone keeps sending those).
