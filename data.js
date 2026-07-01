// Command Central data. Agents -> clients -> what each agent is doing for each.
// This file is what the agents will update to refresh status. Edit here to change the board.
window.CC_DATA = {
  agents: [
    {
      id: "sage",
      name: "Sage",
      role: "SEO & Analytics Watch",
      tagline: "She watches your search. Rankings, traffic, and what it all actually means, for every client.",
      avatar: "assets/sage.png",
      voice: "assets/sage-voice.m4a",
      status: "June reports sent · GA4 live",
      subjectsLabel: "Clients",
      clients: [
        { name: "Leslie M Lyon", status: "GA4 live", ok: true,
          summary: "Full SEO + analytics. Monthly report sent for June.",
          details: ["GSC: sc-domain:lesliemlyon.com", "GA4: connected (387989111)", "Organic search strong; Trial Reels content leads", "Weekly pulse + monthly report with action tasks"] },
        { name: "Roatan Life Real Estate", status: "GA4 live", ok: true,
          summary: "SEO + analytics. Big traffic: 10k+ sessions/month.",
          details: ["GSC: sc-domain:roatanlife.com", "GA4: connected (525965494)", "June sessions up sharply vs May", "Monthly report sent"] },
        { name: "Roatan.net — Steve Hasz", status: "GA4 live", ok: true,
          summary: "SEO + analytics for the second Roatan site.",
          details: ["GSC: sc-domain:roatan.net", "GA4: connected (527224391)", "Monthly report sent"] },
        { name: "Elite Concrete Coatings", status: "GSC only", ok: true,
          summary: "SEO monitoring. GA4 not yet connected.",
          details: ["GSC: sc-domain:eliteconcretecoatingsco.com", "GA4: needs Viewer access to add", "Monthly report sent"] },
        { name: "Hearthstone Restoration", status: "GSC only", ok: true,
          summary: "SEO monitoring. GA4 not yet connected.",
          details: ["GSC: sc-domain:hearthstonerestoration.com", "GA4: needs Viewer access to add", "Monthly report sent"] },
        { name: "Push The Goal — Soccer", status: "Fixed", ok: true,
          summary: "Was returning zeros; property fixed, now reporting.",
          details: ["GSC: https://push-the-goal.com/ (URL-prefix)", "June: 54 clicks, 1,154 impressions, 120 keywords", "Corrected report re-sent"] }
      ]
    },
    {
      id: "muse",
      name: "Muse",
      role: "Content Engine",
      tagline: "She writes in your voice. Blogs, captions, hooks, and subhooks, on brand every time.",
      avatar: "assets/muse.png",
      voice: "assets/muse-voice.m4a",
      status: "Voice library loaded · drafts queued",
      subjectsLabel: "Clients",
      clients: [
        { name: "Leslie M Lyon", status: "Active", ok: true,
          summary: "Blog + short-form. Your voice library is fully loaded.",
          details: ["Blog: scheduled drafts through mid-July", "Captions/hooks/subhooks: voice + examples captured", "Next: week-of-20 drafts + Collaborations quote card"] },
        { name: "Hearthstone Restoration", status: "Planned", ok: false,
          summary: "Captions engine planned; blog once their site is live.",
          details: ["Captions: config from their intake forms", "Blog: connect once WP + service pages finish", "Home-services / restoration ICP"] },
        { name: "Jack Chinchay Real Estate", status: "Planned", ok: false,
          summary: "Captions only. IG-only funnel (no website).",
          details: ["Caption = the funnel: comment-to-DM + link-in-bio", "Config pending his intake forms", "Real estate ICP"] }
      ]
    },
    {
      id: "vesta",
      name: "Vesta",
      role: "The Watchdog",
      tagline: "She watches the watchers. Drift, rule-breaks, and anything off, she catches it and tells you.",
      avatar: "assets/vesta.png",
      voice: "assets/vesta-voice.m4a",
      status: "27 files baselined · all steady",
      subjectsLabel: "Watching",
      clients: [
        { name: "Sage", status: "Steady", ok: true,
          summary: "Monitoring Sage's code + workflows for drift.",
          details: ["13 files baselined (.py + workflows)", "Last check: no drift", "Weekly, Mondays 8am"] },
        { name: "Muse", status: "Steady", ok: true,
          summary: "Monitoring Muse's voice, frameworks + rules.",
          details: ["14 files baselined (profile, method, frameworks)", "Also scans recent posts for rule breaks", "Last check: no drift"] }
      ]
    }
  ]
};
