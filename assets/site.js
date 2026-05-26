(function () {
  const items = window.PORTFOLIO_ITEMS || [];
  const filters = window.PORTFOLIO_FILTERS || [];
  const gallery = document.querySelector('.gallery');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const filterToggle = document.querySelector('.filter-menu-toggle');
  const filterBar = document.getElementById('filterBar');
  const filterActiveLabel = document.querySelector('.filter-active-label');
  const lightbox = document.getElementById('lightbox');
  const lightboxMedia = document.getElementById('lightboxMedia');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeButton = document.querySelector('.lightbox-close');

  function itemMatches(item, filter) {
    if (filter === 'tattoo') return item.isTattoo;
    if (item.isTattoo) return false;
    if (filter === 'all') return true;
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

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove('has-lightbox');
    lightboxMedia.innerHTML = '';
  }

  function openLightbox(item) {
    if (!lightbox || !item) return;
    lightboxMedia.innerHTML = '';

    if (item.type === 'gallery' && Array.isArray(item.galleryItems) && item.galleryItems.length) {
      renderGalleryLightbox(item, 0);
    } else if (item.type === 'video') {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.src = item.full;
      lightboxMedia.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.full;
      img.alt = item.title;
      lightboxMedia.appendChild(img);
    }

    lightboxCaption.textContent = item.title;
    lightbox.hidden = false;
    document.body.classList.add('has-lightbox');
  }

  function renderGalleryLightbox(item, activeIndex) {
    const galleryItems = item.galleryItems || [];
    const activeItem = galleryItems[activeIndex] || galleryItems[0];
    if (!activeItem) return;

    const frame = document.createElement('div');
    frame.className = 'lightbox-gallery';

    const mediaSlot = document.createElement('div');
    mediaSlot.className = 'lightbox-gallery-media';
    if (activeItem.type === 'video') {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.src = activeItem.full;
      mediaSlot.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = activeItem.full;
      img.alt = activeItem.title || item.title;
      mediaSlot.appendChild(img);
    }

    const controls = document.createElement('div');
    controls.className = 'lightbox-gallery-controls';
    const previous = document.createElement('button');
    previous.type = 'button';
    previous.textContent = 'Previous';
    previous.disabled = activeIndex === 0;
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = 'Next';
    next.disabled = activeIndex === galleryItems.length - 1;
    const counter = document.createElement('span');
    counter.textContent = `${activeIndex + 1} / ${galleryItems.length}`;

    previous.addEventListener('click', () => {
      lightboxMedia.innerHTML = '';
      renderGalleryLightbox(item, activeIndex - 1);
    });
    next.addEventListener('click', () => {
      lightboxMedia.innerHTML = '';
      renderGalleryLightbox(item, activeIndex + 1);
    });

    controls.append(previous, counter, next);
    frame.append(mediaSlot, controls);
    lightboxMedia.appendChild(frame);
    lightboxCaption.textContent = activeItem.title || item.title;
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
      openLightbox(item);
    });
  }

  if (closeButton) closeButton.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeLightbox();
  });

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

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const submitButton = contactForm.querySelector('.submit-btn');
    const status = document.getElementById('form-status');

    contactForm.addEventListener('submit', () => {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
      }
      if (status) status.hidden = true;
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1' && status) {
      status.textContent = 'Thank you. Your message has been sent.';
      status.hidden = false;
      window.history.replaceState({}, document.title, `${window.location.pathname}#contact`);
    }
  }
})();
