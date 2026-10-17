/* StyleWeave auth pages: validation, show/hide password, strength meter, submit */
(function () {
  // Put your backend address here, for example 'http://localhost:5000/api/auth'.
  // While it is empty the forms only validate and show a demo message.
  var API_BASE = '';

  var form = document.getElementById('authForm');
  if (!form) return;
  var mode = form.getAttribute('data-mode'); // 'login' or 'register'
  var statusBox = document.getElementById('status');

  var eyeOn = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var eyeOff = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 6.2A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.5 7.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  // show / hide password
  document.querySelectorAll('.pw-toggle').forEach(function (btn) {
    btn.innerHTML = eyeOn;
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-target'));
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? eyeOff : eyeOn;
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  function field(id) { return document.getElementById(id); }
  function wrap(id) { return field(id).closest('.field'); }
  function setError(id, msg) {
    var w = wrap(id), e = w.querySelector('.err');
    if (msg) { w.classList.add('invalid'); e.textContent = msg; field(id).setAttribute('aria-invalid', 'true'); }
    else { w.classList.remove('invalid'); e.textContent = ''; field(id).removeAttribute('aria-invalid'); }
    return !msg;
  }

  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var rules = {
    name: function (v) { return v.trim().length < 2 ? 'Please enter your full name.' : ''; },
    email: function (v) { return !emailRe.test(v.trim()) ? 'Enter a valid email address.' : ''; },
    password: function (v) {
      if (mode === 'login') return v ? '' : 'Enter your password.';
      return v.length < 8 ? 'Use at least 8 characters.' : '';
    },
    confirm: function (v) { return v !== field('password').value ? 'Passwords do not match.' : ''; },
    terms: function () { return field('terms').checked ? '' : 'Please accept the terms to continue.'; }
  };

  function check(id) {
    if (!field(id) || !rules[id]) return true;
    var v = id === 'terms' ? '' : field(id).value;
    return setError(id, rules[id](v));
  }

  // live feedback once a field has been touched
  Object.keys(rules).forEach(function (id) {
    var el = field(id);
    if (!el) return;
    el.addEventListener('blur', function () { check(id); });
    el.addEventListener(id === 'terms' ? 'change' : 'input', function () {
      if (wrap(id).classList.contains('invalid')) check(id);
      if (id === 'password' && field('confirm') && field('confirm').value) check('confirm');
    });
  });

  // password strength (register only)
  var pw = field('password'), meter = document.getElementById('strengthBar'), label = document.getElementById('strengthText');
  if (mode === 'register' && pw && meter) {
    pw.addEventListener('input', function () {
      var v = pw.value, s = 0;
      if (v.length >= 8) s++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
      if (/\d/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) s++;
      var names = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
      var colors = ['#c2455d', '#d4825a', '#d9a94f', '#8fae6a', '#6f9a6a'];
      if (!v) { meter.style.width = '0'; label.textContent = 'Use 8 or more characters with letters and numbers.'; return; }
      meter.style.width = (s * 25 || 8) + '%';
      meter.style.background = colors[s];
      label.textContent = 'Password strength: ' + names[s];
    });
  }

  function showStatus(kind, msg) {
    statusBox.className = 'status show ' + kind;
    statusBox.textContent = msg;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusBox.className = 'status';
    var ids = mode === 'login' ? ['email', 'password'] : ['name', 'email', 'password', 'confirm', 'terms'];
    var ok = ids.map(check).every(Boolean);
    if (!ok) { var bad = form.querySelector('.invalid input'); if (bad) bad.focus(); return; }

    var data = {};
    new FormData(form).forEach(function (v, k) { if (k !== 'confirm') data[k] = v; });

    if (!API_BASE) {
      showStatus('ok', mode === 'login'
        ? 'Looks good. Demo mode: connect API_BASE in auth.js to your backend to sign in for real.'
        : 'Looks good. Demo mode: connect API_BASE in auth.js to your backend to create the account for real.');
      return;
    }

    var btn = form.querySelector('.submit'); btn.disabled = true;
    fetch(API_BASE + '/' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { ok: r.ok, body: b }; }); })
      .then(function (res) {
        if (!res.ok) { showStatus('bad', res.body.message || 'Something went wrong. Please try again.'); return; }
        if (res.body.token) { try { localStorage.setItem('token', res.body.token); } catch (err) {} }
        showStatus('ok', mode === 'login' ? 'Welcome back! Redirecting…' : 'Account created! Redirecting…');
        setTimeout(function () { window.location.href = mode === 'login' ? 'index.html' : 'login.html'; }, 900);
      })
      .catch(function () { showStatus('bad', 'Cannot reach the server. Check that the backend is running.'); })
      .then(function () { btn.disabled = false; });
  });
})();