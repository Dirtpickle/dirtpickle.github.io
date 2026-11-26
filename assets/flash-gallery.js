// Fills the flash page from the public flash.json feed, using the portfolio gallery cards and lightbox.
// Feed shape: { version, updatedAt, event, items:[{ code, name, image, price, kind, sheet, status }] }
// All feed values are written with textContent / attributes (never innerHTML).
(function () {
  var root = document.getElementById('flashSections');
  var note = document.getElementById('flashNote');
  if (!root) return;

  var SECTIONS = [
    { kind: 'repeatable', title: 'Repeatable flash', sub: 'Can be tattooed more than once.' },
    { kind: 'limited', title: 'Limited edition flash', sub: 'A set number of each will be done. When they are gone, they are gone.' },
    { kind: 'one-off', title: 'Unique flash', sub: 'Only one of each will ever be done. Once it is sold, it is gone.' }
  ];
  var DEFAULT_INFO = 'Claim a design in person at the shop. Unique designs can be held with a deposit; if one is not held, it goes to whoever gets it tattooed first.';
  var feedUrl = new URL(root.getAttribute('data-feed'), window.location.href);

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // Repeatables are never sold or held; unknown statuses count as available. Feed order is kept.
  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var kind = raw.kind === 'one-off' || raw.kind === 'limited' ? raw.kind : 'repeatable';
    var status = kind === 'one-off' && (raw.status === 'sold' || raw.status === 'hold') ? raw.status : 'available';
    var quantity = null, remaining = null;
    if (kind === 'limited') {
      quantity = whole(raw.quantity); remaining = whole(raw.remaining);
      if (remaining === 0 || raw.status === 'sold') status = 'sold';
    }
    var price = raw.price === '' || raw.price == null ? null : Number(raw.price);
    return {
      code: String(raw.code || ''), name: String(raw.name || ''), image: imageUrl(raw.image),
      price: price !== null && isFinite(price) ? price : null, kind: kind, status: status, quantity: quantity, remaining: remaining
    };
  }

  function whole(value) { var n = Number(value); return value !== '' && value != null && isFinite(n) && n >= 0 ? Math.floor(n) : null; }

  function imageUrl(path) {
    if (!path) return null;
    try {
      var url = new URL(path, feedUrl);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch (error) { return null; }
  }

  function priceText(item) { return item.price === null ? '' : '$' + item.price; }
  function kindText(item) { return item.kind === 'one-off' ? 'Unique' : item.kind === 'limited' ? 'Limited edition' : 'Repeatable'; }
  function leftText(item) { return item.kind === 'limited' && item.status !== 'sold' && item.remaining !== null ? item.remaining + (item.remaining === 1 ? ' left' : ' left') : ''; }
  function statusText(item) { return item.status === 'sold' ? (item.kind === 'limited' ? 'Sold out' : 'Sold') : item.status === 'hold' ? 'On hold' : ''; }

  function card(item) {
    var article = el('article', 'gallery-item flash-item is-' + item.status);
    var open = el('button', 'gallery-open');
    open.type = 'button';
    open.setAttribute('aria-label', 'Open ' + item.code);
    if (item.image) {
      var img = el('img');
      img.src = item.image; img.alt = item.code + (item.name ? ' - ' + item.name : ''); img.loading = 'lazy';
      img.addEventListener('error', function () { img.remove(); open.insertBefore(el('span', 'flash-placeholder', item.code), open.firstChild); });
      open.appendChild(img);
    } else {
      open.appendChild(el('span', 'flash-placeholder', item.code));
    }
    open.appendChild(el('span', 'gi-shade'));
    var badges = el('span', 'gi-badges');
    badges.appendChild(el('span', 'gi-badge flash-kind-' + item.kind, kindText(item)));
    if (statusText(item)) badges.appendChild(el('span', 'gi-badge flash-status-' + item.status, statusText(item)));
    open.appendChild(badges);
    var label = el('span', 'gi-label');
    label.appendChild(el('span', 'gi-title flash-code', item.name || item.code));
    label.appendChild(el('span', 'gi-tag', [item.name ? item.code : '', priceText(item), leftText(item)].filter(Boolean).join(' / ')));
    open.appendChild(label);
    open.addEventListener('click', function () {
      if (!item.image || !window.PortfolioLightbox) return;
      var caption = [item.name || item.code, item.name ? item.code : '', priceText(item), kindText(item), leftText(item), statusText(item)].filter(Boolean).join(' - ');
      window.PortfolioLightbox.open({ type: 'image', full: item.image, title: caption });
    });
    article.appendChild(open);
    return article;
  }

  function section(def, list) {
    var wrap = el('section', 'flash-section');
    var head = el('div', 'flash-head');
    head.appendChild(el('h2', '', def.title));
    head.appendChild(el('p', '', def.sub));
    wrap.appendChild(head);
    var grid = el('div', 'gallery flash-gallery');
    list.forEach(function (item) { grid.appendChild(card(item)); });
    wrap.appendChild(grid);
    return wrap;
  }

  function show(feed) {
    var raw = feed && Array.isArray(feed.items) ? feed.items : [];
    var items = raw.map(normalize).filter(Boolean);
    if (feed && feed.event) document.title = feed.event + ' / ' + document.title;
    var info = document.getElementById('flashInfo');
    var text = feed && typeof feed.info === 'string' && feed.info.trim() ? feed.info.trim() : DEFAULT_INFO;
    if (info) { info.textContent = text; info.hidden = false; }
    if (!items.length) { note.textContent = 'No flash available right now. Check back soon.'; return; }
    note.hidden = true;
    SECTIONS.forEach(function (def) {
      var list = items.filter(function (item) { return item.kind === def.kind; });
      if (list.length) root.appendChild(section(def, list));
    });
  }

  fetch(feedUrl.href, { cache: 'no-cache' })
    .then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .then(show)
    .catch(function () { note.textContent = 'Flash is not available right now. Please try again later.'; });
})();
