// Gallery size buttons (S / M / L). The choice is kept in localStorage and applied as
// data-gallery-scale on <html>; assets/gallery-scale.css does the actual resizing.
(function () {
  var bar = document.getElementById('scaleBar');
  if (!bar) return;
  var KEY = 'dp-gallery-scale';
  var VALID = ['small', 'medium', 'large'];
  var buttons = Array.prototype.slice.call(bar.querySelectorAll('.scale-btn'));

  function stored() {
    try {
      var value = window.localStorage.getItem(KEY);
      return VALID.indexOf(value) !== -1 ? value : null;
    } catch (error) {
      return null;
    }
  }

  function remember(value) {
    try { window.localStorage.setItem(KEY, value); } catch (error) { /* private mode: keep it for this visit only */ }
  }

  function apply(value) {
    document.documentElement.setAttribute('data-gallery-scale', value);
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-scale') === value));
    });
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.getAttribute('data-scale');
      apply(value);
      remember(value);
    });
  });

  apply(stored() || bar.getAttribute('data-default') || 'medium');
})();
