/* ==========================================================================
   WildLens — auth
   Guest-first: identifying wildlife, browsing the encyclopedia, and reading
   community sightings never require a login. Saving, posting, liking,
   commenting, and anything in the AI Studio do — gated via WL.auth.requireAuth().
   ========================================================================== */
(function () {
  'use strict';

  var TOKEN_KEY = 'wl_token';
  var USER_CACHE_KEY = 'wl_user_cache';

  function apiBase() {
    return (window.WL_CONFIG && window.WL_CONFIG.API_BASE) || '';
  }

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_CACHE_KEY); }
  function isLoggedIn() { return !!getToken(); }

  function cachedUser() {
    try { return JSON.parse(localStorage.getItem(USER_CACHE_KEY) || 'null'); } catch (e) { return null; }
  }

  async function apiFetch(path, options) {
    options = options || {};
    var headers = Object.assign({}, options.headers || {});
    var token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(apiBase() + path, Object.assign({}, options, { headers: headers }));
  }

  async function login(email, password) {
    var res = await fetch(apiBase() + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.detail || 'Incorrect email or password');
    setToken(data.access_token);
    await refreshUser();
    return data;
  }

  async function signup(fullName, email, password) {
    var res = await fetch(apiBase() + '/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, email: email, password: password })
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.detail || 'Could not create your account');
    setToken(data.access_token);
    await refreshUser();
    return data;
  }

  function logout() {
    clearToken();
    updateNavUI();
    if (window.WL && WL.toast) WL.toast('Signed out');
  }

  async function refreshUser() {
    if (!isLoggedIn()) return null;
    try {
      var res = await apiFetch('/auth/me');
      if (!res.ok) { if (res.status === 401) clearToken(); return null; }
      var user = await res.json();
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
      return user;
    } catch (e) {
      return cachedUser(); // API unreachable — fall back to last-known state
    }
  }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  function updateNavUI() {
    var loggedIn = isLoggedIn();
    var user = cachedUser();
    document.querySelectorAll('[data-auth-out]').forEach(function (el) { el.hidden = loggedIn; });
    document.querySelectorAll('[data-auth-in]').forEach(function (el) { el.hidden = !loggedIn; });
    document.querySelectorAll('[data-auth-name]').forEach(function (el) { el.textContent = user ? user.full_name : ''; });
    document.querySelectorAll('[data-auth-initials]').forEach(function (el) { el.textContent = initials(user && user.full_name); });
  }

  /* ---- Auth gate: wrap any action that requires a logged-in user ---- */
  function ensureGateModal() {
    if (document.getElementById('authGateModal')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade" id="authGateModal" tabindex="-1" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered">' +
          '<div class="modal-content p-3" style="background:var(--bg-elevated);border:1px solid var(--line-strong);border-radius:var(--r-xl);">' +
            '<div class="modal-body text-center py-4">' +
              '<div class="dropzone-icon mx-auto" style="width:64px;height:64px;font-size:1.5rem;"><i class="bi bi-person-lock"></i></div>' +
              '<h3 class="mt-3 mb-2" style="font-size:1.3rem;">Sign in to continue</h3>' +
              '<p class="mb-4">Create a free account to save results, post sightings, and use the AI Studio. Identifying and browsing stay free, no account needed.</p>' +
              '<div class="d-flex flex-column gap-2">' +
                '<a href="login.html" id="authGateLoginLink" class="btn-wl btn-primary-wl w-100"><i class="bi bi-box-arrow-in-right"></i> Sign In</a>' +
                '<a href="signup.html" id="authGateSignupLink" class="btn-wl btn-outline-wl w-100"><i class="bi bi-person-plus"></i> Create Account</a>' +
                '<button class="btn-wl btn-ghost-wl w-100" data-bs-dismiss="modal">Not now</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap.firstElementChild);
  }

  function requireAuth(onAuthenticated) {
    if (isLoggedIn()) {
      if (onAuthenticated) onAuthenticated();
      return true;
    }
    ensureGateModal();
    var next = encodeURIComponent(location.pathname + location.search);
    var loginLink = document.getElementById('authGateLoginLink');
    var signupLink = document.getElementById('authGateSignupLink');
    if (loginLink) loginLink.href = 'login.html?next=' + next;
    if (signupLink) signupLink.href = 'signup.html?next=' + next;
    var modalEl = document.getElementById('authGateModal');
    if (window.bootstrap) new bootstrap.Modal(modalEl).show();
    return false;
  }

  // Merge onto window.WL — js/main.js loads after this and also merges,
  // so neither file should ever do `window.WL = {...}` and clobber the other.
  window.WL = window.WL || {};
  window.WL.auth = {
    getToken: getToken, isLoggedIn: isLoggedIn, cachedUser: cachedUser,
    login: login, signup: signup, logout: logout,
    refreshUser: refreshUser, updateNavUI: updateNavUI, requireAuth: requireAuth,
    apiFetch: apiFetch, apiBase: apiBase,
  };

  document.addEventListener('DOMContentLoaded', function () {
    updateNavUI();
    refreshUser().then(updateNavUI);

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-signout]');
      if (btn) { e.preventDefault(); logout(); }
    });
  });
})();
