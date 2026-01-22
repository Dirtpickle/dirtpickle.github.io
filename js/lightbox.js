// Lightbox Functionality

// Lightbox state management
const lightboxState = {
    frames: [],
    currentFrame: 0,
    baseCaption: '',
    galleryItems: [],
    currentItemIndex: -1,
    itemInfo: null,  // Store item metadata
    transform: {
        scale: 1,
        translateX: 0,
        translateY: 0
    },
    isZooming: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    startTranslateX: 0,
    startTranslateY: 0,
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    hasMoved: false
};

function openLightbox(src, caption, frames, galleryItems = [], itemIndex = -1) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    if (!lightbox || !lightboxImg || !lightboxCaption) {
        return;
    }

    // Store gallery context for navigation
    lightboxState.galleryItems = galleryItems;
    lightboxState.currentItemIndex = itemIndex;

    // Reset zoom and pan state
    resetLightboxTransform();

    // Clean up caption
    let displayCaption = caption;
    if (!displayCaption || displayCaption.trim() === '') {
        const base = src.split('/').pop();
        displayCaption = base
            .replace(/-f(?=\.[^/.]+$)/, '')
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    // Setup frames if provided
    if (frames && frames.length > 0) {
        const stripQuery = (s) => (s || '').split('?')[0];
        const basename = (s) => stripQuery(s).split('/').pop();

        const framesBasenames = frames.map(f => basename(f));
        const srcBasename = basename(src);

        if (!framesBasenames.includes(srcBasename)) {
            lightboxState.frames = [src, ...frames];
            lightboxState.currentFrame = 0;
        } else {
            lightboxState.frames = frames;
            lightboxState.currentFrame = framesBasenames.indexOf(srcBasename);
            src = lightboxState.frames[lightboxState.currentFrame];
        }
    } else {
        lightboxState.frames = [src];
        lightboxState.currentFrame = 0;
    }
    lightboxState.baseCaption = displayCaption;

    lightbox.style.display = 'block';
    lightbox.setAttribute('aria-hidden', 'false');
    
    // Clear previous image and add loading handling
    lightboxImg.src = '';
    lightboxImg.onload = function() {
        console.log('Lightbox image loaded successfully:', src);
    };
    lightboxImg.onerror = function() {
        console.error('Failed to load lightbox image:', src);
    };
    lightboxImg.src = src;
    
    updateLightboxCaption();
    document.body.style.overflow = 'hidden';

    // Show/hide frame navigation arrows
    updateFrameNavigation();

    // Disable pointer events on navigation and other content
    const nav = document.querySelector('nav');
    const mobileMenu = document.getElementById('mobile-menu');
    if (nav) nav.style.pointerEvents = 'none';
    if (mobileMenu) mobileMenu.style.pointerEvents = 'none';

    // Setup zoom and pan events
    setupLightboxZoomPan();
    
    // Setup keyboard navigation
    setupLightboxKeyboardNavigation();
}

function updateLightboxCaption() {
    const lightboxCaption = document.getElementById('lightbox-caption');
    if (!lightboxCaption) return;

    if (lightboxState.frames.length > 1) {
        lightboxCaption.textContent = `${lightboxState.baseCaption} - Frame ${lightboxState.currentFrame + 1} of ${lightboxState.frames.length}`;
    } else {
        lightboxCaption.textContent = lightboxState.baseCaption;
    }
}

function updateLightboxItemInfo() {
    let lightboxItemInfo = document.getElementById('lightbox-item-info');

    // Create element if it doesn't exist
    if (!lightboxItemInfo) {
        const lightbox = document.getElementById('lightbox');
        if (!lightbox) return;

        lightboxItemInfo = document.createElement('div');
        lightboxItemInfo.id = 'lightbox-item-info';
        lightboxItemInfo.className = 'lightbox-item-info';
        lightbox.appendChild(lightboxItemInfo);
    }

    // Update content or hide if no itemInfo
    if (!lightboxState.itemInfo) {
        lightboxItemInfo.style.display = 'none';
        return;
    }

    const { workType, tags } = lightboxState.itemInfo;

    // Generate tags HTML
    const tagsHTML = tags && tags.length > 0 ?
        `<div class="lightbox-tags">
            ${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>` : '';

    // Display workType and tags
    lightboxItemInfo.innerHTML = `
        <div class="lightbox-work-type">${workType || ''}</div>
        ${tagsHTML}
    `;
    lightboxItemInfo.style.display = 'flex';
}

function updateFrameNavigation() {
    const lightbox = document.getElementById('lightbox');
    const wrapper = document.getElementById('lightbox-img-wrapper');
    let prevBtn = document.getElementById('lightbox-prev');
    let nextBtn = document.getElementById('lightbox-next');

    // Ensure navigation buttons exist
    if (!prevBtn && lightbox) {
        prevBtn = document.createElement('div');
        prevBtn.id = 'lightbox-prev';
        prevBtn.className = 'lightbox-nav lightbox-prev';
        prevBtn.innerHTML = '<span>&#8249;</span>';
        prevBtn.onclick = () => navigateLightbox(-1);
        lightbox.appendChild(prevBtn);
    }

    if (!nextBtn && lightbox) {
        nextBtn = document.createElement('div');
        nextBtn.id = 'lightbox-next';
        nextBtn.className = 'lightbox-nav lightbox-next';
        nextBtn.innerHTML = '<span>&#8250;</span>';
        nextBtn.onclick = () => navigateLightbox(1);
        lightbox.appendChild(nextBtn);
    }

    // Update onclick handlers to use new navigation function
    if (prevBtn) prevBtn.onclick = () => navigateLightbox(-1);
    if (nextBtn) nextBtn.onclick = () => navigateLightbox(1);

    // Check if navigation arrows should be visible
    const hasMultipleFrames = lightboxState.frames && lightboxState.frames.length > 1;
    
    // Only show navigation for multiple frames (not gallery navigation)
    // This prevents unwanted navigation arrows on single images
    const shouldShowNavigation = hasMultipleFrames;

    // Show/hide navigation arrows using both class and inline styles for maximum effect
    if (prevBtn && nextBtn) {
        if (shouldShowNavigation) {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
            prevBtn.style.display = '';
            nextBtn.style.display = '';
        } else {
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            // Force hide with inline styles to override any CSS
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }

    // Add/remove class for multi-frame galleries to control swipe hint visibility
    if (wrapper) {
        if (hasMultipleFrames) {
            wrapper.classList.add('has-multiple-frames');
        } else {
            wrapper.classList.remove('has-multiple-frames');
        }
    }
}

function changeFrame(direction) {
    if (!lightboxState.frames || lightboxState.frames.length <= 1) return;

    lightboxState.currentFrame += direction;

    // Wrap around
    if (lightboxState.currentFrame < 0) {
        lightboxState.currentFrame = lightboxState.frames.length - 1;
    } else if (lightboxState.currentFrame >= lightboxState.frames.length) {
        lightboxState.currentFrame = 0;
    }

    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) {
        lightboxImg.src = lightboxState.frames[lightboxState.currentFrame];
    }

    updateLightboxCaption();
    updateFrameNavigation();
    resetLightboxTransform();
}

function navigateLightbox(direction) {
    const hasMultipleFrames = lightboxState.frames && lightboxState.frames.length > 1;
    const hasGalleryItems = lightboxState.galleryItems && lightboxState.galleryItems.length > 1;

    // If we have multiple frames, navigate through them first
    if (hasMultipleFrames) {
        const nextFrame = lightboxState.currentFrame + direction;

        // If we're within frame bounds, just navigate frames
        if (nextFrame >= 0 && nextFrame < lightboxState.frames.length) {
            changeFrame(direction);
            return;
        }

        // If we're at the edge of frames, wrap around frames first
        changeFrame(direction);

        // Note: changeFrame() already handles wrapping, so we don't need gallery navigation here
        return;
    } else if (hasGalleryItems) {
        // No multiple frames, just navigate gallery
        changeGalleryItem(direction);
    }
}

function changeGalleryItem(direction) {
    if (lightboxState.galleryItems.length === 0 || lightboxState.currentItemIndex === -1) {
        return;
    }

    // Calculate new index with wrapping
    let newIndex = lightboxState.currentItemIndex + direction;

    if (newIndex < 0) {
        newIndex = lightboxState.galleryItems.length - 1;
    } else if (newIndex >= lightboxState.galleryItems.length) {
        newIndex = 0;
    }

    const newItem = lightboxState.galleryItems[newIndex];

    // Skip video items - only show image items in lightbox gallery navigation
    if (newItem && newItem.classList && newItem.classList.contains('video-item')) {
        // Recursively try next item
        lightboxState.currentItemIndex = newIndex;
        changeGalleryItem(direction);
        return;
    }

    if (!newItem) return;

    // Update current index
    lightboxState.currentItemIndex = newIndex;

    // Get the image element to access stored data
    const imgElement = newItem.querySelector('.gallery-image');
    if (imgElement) {
        const src = imgElement.dataset.fullimage || imgElement.src;
        const caption = imgElement.dataset.caption || imgElement.alt || '';
        const frames = imgElement._frames || [];

        // Update lightbox with new item
        openLightbox(src, caption, frames, lightboxState.galleryItems, lightboxState.currentItemIndex);
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
    
    document.body.style.overflow = '';

    // Re-enable pointer events
    const nav = document.querySelector('nav');
    const mobileMenu = document.getElementById('mobile-menu');
    if (nav) nav.style.pointerEvents = '';
    if (mobileMenu) mobileMenu.style.pointerEvents = '';

    // Clean up events
    removeLightboxKeyboardNavigation();
    removeLightboxZoomPanEvents();
}

// Keyboard navigation
function setupLightboxKeyboardNavigation() {
    document.addEventListener('keydown', handleLightboxKeydown);
}

function removeLightboxKeyboardNavigation() {
    document.removeEventListener('keydown', handleLightboxKeydown);
}

function handleLightboxKeydown(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || lightbox.style.display === 'none') return;

    switch (e.key) {
        case 'Escape':
            e.preventDefault();
            closeLightbox();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (e.shiftKey) {
                // Shift + Left: Previous gallery item
                navigateLightbox(-1);
            } else {
                // Left: Previous frame
                changeFrame(-1);
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (e.shiftKey) {
                // Shift + Right: Next gallery item
                navigateLightbox(1);
            } else {
                // Right: Next frame
                changeFrame(1);
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            navigateLightbox(-1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            navigateLightbox(1);
            break;
    }
}

// Zoom and pan functionality
function resetLightboxTransform() {
    lightboxState.transform = {
        scale: 1,
        translateX: 0,
        translateY: 0
    };
    lightboxState.isZooming = false;
    lightboxState.isDragging = false;
    updateLightboxTransform();
}

function updateLightboxTransform() {
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightboxImg) return;

    const { scale, translateX, translateY } = lightboxState.transform;
    lightboxImg.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
}

function setupLightboxZoomPan() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    if (!lightbox || !lightboxImg) return;

    // Mouse wheel zoom
    lightbox.addEventListener('wheel', handleLightboxWheel, { passive: false });

    // Mouse drag events
    lightboxImg.addEventListener('mousedown', handleLightboxMouseDown);
    document.addEventListener('mousemove', handleLightboxMouseMove);
    document.addEventListener('mouseup', handleLightboxMouseUp);

    // Touch events for mobile
    lightboxImg.addEventListener('touchstart', handleLightboxTouchStart, { passive: false });
    document.addEventListener('touchmove', handleLightboxTouchMove, { passive: false });
    document.addEventListener('touchend', handleLightboxTouchEnd);

    // Double click/tap to toggle zoom
    lightboxImg.addEventListener('dblclick', handleLightboxDoubleClick);

    // Prevent default drag behavior
    lightboxImg.addEventListener('dragstart', e => e.preventDefault());
}

function handleLightboxWheel(e) {
    e.preventDefault();
    
    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newScale = Math.max(0.5, Math.min(5, lightboxState.transform.scale + delta));
    
    lightboxState.transform.scale = newScale;
    
    // Reset translation when zooming out to 1x
    if (newScale === 1) {
        lightboxState.transform.translateX = 0;
        lightboxState.transform.translateY = 0;
    }
    
    updateLightboxTransform();
}

function handleLightboxMouseDown(e) {
    if (lightboxState.transform.scale <= 1) return;
    
    e.preventDefault();
    lightboxState.isDragging = true;
    lightboxState.startX = e.clientX;
    lightboxState.startY = e.clientY;
    lightboxState.startTranslateX = lightboxState.transform.translateX;
    lightboxState.startTranslateY = lightboxState.transform.translateY;
    
    document.body.style.cursor = 'grabbing';
}

function handleLightboxMouseMove(e) {
    if (!lightboxState.isDragging) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - lightboxState.startX;
    const deltaY = e.clientY - lightboxState.startY;
    
    lightboxState.transform.translateX = lightboxState.startTranslateX + deltaX;
    lightboxState.transform.translateY = lightboxState.startTranslateY + deltaY;
    
    updateLightboxTransform();
}

function handleLightboxMouseUp() {
    lightboxState.isDragging = false;
    document.body.style.cursor = '';
}

function handleLightboxTouchStart(e) {
    if (e.touches.length === 1) {
        // Store initial touch position for both panning and swiping
        lightboxState.touchStartX = e.touches[0].clientX;
        lightboxState.touchStartY = e.touches[0].clientY;
        lightboxState.touchStartTime = Date.now();
        lightboxState.hasMoved = false;

        if (lightboxState.transform.scale > 1) {
            e.preventDefault();
            lightboxState.isDragging = true;
            lightboxState.startX = e.touches[0].clientX;
            lightboxState.startY = e.touches[0].clientY;
            lightboxState.startTranslateX = lightboxState.transform.translateX;
            lightboxState.startTranslateY = lightboxState.transform.translateY;
        }
    }
}

function handleLightboxTouchMove(e) {
    if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - lightboxState.touchStartX;
        const deltaY = e.touches[0].clientY - lightboxState.touchStartY;

        // Mark as moved if significant distance
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            lightboxState.hasMoved = true;
        }

        if (lightboxState.isDragging && lightboxState.transform.scale > 1) {
            e.preventDefault();
            lightboxState.transform.translateX = lightboxState.startTranslateX + deltaX / lightboxState.transform.scale;
            lightboxState.transform.translateY = lightboxState.startTranslateY + deltaY / lightboxState.transform.scale;
            updateLightboxTransform();
        }
    }
}

function handleLightboxTouchEnd(e) {
    if (lightboxState.isDragging) {
        lightboxState.isDragging = false;
        updateLightboxTransform();
    }

    // Handle swipe gestures for navigation (only if image is not zoomed)
    if (lightboxState.transform.scale === 1 && lightboxState.frames.length > 1) {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - lightboxState.touchStartTime;
        const deltaX = (e.changedTouches[0]?.clientX || lightboxState.touchStartX) - lightboxState.touchStartX;
        const deltaY = Math.abs((e.changedTouches[0]?.clientY || lightboxState.touchStartY) - lightboxState.touchStartY);

        // Swipe detection: fast horizontal movement, limited vertical movement
        const isSwipe = touchDuration < 300 && Math.abs(deltaX) > 50 && deltaY < 100;

        if (isSwipe) {
            if (deltaX > 0) {
                // Swipe right - go to previous frame
                changeFrame(-1);
            } else {
                // Swipe left - go to next frame
                changeFrame(1);
            }
        }
    }

    // Reset touch tracking
    lightboxState.touchStartX = 0;
    lightboxState.touchStartY = 0;
    lightboxState.touchStartTime = 0;
    lightboxState.hasMoved = false;
}

function handleLightboxDoubleClick(e) {
    e.preventDefault();
    if (lightboxState.transform.scale === 1) {
        lightboxState.transform.scale = 2;
    } else {
        lightboxState.transform.scale = 1;
        lightboxState.transform.translateX = 0;
        lightboxState.transform.translateY = 0;
    }
    updateLightboxTransform();
}

function removeLightboxZoomPanEvents() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    if (lightbox) {
        lightbox.removeEventListener('wheel', handleLightboxWheel);
    }

    if (lightboxImg) {
        lightboxImg.removeEventListener('mousedown', handleLightboxMouseDown);
        lightboxImg.removeEventListener('touchstart', handleLightboxTouchStart);
        lightboxImg.removeEventListener('dblclick', handleLightboxDoubleClick);
        lightboxImg.removeEventListener('dragstart', e => e.preventDefault());
    }

    document.removeEventListener('mousemove', handleLightboxMouseMove);
    document.removeEventListener('mouseup', handleLightboxMouseUp);
    document.removeEventListener('touchmove', handleLightboxTouchMove);
    document.removeEventListener('touchend', handleLightboxTouchEnd);
}

// Export functions for global access
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.changeFrame = changeFrame;
window.navigateLightbox = navigateLightbox;