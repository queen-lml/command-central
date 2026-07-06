# Command Central — Agent Hub

Command Central is Leslie M Lyon's hub for her three AI agents. This repo itself
is the **status dashboard** (a static site: `index.html` + `data.js` + `app.js`,
deployed via Cloudflare, see `wrangler.toml`). Its more important job: it is the
**front door that loads the whole agent team.**

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
