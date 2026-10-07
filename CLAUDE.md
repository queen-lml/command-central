# Command Central — Agent Hub

Command Central is Leslie M Lyon's hub for her AI agents: three work agents
and Maya, her personal health agent. This repo holds the
**dashboard UI** (`index.html` + `app.js` + `style.css` + `assets/`). Its more
important job: it is the **front door that loads the whole agent team.**

> ⚠️ The live site is **not deployed from this repo.** See "How the dashboard
> actually gets built" below before changing anything about the dashboard.

## The agents (each lives in its own private repo)

| Agent | Role | Repo |
|-------|------|------|
| **Sage** | SEO & Analytics Watch | `queen-lml/gsc-monitoring-agent` |
| **Muse** | Content Engine — captions, reels, blogs, newsletters, brand voice | `queen-lml/muse` |
| **Vesta** | The Watchdog — watches the other agents for drift and rule-breaks | `queen-lml/vesta` |
| **Maya** | Personal health: perimenopause, BHRT, labs, cycle, food, exercise. **On request only** (see below) | `queen-lml/maya` |

## START HERE — load the team at the start of every session

When a session opens on Command Central, **connect the three work agents** (Sage,
Muse, Vesta) so their
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

### Maya joins only when Leslie asks for her
Maya holds Leslie's private health records. **Do not load her at session start.**
Connect her (same 3 steps, repo `maya`) only when Leslie asks for Maya by name or
brings up her own health in that session. Then:
- Her dashboard card is a portrait (`assets/maya.png`) and role only, built in
  `gsc-monitoring-agent/build_dashboard.py`.
- Her health data never goes into the dashboard, `roster.json`, `work.json`,
  client work, or any other repo. Vesta does not scan her.
- Maya's own `CLAUDE.md` rules apply, including: she never tells Leslie to
  change a BHRT dose or prescription; she writes the question for the prescriber.

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
   live WordPress scheduled/draft counts for the client blogs, live GHL
   bookings, and Vesta's latest `dashboard/vesta_status.json`,
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

## lesliemlyon.com left WordPress (2026-10-07)

Leslie's own site is a static Astro build deployed from
`queen-lml/lesliemlyon`, not WordPress. Nothing should ask it for
`/wp-json/`; the domain answers that with the new site's 404 page, which a
careless reader takes for an empty blog.

- It publishes **by rebuild**. A post dated in the future is left out of the
  build, and an hourly cron puts it live once its date passes. There is no
  draft or scheduled state on the server.
- Its build commits `blog-queue.json`, which is what the dashboard's Blog tab
  and Muse's daily digest read in place of the REST API. The dashboard needs
  `LESLIEMLYON_REPO_TOKEN` (fine-grained, that repo, Contents read-only) to
  see it, since the repo is private.
- **Overdue** on the Blog card means a post's date passed and the rebuild
  never ran, so the scheduler is down. That is the one way publishing can now
  fail quietly.
- The three client blogs are still WordPress and still watched by
  `queen-lml/muse`'s `blog-watch.yml`. None of this touches them.

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

## Codex review before merging

For agent-authored changes in this repository:
- Work on a branch and open a non-draft pull request when the change is ready.
  Do not push these changes directly to main or merge immediately after opening.
- Wait for the authenticated chatgpt-codex-connector[bot] review to complete for
  the PR's current head commit. A queued review, a reaction alone, or a completed
  review of an older commit is not sufficient. Read the review findings as well
  as the completion summary; "Completed" does not mean there were no findings.
- Address actionable findings and run the relevant checks. If a finding is
  disputed, explain the evidence and leave the PR open for Leslie's decision.
- After review fixes or other code changes, request one new review for the
  latest commit if none starts automatically. A subsequent push must not be assumed to trigger another review.
- If review is unavailable, fails, or cannot be verified, leave the PR open and
  report the blocker with its link. Never treat a timeout as approval.
- Merge only when the current commit has completed review, findings are
  addressed, required checks pass, and Leslie's task authorizes merging.
  This rule does not grant new merge, deployment, or publishing permission.
- Give Leslie the clickable PR link and a brief review/check status. Check
  review status at sensible intervals rather than repeatedly re-reading the repo.

Existing scheduled automation is unchanged by this instruction; changes to
its code still follow this process. Preserve all existing requirements for
Leslie's approval before pushing or publishing. Permission to push immediately
means pushing to the working branch; it does not bypass review before merging.
These are agent instructions, not a GitHub-enforced branch protection.

