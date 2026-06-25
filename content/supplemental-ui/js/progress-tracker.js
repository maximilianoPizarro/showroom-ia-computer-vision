(function () {
  function registrationBase() {
    var u = document.querySelector('meta[name="workshop-registration-url"]');
    if (!u || !u.content || u.content.indexOf('YOUR_HUB') !== -1) {
      return '';
    }
    return u.content.replace(/\/$/, '');
  }
  function currentUser() {
    var p = new URLSearchParams(window.location.search);
    return p.get('USER_NAME') || p.get('user_name') || '';
  }
  function showStatus(root, ok, message) {
    var status = root.querySelector('.workshop-progress-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'workshop-progress-status';
      root.appendChild(status);
    }
    status.textContent = message;
    status.className = 'workshop-progress-status ' + (ok ? 'is-success' : 'is-error');
    root.style.borderColor = ok ? '#3e8635' : '#c9190b';
  }
  window.saveWorkshopProgress = function (moduleId) {
    var root = document.querySelector('.workshop-progress[data-module="' + moduleId + '"]');
    if (!root) return;
    var username = currentUser();
    if (!username) {
      showStatus(root, false, 'Register first — use Console link or Register above to get userN.');
      return;
    }
    var base = registrationBase();
    if (!base) {
      showStatus(root, false, 'Progress API unavailable (registration URL not set).');
      return;
    }
    var completed = root.querySelector('[data-completed]').checked;
    var interested = root.querySelector('[data-interest]').checked;
    showStatus(root, true, 'Saving…');
    fetch(base + '/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        module_id: moduleId,
        completed: completed,
        interested_more: interested,
        completed_via: 'showroom',
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function () {
        showStatus(root, true, 'Saved for ' + username + ' — module ' + moduleId);
      })
      .catch(function () {
        showStatus(root, false, 'Could not save progress. Check registration service /api/progress.');
      });
  };
})();
