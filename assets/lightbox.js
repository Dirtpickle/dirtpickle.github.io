// Lightbox with collection cycling, zoom and pan.
// Usage: window.PortfolioLightbox.open(item)  -  item = { type, full, title, galleryItems[] }
(function () {
  var root = document.getElementById('lightbox');
  var media = document.getElementById('lightboxMedia');
  var caption = document.getElementById('lightboxCaption');
  var closeButton = root && root.querySelector('.lightbox-close');
  if (!root || !media) return;

  var MIN_SCALE = 1;
  var MAX_SCALE = 8;
  var slides = [];
  var title = '';
  var index = 0;
  var view = { scale: 1, x: 0, y: 0 };
  var stage = null;
  var img = null;
  var counter = null;
  var pointers = {};
  var gesture = null;

  function slidesFor(item) {
    if (item.type === 'gallery' && Array.isArray(item.galleryItems) && item.galleryItems.length) {
      return item.galleryItems.map(function (entry) {
        return { type: entry.type, full: entry.full, title: entry.title || item.title };
      });
    }
    return [{ type: item.type, full: item.full, title: item.title }];
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function button(label, aria, onClick, className) {
    var node = el('button', 'lb-btn' + (className ? ' ' + className : ''), label);
    node.type = 'button';
    node.setAttribute('aria-label', aria);
    node.addEventListener('click', function (event) {
      event.stopPropagation();
      onClick();
    });
    return node;
  }

  // ---- zoom / pan -------------------------------------------------------

  function clampView() {
    if (!img || !stage) return;
    view.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale));
    var maxX = Math.max(0, (img.offsetWidth * view.scale - stage.clientWidth) / 2);
    var maxY = Math.max(0, (img.offsetHeight * view.scale - stage.clientHeight) / 2);
    view.x = Math.min(maxX, Math.max(-maxX, view.x));
    view.y = Math.min(maxY, Math.max(-maxY, view.y));
    if (view.scale === 1) { view.x = 0; view.y = 0; }
  }

  function applyView() {
    if (!img) return;
    clampView();
    img.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.scale + ')';
    stage.classList.toggle('is-zoomed', view.scale > 1);
  }

  function zoomAt(clientX, clientY, nextScale) {
    var rect = stage.getBoundingClientRect();
    var px = clientX - (rect.left + rect.width / 2);
    var py = clientY - (rect.top + rect.height / 2);
    var clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    var ratio = clamped / view.scale;
    view.x = px - (px - view.x) * ratio;
    view.y = py - (py - view.y) * ratio;
    view.scale = clamped;
    applyView();
  }

  function zoomCenter(factor) {
    var rect = stage.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, view.scale * factor);
  }

  function resetView() {
    view = { scale: 1, x: 0, y: 0 };
    applyView();
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(event) {
    stage.setPointerCapture(event.pointerId);
    pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      gesture = { type: 'pinch', startDistance: distance(pointers[ids[0]], pointers[ids[1]]), startScale: view.scale };
    } else {
      gesture = { type: 'drag', startX: event.clientX, startY: event.clientY, originX: view.x, originY: view.y, moved: false };
    }
  }

  function onPointerMove(event) {
    if (!pointers[event.pointerId]) return;
    pointers[event.pointerId] = { x: event.clientX, y: event.clientY };
    var ids = Object.keys(pointers);

    if (gesture && gesture.type === 'pinch' && ids.length === 2) {
      var a = pointers[ids[0]];
      var b = pointers[ids[1]];
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, gesture.startScale * (distance(a, b) / gesture.startDistance));
      return;
    }
    if (gesture && gesture.type === 'drag' && view.scale > 1) {
      view.x = gesture.originX + (event.clientX - gesture.startX);
      view.y = gesture.originY + (event.clientY - gesture.startY);
      gesture.moved = true;
      applyView();
    }
  }

  function onPointerUp(event) {
    var wasDrag = gesture && gesture.type === 'drag';
    var dx = wasDrag ? event.clientX - gesture.startX : 0;
    delete pointers[event.pointerId];
    if (Object.keys(pointers).length > 0) return;

    // Swipe to change slide when not zoomed in.
    if (wasDrag && view.scale === 1 && Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    gesture = null;
  }

  function onWheel(event) {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, view.scale * (event.deltaY < 0 ? 1.2 : 1 / 1.2));
  }

  function onDoubleClick(event) {
    if (view.scale > 1) resetView();
    else zoomAt(event.clientX, event.clientY, 2.5);
  }

  // ---- slides -----------------------------------------------------------

  function go(step) {
    var next = index + step;
    if (next < 0 || next >= slides.length) return;
    index = next;
    render();
  }

  function preloadNeighbors() {
    [index - 1, index + 1].forEach(function (i) {
      var slide = slides[i];
      if (slide && slide.type !== 'video') new Image().src = slide.full;
    });
  }

  function render() {
    var slide = slides[index];
    media.innerHTML = '';
    pointers = {};
    gesture = null;
    view = { scale: 1, x: 0, y: 0 };

    stage = el('div', 'lb-stage');
    if (slide.type === 'video') {
      var video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.src = slide.full;
      stage.appendChild(video);
      img = null;
    } else {
      img = document.createElement('img');
      img.src = slide.full;
      img.alt = slide.title || title;
      img.draggable = false;
      stage.appendChild(img);
      stage.addEventListener('pointerdown', onPointerDown);
      stage.addEventListener('pointermove', onPointerMove);
      stage.addEventListener('pointerup', onPointerUp);
      stage.addEventListener('pointercancel', onPointerUp);
      stage.addEventListener('wheel', onWheel, { passive: false });
      stage.addEventListener('dblclick', onDoubleClick);
    }

    var bar = el('div', 'lb-bar');
    var many = slides.length > 1;
    if (many) bar.appendChild(button('‹', 'Previous', function () { go(-1); }));
    counter = el('span', 'lb-counter', many ? (index + 1) + ' / ' + slides.length : '');
    bar.appendChild(counter);
    if (many) bar.appendChild(button('›', 'Next', function () { go(1); }));
    if (img) {
      bar.appendChild(button('−', 'Zoom out', function () { zoomCenter(1 / 1.4); }, 'lb-zoom'));
      bar.appendChild(button('+', 'Zoom in', function () { zoomCenter(1.4); }, 'lb-zoom'));
      bar.appendChild(button('↺', 'Reset zoom', resetView, 'lb-zoom'));
    }

    media.append(stage, bar);
    if (many) {
      var prev = media.querySelector('.lb-bar .lb-btn');
      prev.disabled = index === 0;
      var nextBtn = bar.querySelectorAll('.lb-btn')[1];
      nextBtn.disabled = index === slides.length - 1;
    }
    caption.textContent = slide.title || title;
    preloadNeighbors();
  }

  // ---- open / close -----------------------------------------------------

  function open(item) {
    if (!item) return;
    slides = slidesFor(item);
    title = item.title;
    index = 0;
    render();
    root.hidden = false;
    document.body.classList.add('has-lightbox');
  }

  function close() {
    root.hidden = true;
    document.body.classList.remove('has-lightbox');
    media.innerHTML = '';
    img = null;
    stage = null;
  }

  document.addEventListener('keydown', function (event) {
    if (root.hidden) return;
    if (event.key === 'Escape') close();
    else if (event.key === 'ArrowLeft') go(-1);
    else if (event.key === 'ArrowRight') go(1);
    else if (img && (event.key === '+' || event.key === '=')) zoomCenter(1.4);
    else if (img && (event.key === '-' || event.key === '_')) zoomCenter(1 / 1.4);
    else if (img && event.key === '0') resetView();
  });

  if (closeButton) closeButton.addEventListener('click', close);
  root.addEventListener('click', function (event) {
    if (event.target === root) close();
  });

  window.PortfolioLightbox = { open: open, close: close };
})();
