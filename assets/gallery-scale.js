// Gallery size buttons (S / M / L). The choice is kept in localStorage and applied as
// data-gallery-scale on <html>; assets/gallery-scale.css does the actual resizing.
(function () {
  var bar = document.getElementById('scaleBar');
  if (!bar) return;
  var KEY = 'dp-gallery-scale';
  var VALID = ['small', 'medium', 'large'];

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
    var name = document.getElementById('scaleName');
    if (name) name.textContent = value.charAt(0).toUpperCase() + value.slice(1);
  }

  var button = document.getElementById('scaleCycle');
  if (button) button.addEventListener('click', function () {
    var now = document.documentElement.getAttribute('data-gallery-scale');
    var value = VALID[(VALID.indexOf(now) + 1) % VALID.length];
    apply(value);
    remember(value);
  });

  apply(stored() || bar.getAttribute('data-default') || 'medium');
})();
