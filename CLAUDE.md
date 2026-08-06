# Command Central — Agent Hub

Command Central is Leslie M Lyon's hub for her three AI agents. This repo holds the
**dashboard UI** (`index.html` + `app.js` + `style.css` + `assets/`). Its more
important job: it is the **front door that loads the whole agent team.**

> ⚠️ The live site is **not deployed from this repo.** See "How the dashboard
> actually gets built" below before changing anything about the dashboard.

## The three agents (each lives in its own private repo)

| Agent | Role | Repo |
|-------|------|------|
| **Sage** | SEO & Analytics Watch | `queen-lml/gsc-monitoring-agent` |
| **Muse** | Content Engine — captions, reels, blogs, newsletters, brand voice | `queen-lml/muse` |
| **Vesta** | The Watchdog — watches the other agents for drift and rule-breaks | `queen-lml/vesta` |

## START HERE — load the team at the start of every session

When a session opens on Command Central, **connect all three agents** so their
voice guides, client profiles, frameworks, and rules are in context. For each
repo in the table above:

1. `add_repo` with owner `queen-lml` and the repo name.
2. Clone it: `git clone --depth 1 https://github.com/queen-lml/<repo> /workspace/<repo>`
3. `register_repo_root` for it (this loads its `CLAUDE.md`, skills, and rules).

Then operate **as the relevant agent** for the task at hand:

- SEO, rankings, Google Search Console, analytics, site audits → **Sage**
- captions, reels, blogs, newsletters, brand voice → **Muse** — follow her
  `voice-guide.md` and each client's `clients/<name>/profile.md` **exactly**
  (hard rules: no em dashes, no "actually", no "not X it's Y" reversals, max 5
  hashtags, positive BAH framing for Jack, etc.).
- checking the other agents for drift, rule-breaks, or anything off → **Vesta**

### Hearthstone Restoration (Muse's flagship client) — where everything lives
All in `queen-lml/muse` under `clients/hearthstone/`: profile + rules (`profile.md`),
approved captions + hooks (`captions-for-approval.md`, `hooks-subhooks-batch1.md`),
blog engine (`blog/`: SEO kit, editorial calendar, drafts, `publish_hearthstone.py`),
deliverable PDFs (`deliverables/`), site policy docs (`legal/`). WordPress publishing
runs via the muse repo's GitHub Action "Publish to Hearthstone WordPress" (secrets:
`HEARTHSTONE_WP_USER` / `HEARTHSTONE_WP_APP_PASSWORD`; drafts only, humans publish).
Client approval docs live in Google Drive: "2-Hearthstone Restoration" → "Blog Posts
for Approval" + "Policies on Site". Hard rules: full name "Hearthstone Restoration",
no pricing, no storm/insurance, CertainTeed exclusive, SureStart PLUS 4-Star.

## How the dashboard actually gets built (read before touching it)

The dashboard at **cc-lyon** (Cloudflare Pages) is built and deployed by the
**"Command Central Dashboard"** workflow in `queen-lml/gsc-monitoring-agent`
(`.github/workflows/dashboard.yml`), on a **cron every 6 hours**. That workflow:

1. runs `build_dashboard.py`, which pulls **live** GSC + GA4 per Sage client,
   live WordPress scheduled/draft counts, live GHL bookings, and Vesta's latest
   `dashboard/vesta_status.json`,
2. writes `dashboard/data.js`,
3. deploys that repo's `dashboard/` folder to the `cc-lyon` Pages project.

So there is **one deployer**, and it is the Sage repo. Consequences:

- **Adding or updating a client on the dashboard = edit
  `gsc-monitoring-agent/roster.json`** (Muse's clients + Vesta's watch list).
  Sage's client list is not there: it comes from `CLIENTS` in
  `send_monthly_report.py`, the same list her reports run on.
- **UI changes** (`index.html`, `app.js`, `style.css`, `assets/`) must be
  **mirrored into `gsc-monitoring-agent/dashboard/`** or they never go live.
  The two copies are identical today, keep them that way.
- This repo's `data.js` is a **local preview mirror only**. It is not what
  production serves. Do not treat it as the roster.
- This repo's `deploy.yml` is **manual-only on purpose**. It used to run on every
  push to main, which overwrote the freshly built site with this repo's stale
  hand-edited `data.js` until the next 6-hour build. That is why the dashboard
  kept showing the wrong clients. Do not put it back on `push`.

## Keeping the cloud in sync (source of truth = GitHub)

Each agent's files live in **its own repo**, and GitHub is the single source of
truth in the middle that keeps Leslie's Mac and the cloud sessions matched.

When you change an agent's files (voice guide, client profile, a new caption, a
rule tweak):

- Commit and push the change back to **that agent's repo** (e.g. edits to Muse
  → push to `queen-lml/muse`), **not** to this hub repo.
- **Only push after Leslie approves the change.** Never push to her agent repos
  silently.
- If Leslie may have edited on her Mac, `git pull` that repo **before** editing
  so there are no conflicts.

This repo (`command-central`) itself only changes when the dashboard or this hub
document changes.

## Sync flow, at a glance

```
Leslie's Mac  <-->  GitHub (muse / vesta / gsc-monitoring-agent)  <-->  Cloud session
  (terminal)              the source of truth                          (this chat)
```

Edit in a session -> push to the agent's repo -> Leslie pulls on her Mac.
Edit on the Mac -> push -> next cloud session pulls. Everyone stays matched.
