(function () {
  var view = document.getElementById('view');
  var data = window.CC_DATA;

  function agentById(id) { return data.agents.filter(function (a) { return a.id === id; })[0]; }

  function playVoice(src) { try { new Audio(src).play().catch(function () {}); } catch (e) {} }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  // ---- Client Work: monthly deliverables per client (data.work, from work.json) ----
  var work = data.work || null;
  var STAGES = [
    { id: 'intake', label: 'Onboarding' },
    { id: 'plan', label: 'Planning' },
    { id: 'create', label: 'Muse writing' },
    { id: 'review', label: 'Your review' },
    { id: 'client', label: 'Client approval' },
    { id: 'ready', label: 'Ready to schedule' },
    { id: 'live', label: 'Live' }
  ];
  var WHO = { leslie: 'You', client: 'Client', vendor: 'Vendor', muse: 'Muse', va: 'VA', smm: 'Social manager', nobody: 'Nobody' };
  var filter = 'all';

  function stageIndex(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return i; return 0; }
  function stageLabel(id) { return STAGES[stageIndex(id)].label; }

  function daysSince(d) {
    if (!d) return null;
    var t = Date.parse(d + 'T12:00:00');
    return isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 86400000));
  }

  function monthName(m) {
    var n = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var i = m ? parseInt(m.split('-')[1], 10) - 1 : -1;
    return n[i] ? n[i] + ' monthly' : 'monthly';
  }

  function allItems() {
    var out = [];
    (work ? work.clients : []).forEach(function (c) { c.items.forEach(function (it) { out.push(it); }); });
    return out;
  }
  function isOpen(it) { return !!it.waitingOn && it.waitingOn !== 'nobody'; }
  function isStuck(it) { var d = daysSince(it.since); return isOpen(it) && d !== null && d >= 14; }
  function matches(it) {
    if (filter === 'leslie') return isOpen(it) && it.waitingOn === 'leslie';
    if (filter === 'client') return isOpen(it) && it.waitingOn === 'client';
    if (filter === 'stuck') return isStuck(it);
    return true;
  }
  function count(fn) { return allItems().filter(fn).length; }

  function workBanner() {
    if (!work) return '';
    var n = count(function (it) { return isOpen(it) && it.waitingOn === 'leslie'; });
    return '<a class="workbanner" href="#work">' +
      '<span class="wbtitle">Client Work</span>' +
      '<span class="wbsub">Every client\'s monthly deliverables and where each one stands</span>' +
      '<span class="wbcount' + (n ? ' hot' : '') + '">' + n + ' waiting on you &rarr;</span>' +
    '</a>';
  }

  function stepper(it) {
    var cur = stageIndex(it.stage);
    return '<ol class="stepper" aria-label="Stage: ' + esc(stageLabel(it.stage)) + '">' + STAGES.map(function (s, i) {
      var cls = i < cur ? 'past' : (i === cur ? 'now' : '');
      return '<li class="' + cls + '" title="' + s.label + '"><span></span></li>';
    }).join('') + '</ol>';
  }

  function segLabel(k) { return k === 'ready' ? 'scheduled / ready' : stageLabel(k).toLowerCase(); }

  function progressBar(it) {
    if (!it.monthly) return '';
    if (!it.target) return '<div class="pmeta"><b>' + (it.done || 0) + '</b> delivered this month (no set number yet)</div>';
    var p = it.progress || {}, parts = '', used = 0;
    ['live', 'ready', 'client', 'review', 'create', 'plan'].forEach(function (k) {
      var n = p[k] || 0; if (!n) return;
      used += n;
      parts += '<span class="seg s-' + k + '" style="width:' + (100 * n / it.target) + '%" title="' + n + ' ' + segLabel(k) + '"></span>';
    });
    var legend = ['live', 'ready', 'client', 'review', 'create', 'plan'].filter(function (k) { return p[k]; })
      .map(function (k) { return '<span class="lg"><i class="s-' + k + '"></i>' + p[k] + ' ' + segLabel(k) + '</span>'; }).join('');
    if (used < it.target) legend += '<span class="lg"><i class="s-none"></i>' + (it.target - used) + ' not started</span>';
    return '<div class="pbar">' + parts + '</div>' +
      '<div class="pmeta"><b>' + (it.done || 0) + ' of ' + it.target + '</b> delivered this month' + (legend ? ' &middot; ' + legend : '') + '</div>';
  }

  // One signal per item: who has the next move.
  function linkify(t) {
    return esc(t).split(' | ').map(function (part) {
      part = part.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">open</a>');
      // repo paths like muse/clients/x.md or gsc-monitoring-agent/tasks/y.md -> GitHub
      return part.replace(/(^|\s)((muse|vesta|gsc-monitoring-agent|command-central)\/[^\s]+)/g, function (m, sp, path, repo) {
        var rest = path.slice(repo.length + 1);
        var kind = /\/$/.test(rest) || !/\.[a-z0-9]+$/i.test(rest) ? 'tree' : 'blob';
        return sp + '<a href="https://github.com/queen-lml/' + repo + '/' + kind + '/main/' + rest.replace(/\/$/, '') + '" target="_blank" rel="noopener">' + rest.split('/').filter(Boolean).pop() + '</a>';
      });
    }).join(' &middot; ');
  }

  function signal(it) {
    var d = daysSince(it.since), w = it.waitingOn || 'nobody';
    var age = (d !== null && d >= 1) ? ' &middot; ' + d + (d === 1 ? ' day' : ' days') : '';
    if (w === 'leslie') return { cls: 'you', text: 'Your move' + age };
    if (w === 'client') return { cls: 'client', text: 'Waiting on client' + age };
    if (w === 'vendor') return { cls: 'client', text: 'Waiting on vendor' + age };
    if (w === 'muse' || w === 'va' || w === 'smm') return { cls: 'team', text: (WHO[w] || w) + ' is on it' };
    if (it.stage === 'live') return { cls: 'done', text: 'Done' };
    if (it.stage === 'ready') return { cls: 'done', text: 'Scheduled' };
    return { cls: 'parked', text: 'Parked' };
  }

  function itemHTML(it) {
    var sg = signal(it), d = daysSince(it.since);
    var late = (sg.cls === 'you' || sg.cls === 'client') && d !== null && d >= 14;
    return '<div class="witem s-' + sg.cls + (sg.cls === 'done' ? ' done' : '') + '">' +
      '<button class="wihead">' +
        '<span class="dot d-' + sg.cls + '"></span>' +
        '<span class="wtitle">' + esc(it.title) + (it.monthly ? ' <span class="mo">' + esc(monthName(it.month)) + '</span>' : '') + '</span>' +
        '<span class="sig g-' + sg.cls + (late ? ' late' : '') + '">' + sg.text + '</span>' +
      '</button>' +
      (sg.cls === 'you' && it.next ? '<p class="wnext">&rarr; ' + esc(it.next) + '</p>' : '') +
      progressBar(it) +
      '<div class="wibody">' +
        (it.why ? '<p><b>Why:</b> ' + esc(it.why) + '</p>' : '') +
        (it.next && sg.cls !== 'you' ? '<p><b>Next step:</b> ' + esc(it.next) + '</p>' : '') +
        '<p class="fine">Stage: ' + esc(stageLabel(it.stage)) + (it.since ? ' since ' + esc(it.since) : '') +
          (it.type ? ' &middot; ' + esc(it.type) : '') + '</p>' +
        (it.where ? '<p class="fine">Files: ' + linkify(it.where) + '</p>' : '') +
      '</div>' +
    '</div>';
  }

  function yourMoveHTML() {
    var rows = [];
    work.clients.forEach(function (c) {
      c.items.forEach(function (it) { if (it.waitingOn === 'leslie') rows.push({ c: c.name, it: it }); });
    });
    if (!rows.length) return '<div class="yourmove empty"><b>Your move:</b> nothing is waiting on you. 🎉</div>';
    rows.sort(function (a, b) { return (daysSince(b.it.since) || 0) - (daysSince(a.it.since) || 0); });
    return '<div class="yourmove"><h3><span class="dot d-you"></span>Your move &middot; ' + rows.length + '</h3><ol>' +
      rows.map(function (r) {
        var d = daysSince(r.it.since);
        return '<li><b>' + esc(r.c) + '</b> &middot; ' + esc(r.it.title) +
          (r.it.next ? '<br><span class="ymnext">&rarr; ' + esc(r.it.next) + '</span>' : '') +
          (d ? ' <span class="fine">(' + d + (d === 1 ? ' day' : ' days') + ')</span>' : '') + '</li>';
      }).join('') + '</ol></div>';
  }

  function socialHTML(s) {
    if (!s) return '';
    var bits = [];
    if (s.reels) bits.push(s.reels + ' reel' + (s.reels === 1 ? '' : 's'));
    if (s.carousels) bits.push(s.carousels + ' carousel' + (s.carousels === 1 ? '' : 's'));
    if (s.posts) bits.push(s.posts + ' single post' + (s.posts === 1 ? '' : 's'));
    return '<p class="wsocial"><b>Instagram @' + esc(s.username) + ' this month:</b> ' + s.total + ' posted' +
      (s.unique && s.unique < s.total ? ' from ' + s.unique + ' unique pieces' : '') +
      (bits.length ? ' (' + bits.join(', ') + ')' : '') +
      (s.last ? ' &middot; last post ' + esc(s.last) : '') + '</p>';
  }

  function workHTML() {
    if (!work) return '<a class="back" href="#">&larr; All agents</a><p>No client work data yet.</p>';
    var chips = [
      ['all', 'Everything', allItems().length],
      ['leslie', 'Your move', count(function (it) { return isOpen(it) && it.waitingOn === 'leslie'; })],
      ['client', 'Waiting on clients', count(function (it) { return isOpen(it) && it.waitingOn === 'client'; })],
      ['stuck', 'Stuck 14+ days', count(isStuck)]
    ];
    var clients = work.clients.map(function (c) {
      var rank = { leslie: 0, client: 1, va: 2, smm: 2, muse: 3, nobody: 4 };
      var items = c.items.filter(matches).slice().sort(function (a, b) {
        var ra = a.waitingOn in rank ? rank[a.waitingOn] : 4, rb = b.waitingOn in rank ? rank[b.waitingOn] : 4;
        return ra - rb || (daysSince(b.since) || 0) - (daysSince(a.since) || 0);
      });
      if (!items.length && filter !== 'all') return '';
      var mine = c.items.filter(function (it) { return isOpen(it) && it.waitingOn === 'leslie'; }).length;
      return '<section class="wclient">' +
        '<div class="wchead"><h3>' + esc(c.name) + '</h3>' +
          (mine ? '<span class="sig g-you">' + mine + ' your move</span>' : '') + '</div>' +
        (c.scope ? '<p class="wscope">' + esc(c.scope) + (c.cadence ? ' &middot; ' + esc(c.cadence) : '') + '</p>' : '') +
        socialHTML(c.social) +
        (items.length ? items.map(itemHTML).join('') : '<p class="fine">Nothing in progress.</p>') +
      '</section>';
    }).join('');
    return '<a class="back" href="#">&larr; All agents</a>' +
      '<h2 class="workh">Client Work</h2>' +
      (vendors ? tabsHTML('work') : '') +
      '<p class="worksub">What each client gets every month, and where it stands. Updated ' + esc(work.updated || '') + '.</p>' +
      '<div class="chips">' + chips.map(function (c) {
        return '<button class="chip' + (filter === c[0] ? ' on' : '') + '" data-f="' + c[0] + '">' + c[1] + ' <b>' + c[2] + '</b></button>';
      }).join('') + '</div>' +
      '<p class="legend"><span><span class="dot d-you"></span>Your move</span><span><span class="dot d-client"></span>Waiting on client</span>' +
        '<span><span class="dot d-team"></span>Muse / team is on it</span><span><span class="dot d-done"></span>Done</span>' +
        '<span><span class="dot d-parked"></span>Parked</span></p>' +
      yourMoveHTML() +
      (work.howItWorks ? '<p class="fine howit">' + esc(work.howItWorks) + ' Tap any item for the why and the files.</p>' : '') +
      clients;
  }

  var vendors = data.vendors || null;

  function tabsHTML(active) {
    return '<div class="tabs">' +
      '<a class="tab' + (active === 'work' ? ' on' : '') + '" href="#work">Clients</a>' +
      '<a class="tab' + (active === 'vendors' ? ' on' : '') + '" href="#vendors">Vendors</a>' +
    '</div>';
  }

  function openOrders(name) {
    var out = [];
    (work ? work.clients : []).forEach(function (c) {
      c.items.forEach(function (it) {
        var v = it.vendor || [];
        if (typeof v === 'string') v = [v];
        if (v.indexOf(name) !== -1 && isOpen(it)) out.push({ c: c.name, it: it });
      });
    });
    return out;
  }

  function vendorsHTML() {
    var list = vendors ? vendors.vendors : [];
    return '<a class="back" href="#">&larr; All agents</a>' +
      '<h2 class="workh">Vendors</h2>' +
      '<p class="worksub">Who we pay to deliver work, what for, and why.</p>' +
      tabsHTML('vendors') +
      (list.length ? list.map(function (v) {
        var orders = openOrders(v.name);
        return '<section class="wclient vendor">' +
          '<div class="wchead"><h3>' + esc(v.name) + '</h3>' +
            (orders.length ? '<span class="sig g-client">' + orders.length + ' open order' + (orders.length === 1 ? '' : 's') + '</span>' : '') + '</div>' +
          '<p class="wscope"><b>What:</b> ' + esc(v.what || '') + '</p>' +
          (v.why ? '<p class="wscope"><b>Why:</b> ' + esc(v.why) + '</p>' : '') +
          (v.clients && v.clients.length ? '<p class="vchips">' + v.clients.map(function (c) { return '<span class="mo">' + esc(c) + '</span>'; }).join(' ') + '</p>' : '') +
          '<p class="fine">' + (v.cost ? 'Cost: ' + esc(v.cost) + ' &middot; ' : '') + (v.contact ? 'Contact: ' + esc(v.contact) : '') + '</p>' +
          (v.where ? '<p class="fine">Links: ' + linkify(v.where) + '</p>' : '') +
          (v.notes ? '<p class="fine">' + esc(v.notes) + '</p>' : '') +
          (orders.length ? '<div class="vorders"><b>Open orders</b><ul>' + orders.map(function (o) {
            return '<li>' + esc(o.c) + ' &middot; ' + esc(o.it.title) + ' <span class="fine">(' + esc(signal(o.it).text.replace(/&middot;/g, '·')) + ')</span></li>';
          }).join('') + '</ul></div>' : '') +
        '</section>';
      }).join('') : '<p>No vendors yet.</p>');
  }

  function homeHTML() {
    return workBanner() + '<div class="grid">' + data.agents.map(function (a) {
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
    }).join('') + '</div>';
  }

  function agentHTML(a) {
    return '<a class="back" href="#">&larr; All agents</a>' +
      '<div class="agenthero">' +
        '<img src="' + a.avatar + '" alt="' + a.name + '">' +
        '<div class="agentmeta">' +
          '<div class="role">' + a.role + '</div>' +
          '<h2>' + a.name + '</h2>' +
          '<p class="tagline">' + a.tagline + '</p>' +
          '<button class="voice" data-voice="' + a.voice + '"><span class="tri"></span> Talk with ' + a.name + '</button>' +
        '</div>' +
      '</div>' +
      '<h3 class="section">' + a.subjectsLabel + ' &middot; ' + a.clients.length + '</h3>' +
      '<div class="clientlist">' +
        a.clients.map(function (c) {
          return '<div class="client">' +
            '<button class="clienthead">' +
              '<span class="cname">' + esc(c.name) + '</span>' +
              '<span class="cstatus ' + (c.ok ? 'good' : 'wait') + '">' + esc(c.status) + '</span>' +
              '<span class="chev">+</span>' +
            '</button>' +
            '<div class="clientbody">' +
              '<p class="csum">' + esc(c.summary) + '</p>' +
              '<ul>' + c.details.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
  }

  function render() {
    var id = (location.hash || '').replace(/^#\/?/, '').trim();
    var a = agentById(id);
    view.innerHTML = id === 'work' ? workHTML() : id === 'vendors' ? vendorsHTML() : (a ? agentHTML(a) : homeHTML());
    wire();
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
    view.querySelectorAll('.chip').forEach(function (b) {
      b.addEventListener('click', function () { filter = b.getAttribute('data-f'); view.innerHTML = workHTML(); wire(); });
    });
    view.querySelectorAll('.witem').forEach(function (w) {
      w.querySelector('.wihead').addEventListener('click', function () { w.classList.toggle('open'); });
    });
    view.querySelectorAll('.client').forEach(function (cl) {
      cl.querySelector('.clienthead').addEventListener('click', function () { cl.classList.toggle('open'); });
    });
  }

  var _g = window.CC_DATA && window.CC_DATA.generated;
  if (_g) { var _f = document.querySelector('footer'); if (_f) _f.insertAdjacentHTML('beforeend', ' &middot; updated ' + _g); }
  window.addEventListener('hashchange', render);
  render();
})();
