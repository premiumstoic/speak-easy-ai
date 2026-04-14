

# Backend Data Architecture: Users, Couples & Sessions

## Data Model

```text
profiles (1 per user)
    │
    ├── couple_id FK ──► couples (1 per pair)
    │                        │
    │                        ├──► sessions (1 per therapy run)
    │                        │        │
    │                        │        └──► session_turns (1 per speaking turn)
    │                        │
    │                        └──► couple_invites (pending invitations)
    │
    └── user_id FK ──► auth.users
```

## Tables

### 1. `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | = auth.users.id |
| couple_id | uuid FK nullable | null until paired |
| display_name | text | |
| avatar_url | text nullable | |
| created_at | timestamptz | |

### 2. `couples`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| partner_a | uuid FK profiles | first user |
| partner_b | uuid FK profiles | second user (set on invite accept) |
| created_at | timestamptz | |

### 3. `couple_invites`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK | |
| invited_by | uuid FK profiles | |
| invite_code | text unique | 6-char code |
| status | enum: pending/accepted/expired | |
| created_at | timestamptz | |

### 4. `sessions`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| couple_id | uuid FK | |
| technique_id | text | e.g. "imago_core_dialogue" |
| started_at | timestamptz | |
| ended_at | timestamptz nullable | |
| status | enum: in_progress/completed/abandoned | |

### 5. `session_turns`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK | |
| state_key | text | e.g. "sender", "mirroring" |
| speaker_id | uuid FK profiles | who spoke |
| role | text | SENDER / RECEIVER |
| transcript | text | |
| selected_emotion | text nullable | |
| duration_seconds | int | |
| created_at | timestamptz | |

## Invite Flow

1. User A signs up → profile created (couple_id = null)
2. User A taps "Invite Partner" → creates a `couple` + `couple_invite` with a 6-char code
3. User A shares the code (copy/paste, message)
4. User B signs up → enters invite code → invite accepted → both profiles get `couple_id` set

## RLS Strategy

- **profiles**: Users can read/update their own row. Can read their partner's row (same couple_id).
- **couples**: Readable/updatable only by members (partner_a or partner_b = auth.uid()).
- **couple_invites**: Created by invite sender. Readable by sender or anyone with the code (for accepting).
- **sessions / session_turns**: Readable only by couple members. Insert only by couple members.

## Authentication

- Email + password signup with email verification (no auto-confirm)
- Google OAuth
- Profile auto-created on signup via database trigger
- Auth pages: Login, Signup, Forgot Password, Reset Password

## Implementation Steps

1. **Database migration** — Create all 5 tables, enums, RLS policies, and the profile auto-creation trigger
2. **Auth pages** — Login, Signup, Forgot Password, Reset Password with route guards
3. **Onboarding flow** — After signup, prompt for display name → show invite code screen (create couple) or enter code screen (join couple)
4. **Update Home page** — Show partner name, couple status; gate "Start Session" behind having a couple
5. **Session persistence** — On session start, insert into `sessions`; on each turn completion, insert into `session_turns`; on session end, update `sessions.ended_at`
6. **Journey page** — Query `sessions` + `session_turns` from the database instead of mock data

## What This Enables
- Each user has their own login
- Partners link via invite code (no email sharing required)
- All session data is stored per-couple
- Journey page shows real history
- Future: backend can select therapy technique per couple based on their history

