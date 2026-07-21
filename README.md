# Little Day 🌅

**Big Adventures. Little Days.** — a family adventure planner for the Katonah, NY area.

This is the real, deployable version of the app. Follow the steps below to get it
live at a link you can share with parents.

---

## What works right now

- The full day planner (age pre-set per child, budget, "home by," nap guardrail,
  lunch & treat stops, weather swaps, packing list) + Reshuffle & Surprise Me
- **99 real, verified places** across ~30 Westchester towns — playgrounds, farms,
  pools, restaurants, classes & activities, farmers markets — with an interactive
  Google Map, search, and filters
- Kid profiles with birthdays, babysitters with one-tap plan sharing, check-ins &
  punch-card rewards, the Adventure Passport (stamps, badges, streaks), reviews,
  a Safety & Prep tab (car seat checks, CPR classes), and day-of event highlighting
- **On-device saving:** kids, sitters, favorites, saved days, check-ins and passport
  progress persist on each person's phone (no accounts needed)

**Still prototype-only:** friends/invites don't reach other people, reviews aren't
shared between users, rewards are samples, and there are no payments — those need
the backend (a later step). Data is per-device until accounts exist.

---

## Before you start — two things to know

1. **Private repo + GitHub Pages needs a paid plan.** GitHub Pages is free for
   *public* repos. To keep your repo *private* AND publish with Pages, you need
   **GitHub Pro** (about $4/month). Either upgrade to Pro, or make the repo public.
   Note: the published website is public to anyone with the link either way — only
   your source code stays hidden on a private repo.

2. **Google Maps needs a credit card on file.** The key is free and a small beta will
   almost certainly cost **$0** (you get 10,000 free map loads/month), but Google
   requires billing to be enabled. You'll restrict the key so no one else can use it.

---

## Step 1 — Get your Google Maps key

1. Go to <https://console.cloud.google.com/> and sign in.
2. Create a new project (top bar → "Select a project" → "New Project"). Name it
   "Little Day."
3. In the search bar, find and **enable** the **"Maps JavaScript API."**
4. Set up **Billing** when prompted (Billing → link a credit card). This is required.
5. Go to **APIs & Services → Credentials → Create credentials → API key.** Copy the key.
6. Click the key to edit it and **restrict it** (very important):
   - **Application restrictions → Websites (HTTP referrers).** Add these two
     (you'll get your real site URL after Step 4 — come back and add it then):
     - `http://localhost:5173/*`  (for testing on your computer)
     - `https://YOUR-GITHUB-USERNAME.github.io/*`  (your live site)
   - **API restrictions → Restrict key →** select **Maps JavaScript API** only.
   - Save.

Keep this key handy for Step 3.

---

## Step 2 — Put the code on GitHub

Easiest path (no command line): use **GitHub Desktop**.

1. Download GitHub Desktop: <https://desktop.github.com/>
2. In GitHub, create your repository (private or public — see the note above).
3. In GitHub Desktop: **File → Clone repository →** pick your new repo.
4. Copy **all the files from this folder** into the cloned folder on your computer
   (everything: `src/`, `index.html`, `package.json`, `.github/`, etc.).
5. Back in GitHub Desktop you'll see the files listed. Type a summary like
   "Initial Little Day app" and click **Commit to main**, then **Push origin**.

---

## Step 3 — Add your Maps key as a repository secret

So the key stays out of your code:

1. On GitHub, open your repo → **Settings → Secrets and variables → Actions.**
2. Click **New repository secret.**
3. Name: `VITE_GOOGLE_MAPS_API_KEY`
4. Value: paste your Google Maps key from Step 1.
5. Save.

---

## Step 4 — Turn on GitHub Pages

1. On GitHub, open your repo → **Settings → Pages.**
2. Under **Build and deployment → Source**, choose **GitHub Actions.**
3. That's it — the included workflow (`.github/workflows/deploy.yml`) does the rest.

Every time you push to `main`, the site rebuilds and deploys automatically. The first
deploy takes 1–2 minutes. Your live link will appear under **Settings → Pages** and in
the **Actions** tab, and looks like:

`https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPO-NAME/`

---

## Step 5 — Finish the Maps key restriction

Now that you know your live URL, go back to your Google Maps key (Step 1.6) and make
sure the **HTTP referrers** list includes your real Pages URL, e.g.
`https://YOUR-GITHUB-USERNAME.github.io/*`. Save. Give it a few minutes to take effect.

**You're live!** Share the link with a few Katonah parents.

---

## Running it on your own computer (optional)

You'll need **Node.js** (LTS) from <https://nodejs.org/>. Then, in this folder:

```bash
npm install
cp .env.example .env        # then paste your key into .env
npm run dev                 # opens http://localhost:5173
```

---

## Costs summary

| Thing | Cost |
| --- | --- |
| The app code | Free |
| GitHub public repo + Pages | Free |
| GitHub **private** repo + Pages | ~$4/mo (GitHub Pro) |
| Google Maps (small beta) | $0 within 10,000 loads/month (card required) |

---

## What's next (when you're ready)

- **Accounts + saving** (Supabase) so favorites, saved days, and theme stick, and so
  friends & play dates actually reach other people.
- **Real hours, weather, and events** from live data sources (they're estimates now).
- **Real AI planning** via a server that safely holds a Claude API key.
