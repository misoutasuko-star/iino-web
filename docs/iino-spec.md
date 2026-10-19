# iino — complete app specification

This folder describes the whole iino iPhone app: what it does, every screen, what people type in and what they see, every rule (streaks, beans, planning), the database, sign-in and sync, and the design. It's written so you can paste it into Claude (or give it to any developer) and build a **web version that shares the same account and data** as the iPhone app.

## Files

| File | What's inside |
|---|---|
| [01-overview.md](01-overview.md) | What iino is, the five tabs, main user journeys, a map of inputs → outputs |
| [02-data-model.md](02-data-model.md) | Every kind of data (tasks, habits, logs, exams, study windows), every field, the enums, and the Supabase database tables |
| [03-business-logic.md](03-business-logic.md) | The rules: daily-repeating tasks, check-offs, streaks, freezes, rest days, weekly goals, milestones, beans and levels, priority scoring, exam boosts, the day planner |
| [04-screens.md](04-screens.md) | Every screen and sheet: what's shown, every button, every input, and what each one changes |
| [05-accounts-and-sync.md](05-accounts-and-sync.md) | Sign-in (Apple, Google, email), Supabase setup, how the phone syncs, and the rules a web app must follow so both stay in step |
| [06-notifications-calendar-focus.md](06-notifications-calendar-focus.md) | Reminders, calendar integration, the focus timer and difficulty feedback |
| [07-design-system.md](07-design-system.md) | Coffee theme: colors (light and dark), fonts, cards, buttons, illustrations, copy tone |
| [08-function-reference.md](08-function-reference.md) | File-by-file list of every type and function in the Swift code, and what it does |
| [09-web-app-guide.md](09-web-app-guide.md) | How to build the web version: recommended stack, compatibility checklist, and a ready-to-paste prompt for Claude |

## Quick facts

- **Platform:** iOS 26, SwiftUI + SwiftData (on-device database), Xcode 26.
- **Backend:** Supabase (Postgres + Auth). Project URL `https://nipcxvboowscqinnxgjz.supabase.co`. The publishable key is in `iinos/SupabaseConfig.swift`; it's safe to use in a browser. **Never** put the `service_role`/secret key in any app or website.
- **Version:** 2.0 (build 1).
- **Source:** `iinos/` (app), `iinosTests/` (22 tests), `supabase/` (SQL setup).

## How to use this with Claude

1. Start a new chat (or a Claude Project and upload this folder as project knowledge).
2. Paste the files in order, `01` → `09`, or just upload them all.
3. Then paste the prompt at the bottom of `09-web-app-guide.md`.


---

# 1. Overview

## What iino is

iino is a cozy, coffee-themed planner for students and anyone building routines. It combines four ideas:

1. **Tasks that repeat daily until finished.** A task like "Revise chapter 4" or "Work on science project" shows up every day. You check it off each day you work on it. When it's completely done, you mark it **finished** and it stops coming back.
2. **Habits with strict-but-fair streaks.** Routines like "Work out" or "Read 20 minutes". Each day a habit is due you must check it off or the streak ends. Freezes, rest days and weekly goals keep it realistic.
3. **Exams that boost priority.** Adding an exam moves tasks in the same subject/category up your list during the 7 days before it.
4. **An automatic day plan.** iino fits your tasks into your study windows, around your calendar events, most urgent first.

Everything you do earns **beans** (points), which level you up from *Green Bean* to *Master Barista*. Streaks and beans are always **calculated from history**, never stored, so they can't drift and can later power public leaderboards.

The long-term goal: public accounts where people compete on streaks and beans.

## Navigation

A tab bar with five tabs:

| Tab | Icon (SF Symbol) | Purpose |
|---|---|---|
| **Today** | `cup.and.saucer` | Home: greeting, today's progress "brew" cup, up-next task, one notice, day bar, today's tasks and habits |
| **Plan** | `calendar.day.timeline.left` | Visual timeline of the day with a 7-day week strip |
| **Tasks** | `checklist` | All tasks (to do / done today / finished) and a toggle to Exams |
| **Habits** | `flame` | All habits with streak cups, weekly beans, rest/miss actions; tap for details |
| **Insights** | `chart.bar.xaxis` | Beans and level, 4-week heat grid, streak board, "noticed this week" tips |

**Settings** is not a tab. It opens as a sheet from the gear on Today (or "Edit"/"Set" on Plan's study-windows line).

**Add** (+ on Today) offers New Task, New Habit, New Exam. Tasks and Habits tabs have their own + buttons.

A **celebration toast** slides down from the top for milestones, freezes earned, weekly goals and finished tasks (auto-hides after 3 s, tap to dismiss).

## First launch

1. **Onboarding tour** (full screen, 3 pages + Skip): Welcome → How iino works (Tasks, Habits & streaks, Exams, Plan, Beans) → Permissions (Calendar, Reminders, both optional).
2. **Sign-in screen**: Continue with Apple, Continue with Google, or email + password (sign in / create account), or **Continue without an account** (data stays on the phone).
3. People who used iino before accounts existed see the sign-in screen once on their next launch.

## Main user journeys

### Add and work on a task
1. + → New Task → type title, pick category, priority, time per session (5–480 min), optional due date, notes → **Add**.
2. The task appears on Today and Tasks, sorted by priority score, and is placed into the Plan.
3. Each day: tap the circle to check it off for today (+5 beans), or tap **Brew** / swipe → Focus to run a focus timer. Finishing the timer checks it off and asks "How did that feel?" (adjusts future session length).
4. When it's done for good: swipe → **Finish** or Edit → **Mark as finished** (+20 beans). It moves to the collapsible *Finished* list. It can be restored.

### Keep a habit streak
1. + → New Habit → title, category, **On set days** (pick weekdays) or **Times a week** (1–7), reminder on/off and time → **Add**.
2. Each due day, tap the check (+10 beans). The streak cup fills and steams.
3. Can't do it? Long-press → **Take a rest day** (once a week, streak safe) or **I missed today** → pick a reason (a freeze saves the streak if you have one).
4. Milestones at 3, 7, 14, 30, 50, 100, 200, 365 give a celebration and bonus beans (milestone × 5).

### Prepare for an exam
1. + → New Exam → subject, category, date, notes.
2. From 7 days before, tasks with the same category get boosted up the list and into the Plan first. Reminders arrive 3 days and 1 day before. Today shows a notice within 3 days.

### Plan the day
1. Settings → Study windows: tap the week grid to add time blocks (e.g. Mon–Fri 4–6 PM).
2. Plan tab shows tasks placed into those windows around calendar events, with a "now" line. Tap a task block → Start focus / Check off / Edit.
3. Tasks that didn't fit are listed under *Didn't fit*.

### Sync across devices
Sign in once on each device. Every change syncs automatically (2 s after a change, when the app opens, and every 60 s). Settings → Account shows status and **Sync now**.

## Inputs → outputs map

| What the user does (input) | What changes (stored) | What they see (output) |
|---|---|---|
| Create/edit task | `tasks` row | Task in Today, Tasks, Plan; due reminders |
| Check off task today | `task_logs` row (date = now, completed = true) | Check filled, moves to "Done today", brew cup fills, +5 beans |
| Uncheck task | Today's `task_logs` row deleted | Back to "To do today", −5 beans |
| Finish task | `tasks.finished_at` = now | Toast "Task finished · +20 beans", moves to Finished |
| Restore finished task | `tasks.finished_at` = null | Back in active lists |
| Delete task | Task and its logs deleted | Gone everywhere, beans recalculated |
| Focus session completes | Task check-off for today | Pour-over animation done, notification, feedback sheet |
| Feedback Too Easy / Too Hard | `estimated_minutes` −10 (min 10) / +15 (max 480), `difficulty_feedback` | Shorter/longer next session and plan block |
| Create/edit habit | `habits` row | Habit in Habits (Today or Other days), Today if due, reminders |
| Check off habit | `habit_logs` row (completed = true) | Streak +1, cup full, +10 beans, possible milestone/freeze toast |
| Uncheck habit | Today's `habit_logs` rows deleted | Streak back |
| Rest day | `habit_logs` row (completed = false, miss_reason = "Rest Day") | Moon icon, streak safe |
| Missed with reason | `habit_logs` row (completed = false, miss_reason = reason) | Streak ends or a freeze is used, reason counted in Insights |
| Create/edit exam | `exams` row | Exam list, boosted tasks, notice, reminders |
| Add/edit study window | `work_windows` row(s) | Week grid in Settings, Plan timeline, week strip dot |
| Grant calendar access | (on-device permission) | Calendar events in Plan and the day bar; plan avoids them |
| Grant notifications | (on-device permission) | Reminders scheduled |
| Sign in / out / delete account | Supabase auth user, `profiles` | Sync on/off; delete removes all cloud data |
| Set display name | `profiles.display_name` | Shown in Settings (future leaderboards) |


---

# 2. Data model

There are six kinds of stored data, plus a profile per account. On the phone they live in SwiftData (`iinos/Models.swift`); in the cloud they're Supabase tables (`supabase/schema.sql`). The names differ slightly (Swift camelCase vs SQL snake_case) — both are listed.

**Nothing derived is stored**: streaks, freezes, beans, levels, priority scores and plans are calculated on the fly from these records (see `03-business-logic.md`).

## Conventions (important for a web app)

- **IDs** are UUIDs generated by the client (the phone or web app), not by the database. Use `crypto.randomUUID()` on the web.
- **Dates** are stored as `timestamptz` (an exact instant). "Which day" is always decided in the **user's local time zone**.
  - Task `due_date` and exam `exam_date` are saved as **local midnight** (start of day) of the chosen date.
  - Log `date` is the **moment** the check-off happened (e.g. 2026-10-19 21:14 local).
- **Weekdays** are numbers **1 = Sunday, 2 = Monday … 7 = Saturday** (Apple's convention). In JavaScript: `date.getDay() + 1`.
- **Weeks** (for rest days, weekly goals, "this week" beans) follow the device locale's first day of the week (Sunday in US/Japan, Monday in much of Europe). A web app should use the same first weekday (Sunday is the safe default, or let the user choose).
- **Enum values** are stored as their exact display strings (e.g. `"Medium"`, `"Rest Day"`). Never rename them.
- **Soft deletes**: in the cloud, rows are not removed — `deleted_at` is set. Clients must ignore rows where `deleted_at is not null`.
- **`updated_at`** is set by a server trigger on every insert/update. Don't send it.
- **`user_id`** defaults to `auth.uid()`; the phone sends it explicitly. Row Level Security only allows each user their own rows.

---

## Task — `IITask` / table `tasks`

A piece of work that repeats every day until finished.

| Swift | SQL column | Type | Default | Meaning |
|---|---|---|---|---|
| `id` | `id` | UUID | new | Primary key |
| — | `user_id` | uuid | `auth.uid()` | Owner |
| `title` | `title` | text | `""` | What to work on |
| `category` | `category` | TaskCategory | `"Other"` | Subject, links to exams |
| `dueDate` | `due_date` | date/timestamptz? | null | Optional due date (local midnight) |
| `priority` | `priority` | Priority | `"Medium"` | High / Medium / Low |
| `estimatedMinutes` | `estimated_minutes` | int | 30 | "Time per session", 5–480 in steps of 5 (feedback can make it 10–480) |
| `notes` | `notes` | text | `""` | Free text |
| `difficultyFeedback` | `difficulty_feedback` | DifficultyFeedback? | null | Last focus-session feedback |
| `createdAt` | `created_at` | timestamptz | now | Tie-breaker in sorting |
| `finishedAt` | `finished_at` | timestamptz? | null | Set when marked finished; null = active |
| `completionLogs` | (task_logs.task_id) | [TaskLog] | [] | One log per day worked on; deleted with the task |
| — | `updated_at`, `deleted_at` | timestamptz | | Sync metadata |

**Derived (not stored):**
- `isFinished` = `finishedAt != null`
- `isCompletedToday` = any completed log whose date is today
- `totalCompletions` = number of completed logs
- `daysUntilDue` = whole calendar days from today to due date (0 = today, negative = overdue)
- `isOverdue` = not finished and `daysUntilDue < 0`

## Task log — `TaskLog` / table `task_logs`

One entry for each day a task was checked off.

| Swift | SQL | Type | Default | Meaning |
|---|---|---|---|---|
| `id` | `id` | UUID | new | |
| — | `user_id` | uuid | auth.uid() | |
| `task` | `task_id` | → tasks.id | required | Parent task |
| `date` | `date` | timestamptz | now | When it was checked off |
| `completed` | `completed` | bool | true | Always true in practice |
| — | `updated_at`, `deleted_at` | | | |

Rule: at most **one log per task per local day**. Unchecking deletes today's log(s).

## Habit — `IIHabit` / table `habits`

| Swift | SQL | Type | Default | Meaning |
|---|---|---|---|---|
| `id` | `id` | UUID | new | |
| — | `user_id` | uuid | auth.uid() | |
| `title` | `title` | text | `""` | e.g. "Work out for 30 minutes" |
| `category` | `category` | TaskCategory | `"Other"` (editor defaults to Health) | |
| `repeatDays` | `repeat_days` | int[] | `{1,2,3,4,5,6,7}` | Due weekdays (1 = Sun). Sorted. Never empty (empty → all days) |
| `reminderHour` | `reminder_hour` | int | 20 | 0–23 |
| `reminderMinute` | `reminder_minute` | int | 0 | 0–59 |
| `remindersEnabled` | `reminders_enabled` | bool | true | |
| `weeklyTarget` | `weekly_target` | int | 0 | 0 = "On set days" (uses repeatDays). 1–7 = "Times a week", any days |
| `createdAt` | `created_at` | timestamptz | now | Start of tracking |
| `logs` | (habit_logs.habit_id) | [HabitLog] | [] | |
| — | `updated_at`, `deleted_at` | | | |

**Derived:**
- `isWeeklyGoal` = `weeklyTarget > 0`
- `isScheduled(day)` = weekly goal **or** weekday(day) ∈ repeatDays
- `log(on: day)` = that day's log, preferring a completed one
- `isCompletedToday` = today's log is completed
- `missedToday` = today's log exists, not completed, reason ≠ Rest Day
- `isRestingToday` = today's log reason = Rest Day
- `canRestToday` = not a weekly goal, due today, nothing logged today, and no rest day yet this calendar week
- `completedDayStarts` = set of local days with a completed log
- `restDayStarts` = set of local days with a not-completed log whose reason is Rest Day
- `trackingStart` = start of day of the earlier of `createdAt` and the earliest log
- `scheduleDescription` = "Once a week" / "N times a week" / "Every day" / "Weekdays" (Mon–Fri) / "Weekends" (Sat+Sun) / "Mon, Wed, Fri" (in the locale's week order)
- `reminderText` = e.g. "8:00 PM"

## Habit log — `HabitLog` / table `habit_logs`

| Swift | SQL | Type | Default | Meaning |
|---|---|---|---|---|
| `id` | `id` | UUID | | |
| — | `user_id` | uuid | auth.uid() | |
| `habit` | `habit_id` | → habits.id | required | |
| `date` | `date` | timestamptz | | Moment logged |
| `completed` | `completed` | bool | true | true = done; false = missed or rest |
| `missReason` | `miss_reason` | MissReason? | null | Only when not completed |

Rule: **at most one log per habit per local day.** Checking off reuses today's log (sets completed = true, reason = null) and deletes extras. Unchecking deletes all of today's logs. Missing/resting reuses today's log (completed = false, reason = X).

## Exam — `IIExam` / table `exams`

| Swift | SQL | Type | Default | Meaning |
|---|---|---|---|---|
| `id` | `id` | UUID | | |
| — | `user_id` | | | |
| `subject` | `subject` | text | `""` | e.g. "Biology midterm" |
| `category` | `category` | TaskCategory | `"Other"` (editor defaults to Math) | Which tasks get boosted |
| `examDate` | `exam_date` | timestamptz | | Local midnight of the exam day |
| `notes` | `notes` | text | `""` | |
| `createdAt` | `created_at` | timestamptz | now | |

**Derived:** `daysUntilExam` (calendar days from today), `isUpcoming` = `daysUntilExam >= 0`.

## Study window — `WorkWindow` / table `work_windows`

A weekly repeating block of study time.

| Swift | SQL | Type | Default | Meaning |
|---|---|---|---|---|
| `id` | `id` | UUID | | |
| — | `user_id` | | | |
| `weekday` | `weekday` | int 1–7 | 2 (Mon) | Check constraint 1–7 |
| `startHour`, `startMinute` | `start_hour`, `start_minute` | int | 16, 0 | |
| `endHour`, `endMinute` | `end_hour`, `end_minute` | int | 18, 0 | Must be after start (same day) |

**Derived:** `startMinutes`, `endMinutes`, `durationMinutes` (≥ 0), `label` ("4:00 PM – 6:00 PM"). Windows have no `created_at`.

## Profile — table `profiles` (cloud only)

| Column | Type | Meaning |
|---|---|---|
| `id` | uuid PK → auth.users | Same as the user id |
| `display_name` | text | Auto-filled from `full_name` metadata on sign-up (Google), or from Apple's name on first Apple sign-in, or typed in Settings |
| `created_at`, `updated_at` | timestamptz | |

Created automatically by the `on_auth_user_created` trigger. RLS: you can read/edit only your own profile (leaderboards will need a public view later).

## Enums (stored as these exact strings)

**TaskCategory** — used by tasks, habits, exams. Each has an icon (SF Symbol) and a color (see design system).

| Value | Icon |
|---|---|
| `Math` | function |
| `Science` | atom |
| `English` | book |
| `History` | clock.arrow.circlepath |
| `Language` | globe |
| `Health` | figure.walk |
| `Personal` | person |
| `Project` | folder |
| `Other` | circle.grid.2x2 |

**Priority**: `High`, `Medium`, `Low`.

**DifficultyFeedback**:

| Value | Emoji | Effect |
|---|---|---|
| `Too Easy` | 😌 | "Next session will be 10 minutes shorter" (min 10) |
| `Okay` | 👍 | "Keep the same length" |
| `Too Hard` | 😮‍💨 | "Next session will be 15 minutes longer" (max 480) |

**MissReason** (with the tip shown in Insights / habit detail when it's the most common):

| Value | Tip |
|---|---|
| `Forgot` | Try a reminder at a time you're usually free. |
| `No Time` | Try a smaller version. Even 5 minutes keeps the habit going. |
| `Too Hard` | Make it easier for now and build back up. |
| `Didn't Care` | Check whether this habit still matters to you. |
| `Other` | Notice what got in the way, then adjust the plan. |
| `Rest Day` | Rest is part of the routine. *(not offered as a miss reason; it's the rest-day marker)* |

## Database setup (full SQL)

Run once in Supabase → SQL Editor. Source: `supabase/schema.sql` and `supabase/002_delete_account.sql`.

- Function `set_updated_at()` trigger on every table (sets `updated_at = now()` before update).
- Table `profiles` + trigger `handle_new_user()` after insert on `auth.users`.
- Tables `tasks`, `task_logs` (FK task_id → tasks on delete cascade), `habits`, `habit_logs` (FK habit_id → habits on delete cascade), `exams`, `work_windows`.
- Every table references `auth.users(id) on delete cascade` through `user_id`.
- RLS enabled everywhere. Policy **"Own rows only"** for all operations to `authenticated`: `user_id = auth.uid()` (using + with check). Profiles: `id = auth.uid()`.
- Indexes `(user_id, updated_at)` on each data table, plus `task_logs(task_id)`, `habit_logs(habit_id)`.
- RPC `delete_my_account()` — `security definer`, deletes `auth.users where id = auth.uid()`; executable only by `authenticated`. Cascades delete everything.

Note: `updated_at` on insert comes from the column default `now()`; on update from the trigger.


---

# 3. Business logic (the rules)

These rules must work **identically** on every platform, or the phone and web app will show different streaks and beans for the same data. Source files: `Models.swift`, `Streaks.swift`, `SchedulingEngine.swift`. Tests for them: `iinosTests/iinosTests.swift`.

"Day" always means a **local calendar day** (midnight to midnight in the user's time zone). "Week" means the calendar week using the locale's first weekday.

---

## 3.1 Tasks: check-off and finish

- **Active** task: `finished_at` is null. It appears every day.
- **Check off today** (`setCompletedToday(true)`): if a log for today exists, make sure it's `completed = true`; otherwise insert a new log `{date: now, completed: true}`.
- **Uncheck today** (`setCompletedToday(false)`): delete all of today's logs for that task.
- **Finish** (`finish()`): set `finished_at = now` and show the toast *"Task finished · {title} · +20 beans"*. Finished tasks stop appearing in to-do lists and the plan.
- **Restore**: set `finished_at = null`.
- **Delete**: removes the task and all its logs.
- **Only today can be checked off.** There's no UI to back-fill past days.

## 3.2 Habits: check-off, miss, rest

- **Toggle today** (`toggleToday`): if completed today → uncheck (delete today's logs). Otherwise check off: reuse today's log if any (completed = true, miss_reason = null, delete extra logs today) or insert `{date: now, completed: true}`. After checking off, celebrate (in this priority order, only one):
  1. If the streak went up and the new value is a milestone → 🏆 *"{n}-day streak!"* / *"{n}-week streak!"*, message *"{title} · +{n×5} beans"*.
  2. Else if freezes went up → ❄️ *"You earned a streak freeze"* / *"It saves your streak if you miss a day."*
  3. Else if weekly goal and the week just became done → ☕ *"Weekly goal reached"* / *"{title}"*.
- **Log a miss** (`logMissToday(reason)`): reuse today's log (completed = false, miss_reason = reason; delete extras) or insert `{date: now, completed: false, miss_reason: reason}`. A miss is **settled immediately** (doesn't wait for midnight). The user can still tap "I did it after all" which turns it into a check-off.
- **Rest day** = `logMissToday("Rest Day")`. Allowed only when `canRestToday` (day-based habit, due today, nothing logged today, no rest day used yet this week). Not available for weekly-goal habits.

## 3.3 Streaks

Calculated by `IIHabit.streakReport(now)` → `StreakReport`. Weekly-goal habits (`weekly_target > 0`) use the weekly algorithm; others use the daily algorithm.

### Constants
- `freezeEvery = 7` — every 7 completed due-days in a row earns a freeze
- `maxFreezes = 2`
- `milestones = [3, 7, 14, 30, 50, 100, 200, 365]`

### StreakReport fields
| Field | Meaning |
|---|---|
| `current` | Current streak length (days or weeks) |
| `longest` | Best streak ever |
| `unit` | `days` or `weeks` |
| `state` | `done`, `atRisk`, `frozen`, `ready`, `ended(n)`, `resting` |
| `freezes` | Freezes in hand (0–2) |
| `frozenDays` | Past due days saved by a freeze |
| `missedDays` | Past due days missed and not saved |
| `weekDone`, `weekTarget` | Weekly habits: days done this week / target |
| `nextMilestone` | First milestone > current (null after 365) |
| `earnedMilestones` | Milestones ≤ longest |
| `milestoneProgress` | (current − previous milestone) / (next − previous), 1 if none left |

### Daily algorithm (day-based habits)

```
done  = set of days with a completed log
rest  = set of days with a "Rest Day" log
today = start of today
run = 0; sinceEarned = 0; freezes = 0; longest = 0; lastEnded = null

complete():
    run += 1; sinceEarned += 1; longest = max(longest, run)
    if sinceEarned == 7: freezes = min(2, freezes + 1); sinceEarned = 0

miss(day) -> savedByFreeze:
    if run > 0 and freezes > 0: freezes -= 1; frozenDays.add(day); return true
    if run > 0: lastEnded = (run, day)
    missedDays.add(day); run = 0; sinceEarned = 0; return false

# Closed days: every day from trackingStart up to (not including) today
for day in trackingStart ..< today:
    if isScheduled(day) and day not in rest:
        if day in done: complete() else: miss(day)

# Today
if not isScheduled(today) or today in rest:   state = resting
elif today in done:                            complete(); state = done
elif there is a log today (a miss):            before = run; state = miss(today) ? frozen : ended(before)
elif run > 0:                                  state = atRisk
elif lastEnded and days(lastEnded.day → today) <= 3:  state = ended(lastEnded.length)
else:                                          state = ready
if state == ended(0): state = ready
current = run
```

Notes:
- Days the habit isn't due, and rest days, are skipped (don't help or hurt).
- A frozen day keeps `run` unchanged (doesn't add 1).
- Freezes only exist while a streak is running; a miss with no run doesn't use one.
- An unlogged *today* never breaks the streak — it becomes `atRisk` until midnight; then it's a closed missed day on the next calculation.

### Weekly algorithm (weekly-goal habits)

```
firstWeek = calendar week containing trackingStart
thisWeek  = calendar week containing now
count(week) = number of distinct done days inside week
run = 0; endedLastWeek = null

for each week from firstWeek up to (not including) thisWeek:
    endedLastWeek = null
    if count(week) >= target: run += 1; longest = max(longest, run)
    elif week != firstWeek:            # a short first (partial) week doesn't end anything
        if run > 0: endedLastWeek = run
        run = 0

weekDone = count(thisWeek)
if weekDone >= target:  run += 1; longest = max(longest, run); state = done
elif run > 0:           state = atRisk
elif endedLastWeek:     state = ended(endedLastWeek)
else:                   state = ready
current = run
```
Weekly habits have no freezes and no rest days.

### State → message (shown in habit detail)
| State | Daily | Weekly |
|---|---|---|
| done | Done for today. The cup is full. | This week's goal is done. The cup is full. |
| atRisk | Still open today. Keep your streak warm before midnight. | {done} of {target} this week. Keep it brewing. |
| frozen | A freeze saved your streak today. | — |
| ready | Start a streak today. | {done} of {target} this week. |
| ended(n) | Your {n}-day streak ended. Start fresh today. | Your {n}-week streak ended. Start fresh today. |
| resting | Resting today. Your streak is safe. | — |

Labels: "day"/"days", "week"/"weeks" (singular when count == 1).

## 3.4 Beans (points) and levels

```
perHabitCheckIn = 10      # per distinct completed day
perTaskCheckIn  = 5       # per completed task log
perFinishedTask = 20      # once per finished task
milestoneBonus(m) = m * 5 # for each milestone ≤ longest streak

total = Σ tasks (completions × 5 + (finished ? 20 : 0))
      + Σ habits (completedDays × 10 + Σ earnedMilestones × 5)

thisWeek = (completed task logs this week × 5) + (habit completed days this week × 10)
           # milestone bonuses not included
```

Levels (name, beans needed):

| Level | Beans |
|---|---|
| Green Bean | 0 |
| Light Roast | 150 |
| Medium Roast | 400 |
| Dark Roast | 900 |
| Espresso | 1800 |
| Master Barista | 3500 |

`level(beans)` → current level name, progress = (beans − floor) / (next − floor), and next level (null at the top). UI: "{next − total} to {next name} · +{thisWeek} this week" or "Top roast reached · +{thisWeek} this week".

Because beans come from history, deleting a task removes its beans; unchecking removes them.

## 3.5 Priority score (`PriorityEngine`)

```
score = 0
if dueDate:
    days = daysUntilDue
    score += (days < 0) ? 80 : (14 - min(days, 14)) * 5      # due today = 70, in 14+ days = 0
score += { High: 25, Medium: 12, Low: 0 }[priority]
if boostingExam:
    score += (7 + 1 - exam.daysUntilExam) * 5                 # exam today = 40, in 7 days = 5
```

- `boostingExam(task)`: for an unfinished task, the nearest exam with the **same category** whose `daysUntilExam` is 0…7.
- `sorted(tasks)`: highest score first; ties → older `createdAt` first.
- Used everywhere tasks are listed (Today, Tasks "To do today", Plan, Up next), so they always agree.

## 3.6 Day planner (`SchedulingEngine.plan`)

Inputs: tasks, exams, calendar events for the day, study windows, `day`, `now`.

```
bufferMinutes = 10, minimumBlockMinutes = 15
isToday = day is today
windows = study windows whose weekday == weekday(day) and duration > 0, sorted by start
if none: windows = [08:00–22:00]; usesDefaultWindow = true

occupied = calendar events (start, end)
pending  = PriorityEngine.sorted( tasks where not finished and (not isToday or not completed today) )
earliestStart = isToday ? now rounded UP to next 5 minutes : start of day

for window in windows:
    cursor = max(window.start, earliestStart)
    for task in pending not yet placed:
        if cursor >= window.end: break
        minutes = max(task.estimatedMinutes, 15)
        slot = nextFreeSlot(cursor, minutes, occupied, window.end)
        if no slot: continue          # a shorter task further down might still fit
        add task block (slot)
        occupied += (slot.start, slot.end + 10 min buffer)
        cursor = slot.end + 10 min

add every calendar event with end > earliestStart as an event block
blocks sorted by start
unscheduled = pending tasks not placed
```

`nextFreeSlot(start, minutes)`: candidate = start; repeat up to 96 times: if candidate+duration > windowEnd → none; if it overlaps any occupied interval, jump candidate to the latest end among overlaps; else return it.

`visibleRange`: from the earliest window/block start (rounded down to the hour) to the latest end (rounded up to the hour), minimum 1 hour; fallback 08:00–22:00.

Plans are **never stored** — recomputed every time, so they're never stale. Future days are a preview using current tasks (nothing is checked off on future days).

## 3.7 Insights calculations

- **Heat grid**: last 4 calendar weeks (28 days, starting 3 weeks before this week's start). Count per day = completed task logs + habit completed days. Colors: 0 → latte fill, 1–2 → milk, 3–4 → crema, 5+ → espresso. Future days are empty outlines; today has a primary-colored outline.
- **Streak board**: habits sorted by current streak desc, then longest desc. Shows rank, cup, title, "Best n days", current + "d"/"wk".
- **Noticed this week** (each shown only if it applies):
  - *Most practiced: {category}* — category with the most completed task logs in the last 7 days. "{n} check-in(s) this week. Lovely consistency."
  - *{habit} needs some warmth* — habit with the lowest last-7-day consistency below 70%. "Done on {p}% of its days this week. A smaller version still counts." Consistency = done due days ÷ due days in the last 7 days (excluding rest days, before trackingStart, and today unless done). For weekly habits: min(weekDone, target) ÷ target.
  - *Most common reason for missing: {reason}* — with that reason's tip.

## 3.8 Today screen summaries

- **Brew cup progress** = (tasks done today + due habits done today) ÷ (active tasks + habits due today).
  Message: 0 → "Just putting the kettle on", <50% → "Brewing nicely", <100% → "Almost a full cup", 100% → "A full cup. Enjoy your day" (cup steams).
- **Up next** = first task in priority order not yet done today.
- **Notice** (only one, first match wins):
  1. An exam within 0–3 days → "{subject} {today/tomorrow/in n days}. {Category} tasks are moved up." (tap → edit exam)
  2. Overdue tasks → "{title} is overdue." or "{n} tasks are overdue." (tap → edit first)
  3. A habit due today, `atRisk` with current ≥ 3 → "Keep your {n}-day {title} streak warm today." (tap → habit detail)
- **Greeting**: 5–11 "Good morning", 12–17 "Good afternoon", else "Good evening".

## 3.9 Text helpers

- `relativeDayText(d)`: 0 "today", 1 "tomorrow", −1 "yesterday", >1 "in d days", else "{−d} days ago".
- `durationText(min)`: "45 min", "1 hr, 30 min".
- `timeOfDayText(h, m)`: locale short time, e.g. "8:00 PM".
- Task row meta (joined with " · "): if finished → "Finished Oct 19". Else: "High priority" (red) if High; due text ("Overdue" red, "Due today" honey, "Due tomorrow", "Due Wed" within 2–6 days, "Due Oct 30"); "🎓 Exam in 3 days" if boosted; if nothing else, the category name.
- Habit row subtitle: "Rest day" / "Missed · {reason}" / weekly "{done} of {target} this week" / "{n}-day streak · still open" / "{n}-day streak" / "{n}-day streak ended" / "Start a streak".


---

# 4. Screens

Every screen, what it shows, and what each control does. "→" means "opens". Sheets (pop-up panels) are listed in 4.8. Most rows are tappable to edit.

---

## 4.1 Today (home tab) — `TodayView.swift`

Top to bottom:

1. **Header**
   - Small caps date, e.g. "MONDAY, OCTOBER 19".
   - Right side buttons: **Beans badge** (bean icon + total) → switches to Insights tab; **+ menu** (New Task / New Habit / New Exam) → editor sheet; **gear** → Settings sheet.
   - Large serif greeting on its own line: Good morning / afternoon / evening.
2. **Empty state** (no active tasks and no habits): coffee cup, "A fresh start", "Add a task or a habit and today's brew will start filling up.", button **Add a task**.
3. **Brew card** (otherwise)
   - Coffee cup illustration filled to today's progress (steams at 100%).
   - "TODAY'S BREW", status message (see business logic 3.8), a row of up to 12 beans (dark = done, light = not yet; "+N" if more).
   - **Up next** row (if any task left): category color bar, "Up next", task title, **Brew ▶** button → Focus session for that task.
4. **Notice banner** (at most one): exam soon / overdue / streak at risk. Tap → that item.
5. **Your day card** (if any active tasks): "Your day · Open plan ›" and the **Day bar** (a horizontal bar of the visible day: study windows in milk color, task blocks in category colors, events in grey, a "now" tick, start/now/end times). Tap → Plan tab.
6. **Tasks** section (if any active tasks): pending tasks in priority order inside one card (each a Task row). If none pending: "Everything's checked off for today." A **Done today ⌄** toggle reveals tasks checked off today.
   - Task row: round check button (tap = check off/uncheck today, ripple + haptic), title, meta line, category color bar on the right. Tap row → Edit Task.
7. **Habits** section (habits due today): Habit rows — streak cup, title, subtitle, check button. Tap → Habit detail sheet.

## 4.2 Plan tab — `ScheduleView.swift`

- **Title** "Plan"; toolbar **refresh** button (re-reads calendar, updates "now").
- **Week strip**: 7 buttons, today + next 6 days ("Today", "Tue", …, day number, a dot if that weekday has study windows). Selected day is filled dark. Tap to preview that day.
- **Windows line**: "Study time 4:00 PM–6:00 PM, …" or "No study windows set. Planning 8 AM – 10 PM." with **Edit**/**Set** → Settings sheet.
- **Empty state** if no active tasks: "Nothing brewing yet", "Add a few tasks and iino will fit them into your study time.", **Add a task**.
- **Day timeline** card: hour grid (84 pt per hour, hour labels on the left), study windows as soft milk-colored bands, past time faded (today), task blocks (category tint, title, duration, ▶ icon) and event blocks (grey, "Calendar · 1 hr"), red-brown **now line** with dot. Scrolls to now on open.
  - Tap a **task block** → action sheet titled with the task: **Start focus session**, **Check off for today** (if not done), **Edit task**.
  - Event blocks aren't interactive.
- Under the timeline: today with nothing left → "Everything's done for today. Time to rest."; future day → "A preview using your current tasks. It updates as you check things off."
- **Didn't fit** section: unscheduled tasks (Task rows) + "Add more study time in Settings, or shorten the time per session."
- **Done today** section (today only).
- Coming back to the app moves the selected day forward if it's in the past.

## 4.3 Tasks tab — `TasksView.swift`

- Segmented control **Tasks | Exams**; title follows it; toolbar **+** → New Task or New Exam.

**Tasks mode**
- Empty: "No tasks yet" — "Tasks come back each day until you mark them finished. Great for ongoing work like revision or a project." **Add a task**.
- **To do today** (priority order). Footer: "Swipe right to finish a task for good or start a focus session."
- **Done today**.
- **Finished · N** collapsible header (newest finished first).
- Row interactions:
  - Tap → Edit Task.
  - Swipe right (leading): active → **Finish** (green) and **Focus** (caramel); finished → **Restore**.
  - Swipe left (trailing): **Delete** (no confirmation here).

**Exams mode**
- Info card "How exams help": "During the 7 days before an exam, tasks in the same category move up your list and get more time in your plan. You'll also get a reminder 3 days and 1 day ahead."
- Empty: "No exams yet" — "Add your next exam to get your study tasks lined up in time." **Add an exam**.
- **Upcoming** (soonest first) and **Past** (most recent first).
- Exam row: date tile (day number + month, tinted by category), subject, detail line, and relative day ("In 5 Days", honey when ≤ 3 days).
  - Detail: past → category name; no matching tasks → "No {Cat} tasks yet. Add one to prepare."; within 7 days → "Boosting N {Cat} tasks"; later → "Boosts N {Cat} tasks from Oct 23".
- Tap → Edit Exam; swipe left → Delete.

## 4.4 Habits tab — `HabitsView.swift`

- Title "Habits"; toolbar **+** → New Habit.
- Empty: "No habits yet" — "Pick a routine you want to keep, like working out or reading. Every day you show up keeps your streak brewing." **Add a habit**.
- **How streaks work** card (collapsible, remembered per device):
  - Check off every day a habit is due. Miss one and the streak ends.
  - Every 7 days in a row earns a freeze (hold 2). It saves your streak if you miss.
  - One rest day a week doesn't count against you.
  - Milestones at 3, 7, 14, 30, 100 days and more earn bonus beans.
- Sections **Today** (due today) and **Other days**.
- **Habit card**: streak cup (54 pt), title, big streak number + "days", "· ❄️ N" freezes, "· Every day" schedule, **Week beans** (last 7 days: roasted bean = done, outlined = due & missed, faint dot = not due, ❄️ = frozen), and the check button (or 🌙 on a rest day).
  - Tap → Habit detail (pushed).
  - Long-press menu: **Take a rest day** (if allowed), **I missed today** (if due and nothing logged) → Miss reason sheet, **Edit**, **Delete**.
  - Swipe left → Delete.

## 4.5 Habit detail — `HabitDetailView.swift`

Opened from Habits (push) or as a sheet from Today / Insights (with **Done**). Toolbar **Edit** → Habit editor (deleting closes this screen too).

1. **Hero**: big streak cup (128 pt), "{n} day streak" / "{n} week streak", state message, "Every day · reminder 8:00 PM".
2. **Today action**: rest day → "🌙 Rest day today"; done → soft green **Done today · Undo**; due → primary **Check off today** (or **I did it after all** if logged missed).
3. **Stat tiles**: **Best** (longest + unit); **Freezes** (2 snowflakes, filled = in hand) for daily habits or **This week** (beans for target, filled = done) for weekly; **Next: {milestone}** with progress bar.
4. **Milestones** (horizontal scroll): circles 3…365, earned ones caramel with "+{bonus}", others show "days".
5. **Month history**: month name with ‹ › (limited from first tracked month to current), weekday headers, a cell per day: bean = done, ❄️ = freeze, 🌙 = rest, red outlined bean = missed, ring = today and due, dot = otherwise. Legend: Done, Freeze, Missed, Rest.
6. **Other actions** (if available): **Take a rest day** ("One a week. Doesn't break your streak."), **I missed today** ("Uses a freeze if you have one.").
7. **Why it was missed**: each reason with up to 10 red beans for its count, and the top reason's tip.

## 4.6 Insights tab — `InsightsView.swift`

- Empty (no tasks and no habits): "Insights brew over time" — "Check off tasks and habits for a few days and your patterns will show up here."
- **Beans card**: bean in a circle, LEVEL NAME, big total + "beans", progress bar to next level, "{n} to {Next} · +{week} this week".
- **Last 4 weeks** heat grid (7 columns by weekday, roast colors, legend Quiet → Busy).
- **Your streak board**: ranked habits (tap → Habits tab).
- **Noticed this week**: up to 3 insight cards (see 3.7).

## 4.7 Settings (sheet) — `SettingsView.swift` + `AccountViews.swift`

Toolbar **Done**.

1. **Account**
   - Signed out: "Sign in to sync — Keep your data safe and on all your devices." → Sign-in sheet (no skip option, ✕ to close).
   - Signed in: "Signed in as {email or Apple ID}"; **Name** text field (placeholder "Shown on leaderboards later", saves on Return → `profiles.display_name`); sync status (Syncing… / Synced {relative time} / error text / Ready to sync) + **Sync now**; **Sign out** (confirm: "Your data stays on this phone. Sign back in any time to sync again."); **Delete account** (destructive confirm: "This permanently deletes your account and all synced data. It can't be undone. Data on this phone stays.").
   - Footer when signed in: "Signing out keeps your data on this phone. Deleting your account permanently removes everything synced to it."
2. **Study windows**: a **week grid** (7 columns in locale week order, 6 AM–midnight, 20 pt per hour, labels every 3 hours, today's column header highlighted). Windows are crema blocks; tap a block → Edit study time; tap an empty spot → Add study time pre-filled with that day and hour. Plus an **Add study time** button. Footer explains tap-to-edit and the 8 AM–10 PM default.
3. **Permissions**: Calendar ("So your plan never overlaps your events.") and Reminders ("Gentle nudges for habits, due dates and exams.") rows — **Allow** / ✓ **On** / **Settings** (opens iOS Settings when denied).
4. **About**: Version; **Show the welcome tour again**.

## 4.8 Sheets and editors — `Editors.swift`, `FocusSessionView.swift`, `HabitsView.swift`

All editors work on a draft; nothing is saved until **Add/Save**. **Cancel** discards.

**New/Edit Task**
- Title (multi-line, placeholder "What do you want to work on?", autofocus when new). New-task footer: "Tasks come back each day. Check them off whenever you work on them, and mark them finished when they're done."
- Category picker; Priority picker; **Time per session** stepper 5–480 min, step 5 (footer: "Time per session sets how long focus sessions and planned blocks are.").
- **Due date** toggle → date picker (default tomorrow). Saved as start of that day.
- Notes (optional).
- Edit only: **Mark as finished** / **Move back to active**; **Delete task** (confirm "Delete this task?" — "Its history will be removed too.").
- Save disabled if title is empty (trimmed).

**New/Edit Habit**
- Title (placeholder "e.g. Work out for 30 minutes"), Category (default Health).
- **How often**: segmented "On set days" | "Times a week".
  - Set days: weekday chips (default all). Footer "Every picked day counts toward your streak. Other days are off." / "Pick at least one day."
  - Times a week: stepper 1–7 (default 3). Footer "Any days you like. The streak counts the weeks you reach your goal."
- **Reminder** toggle + time (default 8:00 PM). Footer "Not once you've checked it off. A nudge at 9:30 PM if a streak of 3+ is still open."
- Edit only: **Delete habit** (confirm — "Its streak and history will be removed too.").
- Save writes `weekly_target = 0` for set days, or the number for times a week. Valid if title non-empty and (weekly or ≥ 1 day).

**New/Edit Exam**
- Subject (placeholder "e.g. Biology midterm"), Category (default Math), Date (default in 7 days, saved as start of day).
- Footer: "During the 7 days before the exam, your {Cat} tasks move up your list and get time in your plan first. You'll get a reminder 3 days and 1 day ahead."
- Notes (placeholder "Topics, room, what to bring…"). Edit only: **Delete exam** (confirm).

**Add/Edit Study Time**
- New: weekday chips (multi-select; one window is created per selected day). Edit: single weekday picker.
- Start / End time pickers (default start 4 PM or tapped hour, end = start + 2 h), "Length" or "End must be after start".
- Edit only: **Delete study window**.

**Missed today** (Miss reason sheet)
- Header "What got in the way of "{title}"?"; options Forgot, No Time, Too Hard, Didn't Care, Other → logs the miss and closes.
- Footer: "Owning a miss helps you spot patterns in Insights. If you have a freeze, it will save your streak."

**Focus session** (see `06-notifications-calendar-focus.md`)
- "FOCUS BREW", task title, category label, pour-over animation, big timer, status text.
- Before starting: − / + 5-minute adjusters (5–480 min).
- Buttons: reset ↺, play/pause, ✓ finish (checks the task off today).
- Can't swipe the sheet away while running. **Close** in the toolbar.
- When it finishes → **How did that feel?** sheet: Too Easy / Okay / Too Hard (with emoji and detail) or **Skip**.

## 4.9 Onboarding and sign-in — `OnboardingView.swift`, `AccountViews.swift`

**Tour** (Skip jumps to last page; page dots; **Continue** / **Get started**):
1. "Welcome to iino" — "Your cozy coffee-house planner. Brew your study time, keep your routines on a streak, and get ready for exams, one cup at a time."
2. "How iino works" — Tasks, Habits & streaks, Exams, Plan, Beans (one line each).
3. "A couple of helpers" — "Both are optional, and you can change them anytime in Settings." Calendar + Reminders permission rows.

**Sign in — "Save your brew"**
- Subtitle: "Sign in to keep your tasks, habits and streaks safe and in step on all your devices."
- **Continue with Apple** (black, white in dark mode), **Continue with Google** (card button with "G"), divider "or use email".
- Email form: segmented **Sign in | Create account**, Email, Password ("Password (8+ characters)" when creating), primary button. Sign in needs any password; create needs ≥ 8 characters and an "@" in the email.
- **Forgot password?** (sign-in mode, needs email) → "Check {email} for a link to reset your password."
- After creating an account when confirmation is required: **Check your inbox** card — "We sent a link to {email}. Open it on this iPhone to finish creating your account." + **Use a different email**.
- Errors in red under the form (friendly versions, see `05-accounts-and-sync.md`).
- **Continue without an account** + "Your data stays on this phone. You can sign in later in Settings." (not shown when opened from Settings).
- A spinner overlays while working. Closes automatically once signed in.

**Choose a new password** (after opening a reset link): password field (8+), **Save**/**Cancel**.


---

# 5. Accounts and sync

Source: `SupabaseConfig.swift`, `AuthManager.swift`, `SyncEngine.swift`, `AccountViews.swift`, `supabase/*.sql`.

## 5.1 Supabase project

- URL: `https://nipcxvboowscqinnxgjz.supabase.co`
- Publishable (anon) key: in `iinos/SupabaseConfig.swift` (`sb_publishable_…`). Safe to ship in apps and websites — Row Level Security protects the data.
- **Never** use the secret / `service_role` key in the app or browser.
- Swift library: `supabase-swift` 2.55.x. Web equivalent: `@supabase/supabase-js` v2.
- Auth providers enabled: **Apple**, **Google**, **Email** (email confirmation required).
- iOS redirect URL: `iino://login-callback` (custom URL scheme `iino`). Must be in Supabase → Authentication → URL Configuration → Redirect URLs.

## 5.2 Sign-in methods (iOS)

| Method | How it works |
|---|---|
| **Apple** | Native "Sign in with Apple" button. App makes a random 32-char nonce, sends its SHA-256 to Apple, then calls `auth.signInWithIdToken(provider: apple, idToken, nonce)`. Apple only shares the user's name the first time, so it's saved right away to `profiles.display_name`. |
| **Google** | `auth.signInWithOAuth(provider: google, redirectTo: iino://login-callback)` — opens a secure browser sheet, returns to the app. Cancel is ignored silently. |
| **Email sign in** | `auth.signIn(email, password)` |
| **Email sign up** | `auth.signUp(email, password, redirectTo)` — if no session comes back, show "Check your inbox". |
| **Forgot password** | `auth.resetPasswordForEmail(email, redirectTo)`; opening the link triggers `passwordRecovery` → "Choose a new password" → `auth.update(user: {password})`. |
| **Email links** | `onOpenURL` → `auth.session(from: url)` for confirmation and reset links. |
| **Sign out** | `auth.signOut()`. Data stays on the phone. |
| **Delete account** | `rpc("delete_my_account")` → deletes the auth user → cascades to every row. Then forget sync state and sign out. Phone data stays. |
| **Display name** | `profiles` update `display_name` where `id = user.id`; loaded on sign-in. |

Friendly error messages:
| Server says | User sees |
|---|---|
| "invalid login" | That email and password don't match. |
| "already registered" | There's already an account with this email. Try signing in. |
| "email not confirmed" | Please confirm your email first. Check your inbox for the link. |
| "rate limit" | Too many attempts. Please wait a few minutes and try again. |
| network error | Can't reach the server. Check your internet connection. |
| Google "not enabled" | Google sign-in isn't switched on yet. |

`AuthManager` listens to `authStateChanges`. When a user appears (or changes), it starts `SyncEngine` for that user id and loads the display name. When signed out, it stops syncing.

## 5.3 How the iPhone syncs (`SyncEngine`)

**Offline-first:** the phone's local database is the source of truth while using the app. Sync runs:
- 2 seconds after any save (debounced),
- when the app comes to the foreground,
- every 60 seconds while signed in,
- on **Sync now**.

Only one sync runs at a time; a request during a sync queues one more run.

Each sync = **pull, then save, then push**.

### Pull (server → phone)
For each table in order `tasks`, `task_logs`, `habits`, `habit_logs`, `exams`, `work_windows`:
1. Fetch rows where `updated_at > lastPulled[table]`, ordered by `updated_at`, 500 per page (timestamps sent with **microsecond** precision).
2. For each row:
   - If the phone has an **unsynced local edit** to that record (its fingerprint differs from the last synced fingerprint) → skip; the phone's version will be pushed (**phone wins**).
   - If the record was synced before but is now **missing locally** and the row isn't deleted → it was deleted on the phone and not pushed yet → skip (don't resurrect).
   - If `deleted_at` is set → delete locally.
   - Otherwise create/update locally.
   - Logs whose parent task/habit isn't on the phone yet are skipped (retried later).
3. Remember the newest `updated_at` per table.

### Push (phone → server)
Parents before children: tasks, task_logs, habits, habit_logs, exams, work_windows.
1. Build a record for every local object (logs without a parent are skipped).
2. Fingerprint = SHA-256 of the record's JSON (sorted keys, dates in whole-second ISO-8601, without `updated_at`/`deleted_at`).
3. **Upsert** (on conflict `id`) every record whose fingerprint changed, in batches of 500. Cleared optional values (e.g. removing a due date) are sent as explicit `null`.
4. Any id that has a saved fingerprint but no longer exists locally → `update set deleted_at = now()` (soft delete), then forget it.

If anything fails, the status shows the error ("Offline. Will sync when you're back online." for network problems) and the sync state is reloaded from disk so the next attempt redoes the work safely.

### Sync state
Saved per user in `Application Support/sync-{userID}.json`: `fingerprints` ("table:uuid" → hash) and `lastPulled` (table → date).

### Switching accounts
If a different account signs in than last time on this phone, the phone's local data is cleared first (the previous account's data is safe in its cloud) so accounts never mix.

## 5.4 Rules a web app MUST follow to stay compatible

The web app talks to the same tables. The easiest design: the web app is **online**, reads/writes Supabase directly, and the iPhone picks up its changes on its next pull.

1. **Use client-generated UUIDs** for new rows (`crypto.randomUUID()`).
2. **Never hard-delete.** Delete = `update ... set deleted_at = now()`. When deleting a task or habit, also soft-delete its logs (`task_logs`/`habit_logs` with that parent id). Always filter `deleted_at is null` when reading.
3. **Don't send `updated_at`.** The server trigger sets it; that's how the phone knows something changed. Any update (even one field) bumps it.
4. **Send complete, valid values**: enum strings exactly as listed in `02-data-model.md`; `repeat_days` as a sorted int array 1–7, never empty; `weekly_target` 0–7; `estimated_minutes` 5–480.
5. **One log per item per local day.** Before inserting today's log, look for a non-deleted log for that task/habit on today's local date and update it instead. Uncheck = soft-delete today's logs.
6. **Dates**: due/exam dates at local midnight of the chosen day (`new Date(y, m, d)` → `toISOString()`); log `date` = now.
7. **Weekdays** 1 = Sunday … 7 = Saturday.
8. **Run the same rules** (`03-business-logic.md`) for streaks, beans, priority and the planner, so numbers match the phone exactly.
9. **Realtime (optional)**: subscribe to Postgres changes on these tables (filtered by `user_id`) so the web view updates live when the phone syncs. Requires enabling Realtime for these tables in Supabase.
10. **Conflicts**: if the same record is edited on phone and web at nearly the same time, the phone's unsynced edit wins when it next syncs. That's acceptable for a personal planner.

### Auth on the web
- Google and email work right away with `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` and `signInWithPassword` / `signUp`.
- Add the web URLs (e.g. `http://localhost:3000/**` and your production domain) to Supabase → Authentication → URL Configuration → Redirect URLs, and set the **Site URL** to the production domain (email links use it).
- **Apple on the web** needs extra setup: an Apple **Services ID** with the web domain and return URL `https://nipcxvboowscqinnxgjz.supabase.co/auth/v1/callback`, added to Supabase's Apple provider "Client IDs". Until then, people who signed up with Apple can't log in on the web (they could add a password via "Forgot password" only if Apple shared a real email, not a private relay one).
- The same person signing in with different methods that share an email is linked automatically by Supabase when the email is verified.

### Calendar and notifications on the web
iOS calendar (EventKit) and local notifications don't exist on the web. A web version can skip calendar events in the planner (plan only around study windows) or later add Google Calendar via its API. Browser notifications are optional.


---

# 6. Reminders, calendar and focus timer

## 6.1 Reminders — `NotificationManager.swift`

Local notifications on the iPhone. Asked for during onboarding or in Settings (`alert` + `sound`).

**All reminders are rebuilt from the current data** whenever anything they depend on changes (`ReminderSync` in `ContentView.swift` watches a fingerprint of tasks, habits and exams), when notification permission changes, and when the app comes to the foreground. Rebuilding removes every pending notification whose id starts with `iino.reminder.` and adds the new set, one rebuild at a time. So deleted, finished or edited items never leave stale reminders.

iOS allows 64 pending notifications per app; iino schedules at most **60** (soonest first), leaving room for the focus timer. Only future times are scheduled.

| Reminder | When | Title | Body |
|---|---|---|---|
| Task due tomorrow | 6:00 PM the day before the due date (unfinished tasks with a due date) | Due tomorrow | {task title} |
| Task due today | 8:00 AM on the due date (skipped if it's today and already checked off) | Due today | {task title} |
| Exam in 3 days | 8:00 AM, 3 days before | Exam in 3 days | {subject}. A little review today goes a long way. |
| Exam tomorrow | 8:00 AM, 1 day before | Exam tomorrow | same |
| Habit | Habit's reminder time on each due day for the next 7 days (if reminders enabled). Skipped today once anything is logged today; skipped for the rest of the week once a weekly goal is met. | {habit title} | Today with a streak: "Keep your {n}-{day/week} streak brewing." Otherwise: "Time for today's habit." |
| Streak at risk | 9:30 PM today, for day-based habits that are `atRisk` with a streak ≥ 3 | Don't let your {n}-day streak go cold | {habit title} is still open for today. |
| Focus done | When the focus timer ends (id `iino.focus.end`) | Your focus brew is ready ☕ | Nice work on {task}. Time for a coffee break. |

## 6.2 Calendar — `CalendarManager.swift`

- Uses Apple EventKit with **full access** (asked during onboarding or in Settings). Usage text explains it keeps the plan from overlapping events.
- `events(on: day)`: all **timed** events (all-day events are ignored) from every calendar on that day, sorted by start. Each becomes a `CalendarItem { id, title ("Event" if blank), start, end, color (calendar's color) }`. The id combines the event identifier and start time, because repeating events share an identifier.
- `todayEvents` refreshes when the calendar database changes, when the day changes (midnight), when the app becomes active, and on the Plan refresh button.
- Events are **read-only**; iino never writes to the calendar. They're shown in Plan and the day bar, and the planner avoids them.

## 6.3 Focus session — `FocusSessionView.swift`

- Starts with the task's `estimated_minutes` (minimum 5). Before starting, − / + adjust by 5 minutes (5–480).
- Timing is based on a fixed **end date**, not a counting loop, so it stays correct when the app is in the background or the phone is locked. The display updates every second.
- **Start**: set end = now + remaining; schedule the "focus brew is ready" notification; keep the screen awake.
- **Pause**: remember remaining seconds, cancel the notification, allow sleep.
- **Reset**: stop and go back to the planned length.
- **Finish ✓** or reaching zero: stop, mark finished (success haptic), **check the task off for today**, then show **How did that feel?**
- Status text: "Ready to brew" → "Brewing… stay with it." → "Paused" → "Brewed. Time for a coffee break."
- Closing (✕/Close or leaving) stops the timer and cancels the notification. The sheet can't be swiped away while running.
- Pour-over illustration empties the dripper into the cup as progress goes 0 → 1, with drips while brewing (reduced when Reduce Motion is on).

**Feedback**: "How did that feel?" — "iino adjusts the next session to match."
- Too Easy → `estimated_minutes = max(10, m − 10)`
- Okay → unchanged
- Too Hard → `estimated_minutes = min(480, m + 15)`
- All set `difficulty_feedback`. **Skip** leaves it unchanged.


---

# 7. Design system — "a coffee house"

Source: `Theme.swift`, `CoffeeArt.swift`, `SharedComponents.swift`.

Mood: calm, warm, uncluttered. Crema paper backgrounds, oat-milk cards, espresso ink, roasted accents. Light mode is a sunny café; dark mode is an espresso bar (warm brown, never pure black). Prefer visuals (cups, beans, bars, timelines) over numbers. Text colors meet WCAG AA contrast.

## 7.1 Colors

| Token | Role | Light | Dark |
|---|---|---|---|
| `brandBackground` | Page background (crema) | `#F6EFE6` | `#1C1511` |
| `brandCard` | Cards, list rows (oat milk) | `#FFFBF6` | `#281E18` |
| `brandFill` | Chips, tracks, quiet fills (latte foam) | `#EEE3D5` | `#382A21` |
| `brandBorder` | Hairlines, dividers | `#E5D8C8` | `#45362B` |
| `brandText` | Main text (espresso ink) | `#33261E` | `#F4EADF` |
| `brandMuted` | Secondary text (mocha) | `#7A6656` | `#B8A391` |
| `brandPrimary` | Primary actions (dark roast / latte in dark) | `#5C3D2A` | `#E3C4A2` |
| `brandOnPrimary` | Text on primary | `#FFFBF6` | `#1C1511` |
| `brandAccent` | Caramel highlights, milestones | `#A9692F` | `#E0A86E` |
| `brandSuccess` | Matcha — checks, done | `#5E7F55` | `#9EC28F` |
| `brandWarning` | Honey — due today, exams soon | `#A27024` | `#E5B566` |
| `brandDanger` | Coffee cherry — overdue, delete, missed | `#A3433D` | `#E38B80` |
| `brandIce` | Streak freezes | `#5F87A3` | `#9CC0D8` |
| `coffeeEspresso` | Illustration: coffee, done beans | `#4A2E1F` | `#6B4530` |
| `coffeeCrema` | Illustration: crema, study window blocks | `#C99A6B` | `#D9AC7D` |
| `coffeeMilk` | Illustration: milk, study window bands | `#E8D3B8` | `#CDB496` |
| `coffeeCeramic` | Cup ceramic | `#FFFDF9` | `#3A2C23` |

**Category colors**

| Category | Name | Light | Dark |
|---|---|---|---|
| Math | blueberry | `#56708C` | `#93AFCB` |
| Science | pistachio | `#6B8546` | `#B2CB86` |
| English | plum | `#7A5A7E` | `#BC9BC0` |
| History | caramel | `#A56E3A` | `#DDAA74` |
| Language | cherry | `#9E4F4A` | `#DB8E87` |
| Health | sage | `#5A7F69` | `#98C2A6` |
| Personal | mocha | `#7B5844` | `#C9A086` |
| Project | teal ink | `#3F6E72` | `#84B4B8` |
| Other | stone | `#7A7064` | `#B3A898` |

Tints are usually the color at 10–16% opacity as a background behind the full color.

## 7.2 Typography

Serif headings (Apple "New York"; on the web use e.g. *Newsreader*, *Fraunces*, *Lora* or `ui-serif, Georgia`) for a café-menu feel; clean system sans for reading. All sizes follow Dynamic Type text styles.

| Token | Style |
|---|---|
| `iinoLargeTitle` | Large title, serif, semibold (greetings, screen heroes) |
| `iinoTitle` | Title 3, serif, semibold |
| `iinoHeadline` | Headline, serif |
| `iinoBody` / `iinoSubheadline` / `iinoFootnote` / `iinoCaption` | System sans |
| `iinoNumber` | Large title, serif, bold (beans, streaks) |

Navigation bar titles are serif in espresso ink. **Section headers**: footnote, semibold, UPPERCASE, letter-spacing 0.8, muted.

## 7.3 Surfaces and layout

- **Paper background**: crema + soft radial glow of crema (14%) from the top + a faint fixed paper grain (tiny dots at 3.5% opacity, seeded so it never shimmers).
- **Card** (`iinoCard`): `brandCard`, corner radius 22 (continuous), 0.5 pt border at 60%, shadow espresso 6% radius 14 y 6.
- **CardStack**: rows inside one card separated by hairlines indented 60 pt; rows padded 16 × 10.
- Screen side padding 20, section spacing 24–26.
- **Notice banner**: icon + text + chevron on the tint color at 10%, radius 16.
- **Empty state card**: empty steaming cup, headline title, muted message, soft button.

## 7.4 Buttons and controls

- **Primary** (`iinoPrimary`): full-width capsule, `brandPrimary` fill (40% when disabled), on-primary serif headline text, padding 16, presses to 98%.
- **Soft** (`iinoSoft`): small capsule, tint text on tint 10% (18% pressed), subheadline medium.
- **CircleIcon**: 42 pt circle, `brandFill`, primary-colored SF Symbol (header +, gear, close).
- **CheckButton**: empty circle → filled check circle (success color), with a bounce, a ripple ring growing 0.6 → 2.0 and fading in 0.5 s, and a success haptic.
- **Beans badge**: bean + number in a 42 pt `brandFill` capsule.
- **Day chips**: 7 round toggles (very short weekday names), selected = primary fill.
- Swipe actions: Finish (success), Focus (accent), Restore (primary), Delete (red).

## 7.5 Illustrations (vector shapes)

- **CoffeeCupView(progress 0–1, size, steaming, muted)**: ceramic cup with handle and saucer, coffee level rising with progress, crema line, optional steam wisps (animated). Muted = grey ceramic/outline.
- **StreakCup(report)**: done → 85% full + steam; at risk → 60% cooling; frozen → 60% + ❄️; resting → 60% (or empty & muted with no streak); ready/ended → empty & muted.
- **CoffeeBean(size, filled, color)**: oval bean with a curved seam; filled = roasted, outline = missed/not yet.
- **PourOverView(progress, isBrewing)**: dripper above a cup; the dripper empties and the cup fills; drips fall while brewing.
- **Week beans**: 7 small beans for the last 7 days.
- **Heat grid**: rounded squares in roast shades.

## 7.6 Icons (SF Symbols → web equivalents, e.g. Lucide)

Tabs: cup.and.saucer (Today), calendar.day.timeline.left (Plan), checklist (Tasks), flame (Habits), chart.bar.xaxis (Insights). Others: gearshape, plus, snowflake (freeze), moon.zzz (rest), trophy (milestone), graduationcap (exam), timer / play.fill (focus), checkmark.seal (finish), clock.badge.exclamationmark (overdue), lightbulb (tip).

## 7.7 Motion and feedback

- Snappy springs for list changes; celebration toast slides from the top (spring 0.45 s, bounce 0.3), hides after 3 s.
- Numbers animate with numeric transitions.
- Success haptics on check-offs, focus completion and celebrations.
- Respect Reduce Motion.

## 7.8 Voice and copy

Gentle, short, coffee metaphors, never guilt-tripping: "Today's brew", "Brewing nicely", "Keep your streak warm", "Your focus brew is ready ☕", "Insights brew over time", "Nothing brewing yet". Use plain sentences ending in periods; avoid exclamation marks except celebrations ("7-day streak!").


---

# 8. Function reference (file by file)

Every Swift file in `iinos/`, with each type and function and what it does. Pure-UI styling helpers are summarized.

---

## App setup

### `iinosApp.swift`
- **`IinoApp`** (`@main`): creates the data container with `DataStore.makeContainer()`, sets up the navigation bar fonts (`Appearance.configureNavigationBar()`), connects `SyncEngine.shared.configure(container:)`, starts `AuthManager.shared`, and shows `ContentView` with a shared `CalendarManager`.

### `DataStore.swift`
- **`DataStore.schema`**: the six model types.
- **`makeContainer()`**: opens `Application Support/iino.store` and imports old data once.
- **`openContainer()`**: open the store (no iCloud). If it can't be opened, move the files aside (`iino-unreadable-{time}.store`, never deleted) and try again; last resort is an in-memory store.
- **`moveAsideUnreadableStore()`**: renames the store and its -shm/-wal files.
- **`importLegacyDataIfNeeded(into:)`**: once (flag `didImportLegacyStoreV1`), if `default.store` from version 1.x exists, copy everything into the new store. The old file is only read.
- **`copyLegacyData(from:to:)`**: reads old tables with SQLite directly and inserts or updates by id: tasks, task logs, habits, habit logs, exams, work windows, keeping links.
- **`decodeWeekdays(_:)`**: old `repeatDays` were JSON inside a keyed archive; decodes to `[Int]`.
- **`SQLiteReader`** (private): `init(url)` read-only, `close()`, `tableExists`, `columns(in:)`, `rows(in:)`, `query`. `Row` helpers: `string`, `int`, `data`, `date` (Core Data seconds since 2001), `uuid`.
- *iOS only. A web app doesn't need this.*

## Data and rules

### `Models.swift` (see `02-data-model.md`)
- **`IITask`** model + extension: `liveLogs` (logs not pending deletion), `isFinished`, `isCompletedToday`, `totalCompletions`, `daysUntilDue`, `isOverdue`, `setCompletedToday(_:in:)`.
- **`TaskLog`** model.
- **`IIHabit`** model + extension: `liveLogs`, `isWeeklyGoal`, `isScheduled(on:)`, `isScheduledToday`, `log(on:)`, `isCompletedToday`, `missedToday`, `isRestingToday`, `canRestToday`, `completedDayStarts`, `restDayStarts`, `trackingStart`, `scheduleDescription`, `reminderText`, `setCompletedToday(_:in:)`, `logMissToday(_:in:)`.
- **`HabitLog`** model.
- **`IIExam`** model + `daysUntilExam`, `isUpcoming`.
- **`WorkWindow`** model + `startMinutes`, `endMinutes`, `durationMinutes`, `startDate(on:)`, `endDate(on:)`, `label`.
- Enums **`TaskCategory`** (+ `icon`), **`Priority`**, **`DifficultyFeedback`** (+ `emoji`, `detail`), **`MissReason`** (+ `missOptions`, `tip`).
- **`Calendar`** extension: `daysFromToday(to:now:)`, `orderedWeekdays` (locale week order), `shortName(ofWeekday:)`, `veryShortName(ofWeekday:)`.
- Functions: **`durationText(minutes:)`**, **`timeOfDayText(hour:minute:)`**, **`relativeDayText(_:)`**.

### `Streaks.swift` (see `03-business-logic.md` §3.3–3.4)
- **`StreakReport`**: `Unit`, `State`, constants `freezeEvery`, `maxFreezes`, `milestones`; fields; `nextMilestone`, `earnedMilestones`, `milestoneProgress`, `label(_:)`, `message`.
- **`IIHabit.streakReport(now:)`** → `dailyReport` or `weeklyReport`.
- **`IIHabit.toggleToday(in:)`**: check or uncheck today, then celebrate a milestone, freeze or weekly goal.
- **`Beans`**: `perHabitCheckIn`, `perTaskCheckIn`, `perFinishedTask`, `milestoneBonus(_:)`, `levels`, `total(tasks:habits:)`, `thisWeek(tasks:habits:)`, `level(for:)`.
- **`IITask.finish()`**: set `finishedAt`, celebrate.
- **`CelebrationCenter`** (shared): `current` celebration; `celebrate(icon:title:message:)` shows it for 3 s.

### `SchedulingEngine.swift` (see §3.5–3.6)
- **`PriorityEngine`**: `examBoostDays = 7`, `score(for:exams:)`, `boostingExam(for:exams:)`, `sorted(_:exams:)`.
- **`PlannedBlock`**: `start`, `end`, `kind` (.task / .event), `id`, `minutes`.
- **`DayPlan`**: `day`, `blocks`, `unscheduled`, `windows`, `usesDefaultWindow`, `visibleRange`.
- **`SchedulingEngine`**: `bufferMinutes = 10`, `minimumBlockMinutes = 15`, `plan(tasks:exams:events:workWindows:day:now:)`, `nextFreeSlot(...)`, `roundedUp(_:)`.

## Services

### `CalendarManager.swift`
- **`CalendarItem`**: `id`, `title`, `start`, `end`, `color`.
- **`CalendarManager`**: `authStatus`, `todayEvents`, `hasAccess`; `init` (watches calendar changes and day changes), `requestAccess()`, `refresh()`, `events(on:)`.

### `NotificationManager.swift`
- **`NotificationManager`** (shared): `status`, `isAuthorized`; `updateStatus()`, `requestPermission()`, `refresh(using:)` (rebuild reminders, one at a time), `replaceReminders(with:)`, `reminderRequests(tasks:habits:exams:now:)` (all the rules in §6.1), `scheduleFocusEnd(at:taskTitle:)`, `cancelFocusEnd()`.

### `SupabaseConfig.swift`
- **`SupabaseConfig`**: `url`, `publishableKey`, `redirectURL` (`iino://login-callback`).
- **`Backend.client`**: the shared `SupabaseClient` (auth redirect set, emits the stored session at launch).

### `AuthManager.swift` (see §5.2)
- **`AuthManager`** (shared): `user`, `displayName`, `isWorking`, `errorMessage`, `awaitingConfirmationFor`, `showPasswordReset`, `isSignedIn`.
- `listenForAuthChanges()`: start or stop sync, load the name, open the password reset screen.
- `prepare(_:)` and `completeAppleSignIn(_:)`: Sign in with Apple with a nonce; saves the name.
- `signInWithGoogle()`, `signIn(email:password:)`, `signUp(email:password:)`, `sendPasswordReset(email:)`, `updatePassword(_:)`, `handle(_ url:)`.
- `signOut()`, `deleteAccount()` (RPC `delete_my_account`), `updateDisplayName(_:)`, `loadDisplayName()`.
- Helpers: `perform(_:)` (busy flag + friendly errors), `friendlyMessage(for:)`, `randomNonce(length:)`, `sha256(_:)`.

### `SyncEngine.swift` (see §5.3)
- **`SyncEngine`** (shared): `status` (.signedOut / .idle / .syncing / .synced(date) / .failed(message)).
- `configure(container:)`: sync 2 s after every save.
- `start(userID:)`: clear local data if the account changed, load the sync state, start the 60 s heartbeat, sync now.
- `stop()`, `forgetAccount()`, `scheduleSync(after:)`, `syncNow()` (pull → save → push, one at a time).
- `pull(userID:into:)`, `apply(...)` (the conflict and deletion rules), `fetchChanges(_:)` (pages by `updated_at`).
- `push(userID:from:)`, `upload(_:)` (upsert changed rows, soft-delete removed ones).
- `clearLocalData()`, `index(_:)`, `fingerprint(_:)`, `timestamp(_:)` (microsecond ISO-8601), `friendlyMessage(for:)`.
- **`SyncState`**: `fingerprints`, `lastPulled`, `load(for:)`, `save(for:)`, `remove(for:)`.
- **Protocols** `HasSyncID`, `SyncRecord` (`table`, `id`, `updatedAt`, `deletedAt`, `key(_:)`, `withoutMetadata`).
- **Records** (exact column mapping): `TaskRecord`, `TaskLogRecord`, `HabitRecord`, `HabitLogRecord`, `ExamRecord`, `WindowRecord`. Each has `init(model, userID:)` and `write(to:)`. Task and habit-log records encode empty values as `null`.

## Screens

### `ContentView.swift`
- **`AppTab`**: `today`, `plan`, `tasks`, `habits`, `insights`. The **`switchTab`** environment action lets any screen change tabs.
- **`ContentView`**: the tab bar, celebration toast, calendar refresh and sync when the app becomes active, `onOpenURL` for auth links, the password reset sheet, the onboarding cover, and the one-time sign-in prompt.
- **`CelebrationToast`**: the top banner.
- **`AppSheet`**: every sheet: newTask, editTask, newHabit, editHabit, habitDetail, missReason, newExam, editExam, focus, settings. Has `id` and `content`.
- **`ReminderSync`**: invisible view that rebuilds reminders when data, permission or the foreground state changes.

### `TodayView.swift`
- **`TodayView`**: `activeTasks`, `pendingTasks`, `doneTasks`, `todayHabits`, `header`, `headerButtons`, `greeting`, `notice`, `tasksSection`, `habitsSection`.
- **`BrewCard`**: progress cup, message, beans, Up next with Brew.

### `ScheduleView.swift`
- **`ScheduleView`**: Plan tab with the week strip, windows line, timeline, didn't fit, done today, the block action dialog and refresh.
- **`WeekStrip`**, **`WindowsLine`**, **`DayTimeline`** (hour grid, windows, faded past, blocks, now line, scroll anchor), **`TimelineBlock`**.

### `TasksView.swift`
- **`TasksView`** (Mode tasks/exams): `taskSections`, `taskRow` (swipe to finish, focus, restore or delete), `examSections`, `examRow`.
- **`ExamRow`**: date tile, detail text (boost status).

### `HabitsView.swift`
- **`HabitsView`**: today and other-days sections, `habitCard` (context menu, swipe to delete), `cardListRow()`.
- **`StreakRulesCard`** (collapsible), **`HabitCard`**, **`MissReasonSheet`**.

### `HabitDetailView.swift`
- **`HabitDetailView`**: `hero`, `todayAction`, `stats`, `milestones`, `otherActions`, `actionRow`, `missReasons`.
- **`StatTile`**, **`MonthHistory`** (`cell`, `legend`, `shift`).

### `InsightsView.swift`
- **`InsightsView`**: `checkInsByDay`, `topCategory`, `habitNeedingCare`, `topMissReason`, `streakBoard`, `noticed`, `insightCards`.
- `IIHabit.lastSevenDayConsistency`.
- **`BeansCard`**, **`HeatGrid`** (`roast(_:)`), **`InsightCard`**.

### `SettingsView.swift`
- **`SettingsView`**: Account, study windows, permissions and about.
- **`WindowEditorTarget`** (`.new(weekday:hour:)` or `.edit(window)`).
- **`WeekWindowsGrid`**: tap to edit or add study time.

### `Editors.swift`
- **`TaskEditorView`** (`save()`), **`HabitEditorView`** (`onDelete`, `save()`), **`ExamEditorView`** (`save()`), **`WindowEditorView`** (`save()` adds one window per selected day).

### `FocusSessionView.swift`
- **`FocusSessionView`**: `remaining`, `progress`, `timeText`, `statusText`, `adjustButton`, `start()`, `pause()`, `reset()`, `stopTimer()`, `complete()`.
- **`FeedbackView`**: `choose(_:)`.

### `OnboardingView.swift`
- **`OnboardingView`** (tour, then SignInView), **`WelcomePage`**, **`HowItWorksPage`**, **`FeatureRow`**, **`PermissionsPage`**.
- **`CalendarPermissionRow`**, **`NotificationPermissionRow`**, **`PermissionRow`** (notAsked / granted / denied). These rows are also used in Settings.

### `AccountViews.swift`
- **`SignInView`** (`onDone`, `allowsSkipping`; modes signIn and create; `emailForm`, `confirmationCard`, `submit()`).
- **`NewPasswordView`**.
- **`AccountSection`** (Settings; `syncStatus`).

## Design

### `Theme.swift`
- The **`Color`** tokens and the `Color(light:dark:)` and `UIColor(hex:)` helpers.
- **`TaskCategory.themeColor`**.
- **`Font`** tokens and **`Appearance.configureNavigationBar()`**.
- **`PaperBackground`** and `SeededGenerator`.
- **`IinoCard`**, plus the `iinoCard()`, `iinoScreen()`, `iinoList()` and `iinoRow()` modifiers.
- **`PrimaryButtonStyle`** (`.iinoPrimary`) and **`SoftButtonStyle`** (`.iinoSoft`, `.iinoSoft(tint)`).

### `CoffeeArt.swift`
- Shapes: `CupBodyShape`, `DripperShape`, `BeanShape`, `BeanSeam`, `SteamWisp`.
- Views: **`CoffeeBean`**, **`SteamView`**, **`CoffeeCupView`**, **`StreakCup`**, **`PourOverView`**.

### `SharedComponents.swift`
- **`SectionHeader`**, **`CardStack`**, **`CircleIcon`**, **`CheckButton`**, **`TaskRow`** (`meta`, `dueText`), **`HabitRow`** (`subtitle`), **`WeekBeans`**, **`DayBar`**, **`BeansBadge`**, **`CategoryBadge`**, **`NoticeBanner`**, **`EmptyStateCard`**, **`DayChips`**, **`CategoryPicker`**.

## Tests: `iinosTests/iinosTests.swift` (22, all passing)
Each test uses an in-memory store.
- **Daily streaks**:
  - countsConsecutiveDaysIncludingToday
  - openTodayKeepsStreakAtRisk
  - missedDayEndsStreak
  - daysNotDueAreSkipped
  - freezeSavesAMissedDay
  - freezesAreCappedAtTwo
  - restDayDoesNotBreakStreak
  - loggingAMissTodayEndsStreakWithoutAFreeze
  - newHabitIsReady
- **Weekly streaks**: countsWeeksThatMetTheGoal
- **Check-off**:
  - taskCheckOffTogglesOnlyToday
  - quickUncheckAndRecheckSticks
  - completingAfterAMissClearsTheReason
  - onlyOneRestDayPerWeek
- **Planning**:
  - upcomingExamBoostsSameCategoryTask
  - farAwayExamDoesNotBoost
  - overdueOutranksHighPriority
  - plansTasksInsideWindowInPriorityOrder
  - tasksAvoidCalendarEvents
  - finishedAndDoneTasksAreNotPlannedToday
- **Beans**: checkInsAndMilestonesEarnBeans, levelsProgress

These are good cases to port to the web app's own tests, so both versions give the same answers.

## Config files
- **`Info.plist`**:
  - URL scheme `iino`.
  - `ITSAppUsesNonExemptEncryption` = NO.
  - Calendar usage text.
- **`iinos.entitlements`**: Sign in with Apple.
- **`project.pbxproj`**:
  - Supabase Swift package.
  - Display name "iino".
  - Version 2.0 (1).


---

# 9. Building the web version

Goal: open iino in any browser on a computer, sign in with the same account, and see and edit the same tasks, habits, exams and study windows as on the iPhone.

## 9.1 How it connects

```
 iPhone app  ──sync (pull/push)──►  Supabase (Postgres + Auth)  ◄──direct reads/writes──  Web app
 (offline-first, local DB)          tables + RLS, same account                           (online)
```

There's no separate server to build. Supabase already holds the data and handles login. The web app uses `@supabase/supabase-js` with the same project URL and publishable key. The phone picks up web changes on its next sync, which happens within 60 seconds, when the app opens, or after any edit.

## 9.2 Recommended stack

- **Next.js (App Router) + TypeScript** or **Vite + React + TypeScript**. Either one is fine; Vite is simpler if you don't need server rendering.
- **@supabase/supabase-js v2** for auth and data.
- **TanStack Query** (optional) for loading and caching.
- **Tailwind CSS** with the color tokens from `07-design-system.md` as CSS variables, plus a light and dark theme (`prefers-color-scheme`).
- **date-fns** for local-day maths: `startOfDay`, `differenceInCalendarDays`, `startOfWeek` with `weekStartsOn: 0`.
- Hosting: **Vercel** or **Netlify** (free tiers). Add the domain to the Supabase redirect URLs.
- Tests: **Vitest**. Port the 22 iOS test cases so the streaks, beans and planner match.

## 9.3 Suggested structure

```
src/
  lib/supabase.ts          // createClient(URL, PUBLISHABLE_KEY)
  lib/types.ts             // Task, TaskLog, Habit, HabitLog, Exam, WorkWindow, enums
  lib/dates.ts             // local day helpers, weekday 1–7, week start
  lib/streaks.ts           // streakReport(): daily + weekly algorithms (03 §3.3)
  lib/beans.ts             // totals, this week, levels (03 §3.4)
  lib/priority.ts          // score, boostingExam, sorted (03 §3.5)
  lib/planner.ts           // plan() (03 §3.6), no calendar events at first
  lib/insights.ts          // heat grid, streak board, noticed cards (03 §3.7)
  data/queries.ts          // load all rows where deleted_at is null
  data/mutations.ts        // create/update/soft-delete, check-off rules (03 §3.1–3.2)
  components/              // Cup, Bean, StreakCup, PourOver (SVG), Card, CheckButton…
  pages or app/            // Login, Today, Plan, Tasks(+Exams), Habits, HabitDetail, Insights, Settings
```

## 9.4 Compatibility checklist

- [ ] Same Supabase project and tables; no schema changes needed.
- [ ] New ids come from `crypto.randomUUID()`.
- [ ] Deleting means setting `deleted_at`. Children are soft-deleted with their parent. Reads filter `deleted_at is null`.
- [ ] Never send `updated_at`.
- [ ] Enum strings match exactly ("Medium", "Too Easy", "Rest Day", "Didn't Care", …).
- [ ] Weekdays are 1 = Sunday … 7 = Saturday.
- [ ] Due and exam dates are saved at local midnight. Log dates are now. Days are worked out in local time.
- [ ] Only one log per task or habit per local day (update an existing one rather than inserting a duplicate).
- [ ] Streaks, beans, priority and the planner follow `03-business-logic.md` exactly.
- [ ] The web redirect URL and Site URL are added in Supabase Auth settings.
- [ ] Google sign-in and email sign-in work. Apple sign-in on the web needs an Apple Services ID (see `05`), so do that later.
- [ ] The secret key stays out of the code. The publishable key only.
- [ ] (Optional) Turn on Supabase Realtime for the six tables and subscribe, so the page updates when the phone syncs.

## 9.5 Web adaptations

- **Layout**: on wide screens, use a left sidebar with Today, Plan, Tasks, Habits, Insights and Settings, and maybe show Today and Plan side by side. On phones, use a bottom tab bar like the iPhone.
- **Calendar events**: not available at first. Plan only around study windows, then add Google Calendar later.
- **Notifications**: skip at first. The iPhone keeps sending reminders. Browser notifications are optional.
- **Focus timer**: keep it based on the end time (`endAt = Date.now() + remaining`) so a background tab stays accurate. Use `document.title` to show the remaining time.
- **Swipe actions** become hover or row menu buttons. **Long-press menus** become a "⋯" menu.
- **Sheets** become modals or side panels.

## 9.6 Prompt to paste into Claude

> I have an iPhone app called **iino** (SwiftUI + SwiftData) that syncs to **Supabase**. I want a **web app** with the same features. It should use the **same Supabase project, tables and accounts**, so people can sign in on their computer and see and edit the same data as on their phone.
>
> I'm attaching the full spec:
> - 01 Overview
> - 02 Data model and SQL schema
> - 03 Business logic: streaks, beans, priority, planner
> - 04 Screens
> - 05 Accounts and sync, including the rules the web app must follow
> - 06 Reminders, calendar and focus timer
> - 07 Design system
> - 08 Function reference
>
> Please build it with **Vite + React + TypeScript + Tailwind + @supabase/supabase-js v2 + date-fns**.
>
> Requirements:
> 1. **Sign-in**: Google and email/password (sign up with email confirmation, sign in, forgot password, set new password). Add "Continue with Apple" later.
> 2. **Data and storage**:
>    - Read and write the existing tables directly.
>    - Follow every rule in section 5.4: client UUIDs, soft deletes via `deleted_at` (children too), never send `updated_at`, exact enum strings, weekdays 1 = Sunday, local-midnight due and exam dates, one log per item per local day.
> 3. **Logic**: implement the streak, freeze, rest-day, weekly-goal, milestone, beans/level, priority and planner logic exactly as written in section 03, as pure TypeScript functions with unit tests (Vitest) that cover the cases listed in 08 "Tests".
> 4. **Screens**: build every screen from section 04: Today, Plan (timeline and week strip, without calendar events for now), Tasks plus Exams, Habits, Habit detail, Insights and Settings (account, study-window week grid). Also build the editors, the miss-reason picker, the focus timer and the feedback sheet.
> 5. **Design**: use the coffee design system from section 07, with the same colors in light and dark, serif headings, cards, and SVG versions of the cup, bean, streak cup and pour-over. It should be responsive: a sidebar on desktop and bottom tabs on mobile.
> 6. **Live updates**: optionally subscribe to Supabase Realtime so changes from the phone appear live.
> 7. **Keys**: put the Supabase URL and publishable key in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). Never use the service_role key.
>
> Start with the project setup, types, the pure logic modules and their tests, then auth, then the screens one at a time. Ask me before changing the database schema.


---

