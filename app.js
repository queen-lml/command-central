(function () {
  var view = document.getElementById('view');
  var data = window.CC_DATA;

  function agentById(id) { return data.agents.filter(function (a) { return a.id === id; })[0]; }

  function playVoice(src) { try { new Audio(src).play().catch(function () {}); } catch (e) {} }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  // ---- Client Work (data.work, from work.json) ----
  var work = data.work || null;
  var vendors = data.vendors || null;

  // Check-offs: "Mark done" on a Mine item saves to work.json on GitHub through
  // /api/done (functions/api/done.js). Until the next build, this device keeps
  // the item shown as done from localStorage.
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function pending() { try { return JSON.parse(store('cc_done') || '{}'); } catch (e) { return {}; } }
  function markLocal(it, date, note) {
    it.stage = 'live'; it.waitingOn = 'nobody'; it.since = date; it.next = 'Nothing.'; delete it.due;
    it.why = 'Checked off by you ' + date + (note ? ': ' + note : '.');
    if (it.monthly && it.target) it.done = it.target;
  }
  if (work) {
    var _p = pending(), _keep = {};
    work.clients.forEach(function (c) {
      c.items.forEach(function (it) {
        it._client = c.name;
        var k = c.name + '|' + it.title;
        if (_p[k] && it.waitingOn === 'leslie') { markLocal(it, _p[k].date, _p[k].note); _keep[k] = _p[k]; }
      });
    });
    store('cc_done', JSON.stringify(_keep));
  }
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var today = new Date();
  var THIS_MONTH = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2);

  function daysSince(d) {
    if (!d) return null;
    var t = Date.parse(d + 'T12:00:00');
    return isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 86400000));
  }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  function linkify(t) {
    return esc(t).split(' | ').map(function (part) {
      // "Label: https://..." -> a link named Label
      var m = part.match(/^([^:]{1,60}?):\s*(https?:\/\/\S+)\s*$/);
      if (m) return '<a href="' + m[2] + '" target="_blank" rel="noopener">' + m[1] + '</a>';
      part = part.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">open</a>');
      // repo paths like muse/clients/x.md -> GitHub
      return part.replace(/(^|\s)((muse|vesta|gsc-monitoring-agent|command-central)\/[^\s]+)/g, function (m, sp, path, repo) {
        var rest = path.slice(repo.length + 1);
        var kind = /\/$/.test(rest) || !/\.[a-z0-9]+$/i.test(rest) ? 'tree' : 'blob';
        return sp + '<a href="https://github.com/queen-lml/' + repo + '/' + kind + '/main/' + rest.replace(/\/$/, '') + '" target="_blank" rel="noopener">' + rest.split('/').filter(Boolean).pop() + '</a>';
      });
    }).join(' &middot; ');
  }

  // Which section an item lives in: progress, future, done, dream (or old = done before this month).
  function isDone(it) {
    return it.stage === 'live' && (it.waitingOn || 'nobody') === 'nobody' &&
      (!it.monthly || !it.target || (it.done || 0) >= it.target);
  }
  function bucket(it) {
    if (it.bucket) return it.bucket;
    if (isDone(it)) return (it.month || (it.since || '').slice(0, 7)) < THIS_MONTH ? 'old' : 'done';
    var w = it.waitingOn || 'nobody';
    if (it.month && it.month > THIS_MONTH && w !== 'leslie' && w !== 'client' && w !== 'vendor') return 'future';
    if (w === 'nobody' && it.stage !== 'ready' && it.stage !== 'live') return 'future';   // parked
    return 'progress';
  }

  // The status tag on the right of each row.
  function tag(it) {
    var w = it.waitingOn || 'nobody';
    if (isDone(it)) return { cls: 'done', text: 'Done' };
    if (w === 'leslie') return { cls: 'mine', text: 'Mine' };
    if (w === 'client') return { cls: 'theirs', text: 'Theirs' };
    if (w === 'vendor') return { cls: 'vendor', text: 'Vendor' };
    if (w === 'smm' || w === 'va') return { cls: 'team', text: it.who || (w === 'smm' ? 'Social manager' : 'VA') };
    if (w === 'muse') return { cls: 'muse', text: 'Muse' };
    if (it.stage === 'ready' || it.stage === 'live') return { cls: 'sched', text: 'Scheduled' };
    return { cls: 'later', text: 'Later' };
  }
  var ORDER = { mine: 0, team: 1, theirs: 2, vendor: 3, muse: 4, sched: 5, later: 6, done: 7 };

  function dueText(it) {
    var t = tag(it);
    if (it.due) {
      var d = new Date(it.due + 'T12:00:00'), late = d < new Date(today.toDateString());
      return '<span class="due' + (late ? ' late' : '') + '">' + (late ? 'Overdue ' : 'Due ') +
        d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '</span>';
    }
    var n = daysSince(it.since);
    if ((t.cls === 'theirs' || t.cls === 'vendor' || t.cls === 'mine' || t.cls === 'team') && n) {
      return '<span class="due' + (n >= 14 ? ' late' : '') + '">' + (t.cls === 'mine' ? 'On you ' : 'Waiting ') + plural(n, 'day') + '</span>';
    }
    return '';
  }

  function rowHTML(it, clientName) {
    var t = tag(it), done = t.cls === 'done';
    // Work that is written and scheduled is not done, but it is not nothing
    // either. It gets the pale half of the bar so a month that looks like
    // "0 of 18" still shows the nine already in the queue.
    var ready = (it.progress && it.progress.ready) || 0;
    var count = it.monthly && it.target
      ? ' <b>' + (it.done || 0) + ' of ' + it.target + '</b>' + (ready && !done ? ' &middot; ' + ready + ' scheduled' : '') : '';
    function pct(n) { return Math.max(0, Math.min(100, 100 * n / it.target)); }
    var bar = it.monthly && it.target && (it.done || ready) && !done
      ? '<div class="bar"><i style="width:' + pct(it.done || 0) + '%"></i>' +
        (ready ? '<u style="width:' + Math.min(pct(ready), 100 - pct(it.done || 0)) + '%"></u>' : '') + '</div>' : '';
    return '<div class="row' + (done ? ' isdone' : '') + '">' +
      '<button class="rhead">' +
        '<span class="rt">' + (clientName ? '<span class="rclient">' + esc(clientName) + '</span>' : '') + esc(it.title) + '</span>' +
        '<span class="rn">' + esc(done ? (it.why || '') : (it.next || it.why || '')) + count + '</span>' + bar +
        '<span class="rr"><span class="tag t-' + t.cls + '">' + esc(t.text) + '</span>' + dueText(it) + '</span>' +
      '</button>' +
      '<div class="more">' +
        (it.why ? '<p><b>Why:</b> ' + esc(it.why) + '</p>' : '') +
        (it.liveNote ? '<p>' + esc(it.liveNote) + (it.type === 'blog' ? ' <a href="#blog">See the schedule</a>' : '') + '</p>' : '') +
        (it.next && !done ? '<p><b>Next:</b> ' + esc(it.next) + '</p>' : '') +
        (it.where ? '<p><b>Links:</b> ' + linkify(it.where) + '</p>' : '') +
        (it.vendor ? '<p><b>Vendor:</b> ' + esc([].concat(it.vendor).join(', ')) + '</p>' : '') +
        (t.cls === 'mine' && it._client ? '<div class="checkoff" data-client="' + esc(it._client) + '" data-title="' + esc(it.title) + '">' +
          '<input type="text" class="conote" maxlength="500" placeholder="Optional note, e.g. what you set up" aria-label="Note">' +
          '<button type="button" class="cobtn">Mark done</button><span class="comsg" role="status"></span></div>' : '') +
      '</div>' +
    '</div>';
  }

  function sectionHTML(n, title, note, items, empty, clientOf) {
    return '<section class="wsec"><div class="sh"><span class="num">' + n + '</span><h3>' + title + '</h3><small>' + note + '</small></div>' +
      (items.length ? items.map(function (it) { return rowHTML(it, clientOf && clientOf(it)); }).join('') : '<p class="empty">' + empty + '</p>') +
    '</section>';
  }

  function sortRows(a, b) {
    return ORDER[tag(a).cls] - ORDER[tag(b).cls] || (a.due || 'z').localeCompare(b.due || 'z') ||
      (daysSince(b.since) || 0) - (daysSince(a.since) || 0);
  }

  function socialHTML(s) {
    if (!s) return '';
    var bits = [];
    if (s.reels) bits.push(plural(s.reels, 'reel'));
    if (s.carousels) bits.push(plural(s.carousels, 'carousel'));
    if (s.posts) bits.push(plural(s.posts, 'single post'));
    return '<p class="wsocial"><b>Instagram @' + esc(s.username) + ' this month:</b> ' + s.total + ' posted' +
      (s.unique && s.unique < s.total ? ' from ' + s.unique + ' unique pieces' : '') +
      (bits.length ? ' (' + bits.join(', ') + ')' : '') +
      (s.last ? ' &middot; last post ' + esc(s.last) : '') + '</p>';
  }

  function listingsHTML(c) {
    if (!c.listings || !c.listings.length) return '';
    return '<div class="wlistings"><h4>' + esc(c.listingsTitle || 'Listings') + '</h4><ul>' + c.listings.map(function (l) {
      return '<li><a href="' + esc(l.link) + '" target="_blank" rel="noopener">' + esc(l.address) + '</a>' +
        ' <span class="lf">' + esc(l.town) + (l.facts ? ' &middot; ' + esc(l.facts) : '') + '</span>' +
        (l.status ? ' <span class="tag t-sched">' + esc(l.status) + '</span>' : '') + '</li>';
    }).join('') + '</ul></div>';
  }

  function teamOf(c) { return (c.team || []).filter(function (p) { return p && p.name; }); }
  function allTeam() {
    var seen = {}, out = [];
    (work ? work.clients : []).forEach(function (c) {
      teamOf(c).forEach(function (p) { if (!seen[p.name]) { seen[p.name] = 1; out.push(p); } });
    });
    return out;
  }
  function mineItems() {
    var out = [];
    work.clients.forEach(function (c) {
      c.items.forEach(function (it) { if (it.waitingOn === 'leslie' && !it.bucket) out.push({ c: c, it: it }); });
    });
    return out;
  }

  function pillsHTML(active) {
    var mine = mineItems().length;
    return '<nav class="pills">' +
      '<a class="pill my' + (active === 'mine' ? ' on' : '') + '" href="#work/mine">My list <b>' + mine + '</b></a>' +
      work.clients.map(function (c) {
        var n = c.items.filter(function (it) { return it.waitingOn === 'leslie' && !it.bucket; }).length;
        return '<a class="pill' + (active === slug(c.name) ? ' on' : '') + '" href="#work/' + slug(c.name) + '">' + esc(c.short || c.name) +
          (n ? ' <i class="pdot" title="' + n + ' on you"></i>' : '') + '</a>';
      }).join('') +
      allTeam().map(function (p) {
        return '<a class="pill person' + (active === 'team-' + slug(p.name) ? ' on' : '') + '" href="#team/' + slug(p.name) + '">' + esc(p.name) + '\'s list</a>';
      }).join('') +
    '</nav>';
  }

  function countsHTML(list) {
    var by = {};
    list.forEach(function (x) { var b = bucket(x); var k = b === 'progress' ? tag(x).cls : b; by[k] = (by[k] || 0) + 1; });
    var cells = [['mine', 'Mine'], ['team', 'Team'], ['theirs', 'Theirs'], ['vendor', 'Vendor'], ['future', 'Future'], ['done', 'Done in ' + MONTHS[today.getMonth()].slice(0, 3)]]
      .filter(function (c) { return c[0] !== 'team' || by.team; });
    return '<div class="counts">' + cells.map(function (c) {
      return '<div class="count c-' + c[0] + '"><b>' + (by[c[0]] || 0) + '</b>' + c[1] + '</div>';
    }).join('') + '</div>';
  }

  function clientHTML(c) {
    var items = c.items.slice();
    function inB(b) { return items.filter(function (it) { return bucket(it) === b; }).sort(sortRows); }
    var prog = inB('progress'), fut = inB('future'), done = inB('done'), dream = inB('dream'), old = inB('old');
    var team = teamOf(c);
    return '<div class="chead"><h2>' + esc(c.name) + '</h2>' +
        (c.scope ? '<p>' + esc(c.scope) + (c.cadence ? ' &middot; ' + esc(c.cadence) : '') + '</p>' : '') +
        (team.length ? '<p class="team"><b>Team:</b> ' + team.map(function (p) {
          return '<a href="#team/' + slug(p.name) + '">' + esc(p.name) + '</a>' + (p.role ? ' (' + esc(p.role) + ')' : '');
        }).join(', ') + '</p>' : '') +
      '</div>' +
      countsHTML(items) +
      socialHTML(c.social) +
      listingsHTML(c) +
      sectionHTML(1, 'In progress', 'Mine first, then theirs, vendor, Muse', prog, 'Nothing in progress.') +
      sectionHTML(2, 'Future tasks', 'Coming up next', fut, 'Nothing queued.') +
      sectionHTML(3, 'Done this month', MONTHS[today.getMonth()], done, 'Nothing finished yet this month.') +
      (old.length ? '<details class="older"><summary>Done before this month &middot; ' + old.length + '</summary>' +
        old.map(function (it) { return rowHTML(it); }).join('') + '</details>' : '') +
      '<section class="wsec"><div class="sh"><span class="num">4</span><h3>Dream projects</h3><small>For when you\'re caught up</small></div>' +
        (dream.length ? dream.map(function (it) { return rowHTML(it); }).join('')
          : '<div class="dream"><b>Empty for now.</b> Tell Muse the big ideas you never get to, and they will live here until there is room.</div>') +
      '</section>';
  }

  function myListHTML() {
    var rows = mineItems();
    var by = {};
    rows.forEach(function (r) { by[r.it.title] = r.c.name; });
    // Leslie's own business admin (personal: true in work.json) sorts after client work.
    var its = rows.map(function (r) { return r.it; }).sort(function (a, b) {
      return (a.personal ? 1 : 0) - (b.personal ? 1 : 0) || sortRows(a, b);
    });
    return '<div class="chead"><h2>My list</h2><p>Everything waiting on you, across every client. Tap a client above for their full page.</p></div>' +
      sectionHTML(1, 'Mine', plural(its.length, 'item'), its, 'Nothing is waiting on you. 🎉', function (it) { return by[it.title]; });
  }

  function personHTML(name) {
    var p = allTeam().filter(function (x) { return slug(x.name) === name; })[0];
    if (!p) return '<p class="empty">No one by that name on the team.</p>';
    var rows = [];
    work.clients.forEach(function (c) {
      if (!teamOf(c).some(function (x) { return x.name === p.name; })) return;
      c.items.forEach(function (it) { if (it.who === p.name) rows.push({ c: c, it: it }); });
    });
    var by = {};
    rows.forEach(function (r) { by[r.it.title] = r.c.name; });
    var its = rows.map(function (r) { return r.it; });
    var open = its.filter(function (it) { return !isDone(it); }).sort(sortRows), done = its.filter(isDone);
    var clients = work.clients.filter(function (c) { return teamOf(c).some(function (x) { return x.name === p.name; }); });
    return '<div class="chead"><h2>' + esc(p.name) + '\'s list</h2><p>' + esc(p.role || 'Team') + ' &middot; ' +
        clients.map(function (c) { return '<a href="#work/' + slug(c.name) + '">' + esc(c.name) + '</a>'; }).join(', ') + '</p></div>' +
      sectionHTML(1, 'Assigned to ' + esc(p.name), plural(open.length, 'item'), open, 'Nothing assigned right now.', function (it) { return by[it.title]; }) +
      sectionHTML(2, 'Done', '', done, 'Nothing done yet.', function (it) { return by[it.title]; });
  }

  function workHTML(sub) {
    if (!work) return '<p class="empty">No client work data yet.</p>';
    var page, active;
    if (sub.indexOf('team/') === 0) { active = 'team-' + sub.slice(5); page = personHTML(sub.slice(5)); }
    else {
      var key = sub.replace(/^work\/?/, '') || slug(work.clients[0].name);
      var c = work.clients.filter(function (x) { return slug(x.name) === key; })[0];
      active = c ? key : 'mine';
      page = c ? clientHTML(c) : myListHTML();
    }
    return pillsHTML(active) + '<div class="page">' + page + '</div>';
  }

  // ---- Vendors ----
  function openOrders(name) {
    var out = [];
    (work ? work.clients : []).forEach(function (c) {
      c.items.forEach(function (it) {
        var v = [].concat(it.vendor || []);
        if (v.indexOf(name) !== -1 && !isDone(it)) out.push({ c: c.name, it: it });
      });
    });
    return out;
  }

  function vendorHTML(v) {
    var orders = openOrders(v.name);
    return '<div class="chead"><p class="cat">' + esc(v.category || 'Vendors') + '</p><h2>' + esc(v.name) + '</h2>' +
        (v.what ? '<p>' + esc(v.what) + '</p>' : '') + '</div>' +
      (v.clients && v.clients.length ? '<p class="vchips">' + v.clients.map(function (c) { return '<span class="tag t-later">' + esc(c) + '</span>'; }).join(' ') + '</p>' : '') +
      '<section class="wsec vendor"><div class="sh"><span class="num">1</span><h3>About</h3></div>' +
        (v.why ? '<p><b>Why we use them:</b> ' + esc(v.why) + '</p>' : '') +
        '<p><b>Contact:</b> ' + (v.contact ? linkify(v.contact).replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>') : '<span class="fine">not added yet</span>') +
          (v.phone ? ' &middot; <a href="tel:' + esc(v.phone) + '">' + esc(v.phone) + '</a>' : '') + '</p>' +
        (v.cost ? '<p><b>Cost:</b> ' + esc(v.cost) + '</p>' : '') +
        (v.notes ? '<p class="fine">' + esc(v.notes) + '</p>' : '') +
      '</section>' +
      (v.where ? '<section class="wsec vendor"><div class="sh"><span class="num">2</span><h3>Sheets and links</h3></div>' +
        '<ul class="vlinks">' + v.where.split(' | ').map(function (l) { return '<li>' + linkify(l) + '</li>'; }).join('') + '</ul></section>' : '') +
      sectionHTML(v.where ? 3 : 2, 'Open orders', plural(orders.length, 'order'), orders.map(function (o) { return o.it; }),
        'No open orders.', function (it) { return orders.filter(function (o) { return o.it === it; })[0].c; });
  }

  function vendorsHTML(key) {
    var list = vendors ? vendors.vendors : [];
    if (!list.length) return '<div class="page"><p class="empty">No vendors yet.</p></div>';
    var cats = [];
    list.forEach(function (v) { var c = v.category || 'Vendors'; if (cats.indexOf(c) === -1) cats.push(c); });
    var cur = list.filter(function (v) { return slug(v.name) === key; })[0] || list[0];
    return '<nav class="pills">' + cats.map(function (cat) {
        return '<span class="pcat">' + esc(cat) + '</span>' + list.filter(function (v) { return (v.category || 'Vendors') === cat; }).map(function (v) {
          var n = openOrders(v.name).length;
          return '<a class="pill' + (v === cur ? ' on' : '') + '" href="#vendors/' + slug(v.name) + '">' + esc(v.name) +
            (n ? ' <b>' + n + '</b>' : '') + '</a>';
        }).join('');
      }).join('') + '</nav>' +
      '<div class="page">' + vendorHTML(cur) + '</div>';
  }

  // ---- Blog (data.blog, read live from WordPress at build time) ----
  // Three questions, one page: what went out this month, what is queued, and
  // what lands on which day. The calendar answers the third one at a glance,
  // which a list of dates never does.
  var blog = data.blog || null;

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(dt) { return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate()); }
  function parseYmd(s) { return new Date(s + 'T12:00:00'); }
  function longDate(s) {
    return parseYmd(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  function daysUntil(s) { return Math.round((parseYmd(s) - parseYmd(ymd(today))) / 86400000); }
  function whenText(n) {
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    return 'in ' + plural(n, 'day');
  }

  // One square per day. Filled = published, outlined = scheduled, faint = nothing.
  function calMonthHTML(y, m, byDay) {
    var first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
    var lead = (first.getDay() + 6) % 7;                 // weeks start Monday
    var cells = '', i, k, p, cls, dt;
    for (i = 0; i < lead; i++) cells += '<span class="cday pad"></span>';
    for (i = 1; i <= days; i++) {
      dt = new Date(y, m, i);
      k = ymd(dt);
      p = byDay[k];
      cls = 'cday' + (dt.getDay() % 6 === 0 ? ' wknd' : '');
      if (p) cls += p.kind === 'published' ? ' pub' : ' sched';
      if (k === ymd(today)) cls += ' now';
      cells += '<span class="' + cls + '"' + (p ? ' title="' + esc(p.title) + '"' : '') + '>' +
        '<b>' + i + '</b>' + (p ? '<i></i>' : '') + '</span>';
    }
    return '<div class="cal"><div class="calhd">' + MONTHS[m] + ' ' + y + '</div>' +
      '<div class="dow">' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d) {
        return '<span>' + d + '</span>';
      }).join('') + '</div>' +
      '<div class="cgrid">' + cells + '</div></div>';
  }

  function calendarsHTML(published, scheduled) {
    var byDay = {}, months = [], seen = {};
    function put(list, kind) {
      list.forEach(function (p) {
        byDay[p.date] = { kind: kind, title: p.title };
        var mk = p.date.slice(0, 7);
        if (!seen[mk]) { seen[mk] = 1; months.push(mk); }
      });
    }
    put(published, 'published');
    put(scheduled, 'scheduled');
    // This month and next are always drawn, even when empty. An empty November
    // is the useful answer to "what is dripping out", not a missing panel.
    [new Date(today.getFullYear(), today.getMonth(), 1),
     new Date(today.getFullYear(), today.getMonth() + 1, 1)].forEach(function (dt) {
      var mk = dt.getFullYear() + '-' + pad2(dt.getMonth() + 1);
      if (!seen[mk]) { seen[mk] = 1; months.push(mk); }
    });
    months.sort();
    return '<div class="cals">' + months.map(function (mk) {
      return calMonthHTML(+mk.slice(0, 4), +mk.slice(5, 7) - 1, byDay);
    }).join('') + '</div>' +
      '<p class="callegend"><span class="lg pub"></span> Published' +
      ' <span class="lg sched"></span> Scheduled' +
      ' <span class="lg none"></span> Nothing booked</p>';
  }

  function postRowHTML(p, kind) {
    var n = kind === 'scheduled' ? daysUntil(p.date) : null;
    return '<div class="brow ' + kind + '">' +
      '<span class="bdate"><b>' + parseYmd(p.date).getDate() + '</b>' +
        parseYmd(p.date).toLocaleDateString('en-US', { month: 'short' }) + '</span>' +
      '<span class="btitle"><a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>' +
        '<small>' + longDate(p.date) + (n !== null ? ' &middot; ' + whenText(n) : '') + '</small></span>' +
      '<span class="tag ' + (kind === 'published' ? 't-done' : kind === 'scheduled' ? 't-sched' : 't-muse') + '">' +
        (kind === 'published' ? 'Live' : kind === 'scheduled' ? 'Queued' : 'Draft') + '</span>' +
    '</div>';
  }

  function postListHTML(list, kind, empty) {
    return list.length ? list.map(function (p) { return postRowHTML(p, kind); }).join('')
      : '<p class="empty">' + empty + '</p>';
  }

  function blogHTML() {
    if (!blog) return '<div class="page"><p class="empty">WordPress was not reachable on the last build, so there is nothing to show yet.</p></div>';
    var live = blog.published.slice(), sched = blog.scheduled.slice(), drafts = blog.drafts.slice();
    sched.sort(function (a, b) { return a.date.localeCompare(b.date); });
    live.sort(function (a, b) { return b.date.localeCompare(a.date); });

    // Gap since the last thing that actually went out, which is the number
    // that matters when the month's published count is still zero.
    var all = blog.recent.concat(live).filter(function (p) { return p.date <= ymd(today); });
    all.sort(function (a, b) { return a.date.localeCompare(b.date); });
    var lastOut = all.length ? all[all.length - 1] : null;
    var gap = lastOut ? -daysUntil(lastOut.date) : null;
    var next = sched.filter(function (p) { return daysUntil(p.date) >= 0; })[0];

    var note = '';
    if (gap !== null && gap >= 7) {
      note = '<div class="bnote"><b>' + plural(gap, 'day') + ' since anything went out.</b> ' +
        'Last live post was &ldquo;' + esc(lastOut.title) + '&rdquo; on ' + longDate(lastOut.date) + '.' +
        (next ? ' Next one lands ' + longDate(next.date) + '.' : ' Nothing is scheduled.') + '</div>';
    }

    return '<div class="page">' +
      '<div class="chead"><p class="cat">' + esc(blog.site) + '</p><h2>The Blog</h2>' +
        '<p>What went live this month, what is queued, and the day each one lands. Read straight from WordPress every build.</p></div>' +
      '<div class="counts">' +
        '<div class="count"><b>' + live.length + '</b>Live in ' + MONTHS[today.getMonth()].slice(0, 3) + '</div>' +
        '<div class="count c-mine"><b>' + sched.length + '</b>Scheduled</div>' +
        '<div class="count"><b>' + drafts.length + '</b>Drafts</div>' +
        '<div class="count"><b>' + (next ? Math.max(0, daysUntil(next.date)) : '&ndash;') + '</b>Days to next</div>' +
      '</div>' + note +
      '<section class="wsec"><div class="sh"><span class="num">1</span><h3>The drip</h3>' +
        '<small>' + (next ? 'Next out ' + longDate(next.date) : 'Nothing queued') + '</small></div>' +
        calendarsHTML(live, sched) +
      '</section>' +
      '<section class="wsec"><div class="sh"><span class="num">2</span><h3>Going out next</h3>' +
        '<small>' + plural(sched.length, 'post') + ' scheduled</small></div>' +
        postListHTML(sched, 'scheduled', 'Nothing is scheduled. The drip stops after today.') +
      '</section>' +
      '<section class="wsec"><div class="sh"><span class="num">3</span><h3>Done this month</h3>' +
        '<small>' + MONTHS[today.getMonth()] + '</small></div>' +
        postListHTML(live, 'published', 'Nothing has published this month yet.') +
      '</section>' +
      '<section class="wsec"><div class="sh"><span class="num">4</span><h3>Drafts waiting</h3>' +
        '<small>' + plural(drafts.length, 'draft') + '</small></div>' +
        postListHTML(drafts, 'draft', 'No drafts sitting in WordPress.') +
      '</section>' +
    '</div>';
  }

  // ---- Agents ----
  function workBanner() {
    if (!work) return '';
    var n = mineItems().length;
    return '<a class="workbanner" href="#work/mine">' +
      '<span class="wbtitle">Client <em>Work</em></span>' +
      '<span class="wbsub">Every client\'s deliverables and where each one stands</span>' +
      '<span class="tag ' + (n ? 't-mine' : 't-done') + '">' + n + ' on you &rarr;</span>' +
    '</a>';
  }

  function blogBanner() {
    if (!blog) return '';
    var sched = blog.scheduled.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    var next = sched.filter(function (p) { return daysUntil(p.date) >= 0; })[0];
    return '<a class="blogbanner" href="#blog">' +
      '<span class="bbnum"><b>' + blog.published.length + '</b>live in ' + MONTHS[today.getMonth()].slice(0, 3) + '</span>' +
      '<span class="bbnum"><b>' + sched.length + '</b>scheduled</span>' +
      '<span class="bbnext">' + (next
        ? 'Next out <b>' + longDate(next.date) + '</b><small>' + esc(next.title) + '</small>'
        : 'Nothing scheduled<small>The drip stops after today</small>') + '</span>' +
      '<span class="bbgo">The blog &rarr;</span>' +
    '</a>';
  }

  function homeHTML() {
    return '<div class="page wide">' + workBanner() + blogBanner() + '<div class="grid">' + data.agents.map(function (a) {
      return '<article class="card" data-agent="' + a.id + '">' +
        '<div class="portrait"><img src="' + a.avatar + '" alt="' + a.name + '"><div class="fade"></div><div class="name">' + a.name + '</div></div>' +
        '<div class="body">' +
          '<div class="role">' + a.role + '</div>' +
          '<p class="tagline">' + a.tagline + '</p>' +
          '<div class="status"><span class="pip"></span> ' + a.status + '</div>' +
          '<div class="opencli">View ' + a.clients.length + ' ' + a.subjectsLabel.toLowerCase() + ' &rarr;</div>' +
          '<button class="voice" data-voice="' + a.voice + '"><span class="tri"></span> Talk with ' + a.name + '</button>' +
        '</div>' +
      '</article>';
    }).join('') + '</div></div>';
  }

  function agentHTML(a) {
    return '<div class="page"><a class="back" href="#">&larr; All agents</a>' +
      '<div class="agenthero">' +
        '<img src="' + a.avatar + '" alt="' + a.name + '">' +
        '<div class="agentmeta">' +
          '<div class="role">' + a.role + '</div>' +
          '<h2>' + a.name + '</h2>' +
          '<p class="tagline">' + a.tagline + '</p>' +
          '<button class="voice" data-voice="' + a.voice + '"><span class="tri"></span> Talk with ' + a.name + '</button>' +
        '</div>' +
      '</div>' +
      '<section class="wsec"><div class="sh"><span class="num">' + a.clients.length + '</span><h3>' + a.subjectsLabel + '</h3></div>' +
        a.clients.map(function (c) {
          return '<div class="row">' +
            '<button class="rhead">' +
              '<span class="rt">' + esc(c.name) + '</span>' +
              '<span class="rn">' + esc(c.summary) + '</span>' +
              '<span class="rr"><span class="tag ' + (c.ok ? 't-done' : 't-mine') + '">' + esc(c.status) + '</span></span>' +
            '</button>' +
            '<div class="more"><ul>' + c.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul></div>' +
          '</div>';
        }).join('') +
      '</section></div>';
  }

  function render() {
    var id = (location.hash || '').replace(/^#\/?/, '').trim();
    var a = agentById(id), tab = 'agents';
    if (id === 'work' || id.indexOf('work/') === 0 || id.indexOf('team/') === 0) { tab = 'work'; view.innerHTML = workHTML(id); }
    else if (id === 'blog') { tab = 'blog'; view.innerHTML = blogHTML(); }
    else if (id === 'vendors' || id.indexOf('vendors/') === 0) { tab = 'vendors'; view.innerHTML = vendorsHTML(id.replace(/^vendors\/?/, '')); }
    else view.innerHTML = a ? agentHTML(a) : homeHTML();
    document.querySelectorAll('.topnav a').forEach(function (l) { l.classList.toggle('on', l.getAttribute('data-tab') === tab); });
    wire();
    var on = view.querySelector('.pill.on');
    if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    window.scrollTo(0, 0);
  }

  function wire() {
    view.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('.voice')) return;
        location.hash = card.getAttribute('data-agent');
      });
    });
    view.querySelectorAll('.voice').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); playVoice(btn.getAttribute('data-voice')); });
    });
    view.querySelectorAll('.row').forEach(function (r) {
      r.querySelector('.rhead').addEventListener('click', function () { r.classList.toggle('open'); });
    });
    view.querySelectorAll('.checkoff').forEach(function (box) {
      var btn = box.querySelector('.cobtn'), msg = box.querySelector('.comsg');
      btn.addEventListener('click', function () { checkOff(box, btn, msg); });
    });
  }

  function checkOff(box, btn, msg) {
    var client = box.getAttribute('data-client'), title = box.getAttribute('data-title');
    var note = box.querySelector('.conote').value.trim();
    var key = store('cc_key');
    if (!key) {
      key = window.prompt('Passcode for check-offs (asked once on this device):');
      if (!key) return;
    }
    btn.disabled = true; msg.textContent = 'Saving...';
    fetch('/api/done', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cc-key': key },
      body: JSON.stringify({ client: client, title: title, note: note })
    }).then(function (r) { return r.json().then(function (j) { return { status: r.status, j: j }; }); })
      .then(function (res) {
        if (res.status === 401) { store('cc_key', null); throw new Error('Wrong passcode. Tap Mark done to try again.'); }
        if (!res.j.ok) throw new Error(res.j.error || 'Could not save.');
        store('cc_key', key);
        var p = pending(); p[client + '|' + title] = { date: res.j.date, note: note }; store('cc_done', JSON.stringify(p));
        work.clients.forEach(function (c) {
          if (c.name !== client) return;
          c.items.forEach(function (it) { if (it.title === title) markLocal(it, res.j.date, note); });
        });
        render();
      })
      .catch(function (e) { btn.disabled = false; msg.textContent = e.message || 'Could not save. Check your connection.'; });
  }

  var _g = window.CC_DATA && window.CC_DATA.generated;
  if (_g) { var _u = document.getElementById('updated'); if (_u) _u.textContent = 'Updated ' + _g; }
  window.addEventListener('hashchange', render);
  render();
})();
