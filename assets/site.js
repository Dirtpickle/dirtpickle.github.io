(function () {
  const items = window.PORTFOLIO_ITEMS || [];
  const filters = window.PORTFOLIO_FILTERS || [];
  const gallery = document.querySelector('.gallery');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const filterToggle = document.querySelector('.filter-menu-toggle');
  const filterBar = document.getElementById('filterBar');
  const filterActiveLabel = document.querySelector('.filter-active-label');

  function itemMatches(item, filter) {
    if (filter === 'all') return true;
    if (filter === 'tattoo') return item.isTattoo;
    if (item.isTattoo) return false;
    if (filter === 'featured') return item.featured;

    const filterConfig = filters.find(entry => entry.key === filter);
    const mappedTags = filterConfig && Array.isArray(filterConfig.tags) ? filterConfig.tags : [filter];
    const itemTerms = item.filterTerms || [];

    return mappedTags.some(tag => itemTerms.includes(String(tag).toLowerCase()));
  }

  function applyFilter(filter) {
    const cards = Array.from(document.querySelectorAll('.gallery-item'));
    cards.forEach(card => {
      const item = items[Number(card.dataset.index)];
      const shouldShow = itemMatches(item, filter);
      card.hidden = !shouldShow;
    });
  }

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      applyFilter(button.dataset.filter);
      if (filterToggle && filterBar) {
        filterBar.classList.remove('open');
        filterToggle.setAttribute('aria-expanded', 'false');
        if (filterActiveLabel) filterActiveLabel.textContent = button.textContent.trim();
      }
    });
  });

  if (filterToggle && filterBar) {
    filterToggle.addEventListener('click', () => {
      const isOpen = filterBar.classList.toggle('open');
      filterToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const activeFilter = document.querySelector('.filter-btn.active');
  if (activeFilter) {
    applyFilter(activeFilter.dataset.filter);
    if (filterActiveLabel) filterActiveLabel.textContent = activeFilter.textContent.trim();
  }

  if (gallery) {
    gallery.addEventListener('click', event => {
      const card = event.target.closest('.gallery-item');
      if (!card) return;
      const item = items[Number(card.dataset.index)];
      if (item.linkUrl) {
        window.location.href = item.linkUrl;
        return;
      }
      if (window.PortfolioLightbox) window.PortfolioLightbox.open(item);
    });
  }

  document.querySelectorAll('.game-play').forEach(button => {
    button.addEventListener('click', () => {
      const index = button.dataset.gameIndex;
      const cover = document.getElementById(`game-cover-${index}`);
      const frame = document.getElementById(`game-frame-${index}`);
      if (!frame) return;

      const src = frame.dataset.src;
      if (src && !frame.src) frame.src = src;
      if (cover) cover.hidden = true;
      frame.classList.add('is-active');
    });
  });
})();
