# Little Day — Backend setup (Phase 2)

## A. Create the project (10 min)
1. supabase.com -> Start your project (free) -> New project "little-day"
2. Save two values from Settings -> API: the **Project URL** and the **anon public key**
3. SQL Editor -> New query -> paste ALL of `schema.sql` -> Run

## B. Give them to Claude
Paste the Project URL + anon key into the Claude chat.
Claude will wire the app: login screen, cloud sync for kids/sitters/favorites/
saved days/passport, shared reviews, real invite links, and play dates that
actually reach the other parent. (The anon key is safe to be public — Row Level
Security in the schema is what protects each family's data.)

## C. Real AI planning (optional, after A+B works)
1. Get an Anthropic API key at console.anthropic.com
2. Install the Supabase CLI, then:
   supabase functions deploy plan-day
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
3. Tell Claude it's deployed — the app's "Build my day" gets an AI mode with
   the key held safely server-side.

## What this replaces
- Per-device storage -> real accounts that sync across devices
- Sample reviews -> real shared reviews from all parents
- Preview invites -> invite links that actually connect people
- Rule-based planning -> Claude-powered planning (with the rule-based one as fallback)
