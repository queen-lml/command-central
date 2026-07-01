(function () {
  var view = document.getElementById('view');
  var data = window.CC_DATA;

  function agentById(id) { return data.agents.filter(function (a) { return a.id === id; })[0]; }

  function playVoice(src) { try { new Audio(src).play().catch(function () {}); } catch (e) {} }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function homeHTML() {
    return '<div class="grid">' + data.agents.map(function (a) {
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
    view.innerHTML = a ? agentHTML(a) : homeHTML();
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
    view.querySelectorAll('.client').forEach(function (cl) {
      cl.querySelector('.clienthead').addEventListener('click', function () { cl.classList.toggle('open'); });
    });
  }

  window.addEventListener('hashchange', render);
  render();
})();
