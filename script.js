// Expose setupMobileMenu globally for dynamic nav injection

// Portfolio JavaScript - Clean Version



// Mobile menu setup function
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileBackdrop = document.getElementById('mobile-backdrop');
    const hamburgerLines = document.querySelectorAll('.hamburger-line');

    if (!mobileToggle || !mobileMenu || !mobileBackdrop) return;

    // Remove previous event listeners if any (by cloning)
    const newToggle = mobileToggle.cloneNode(true);
    mobileToggle.parentNode.replaceChild(newToggle, mobileToggle);
    const newBackdrop = mobileBackdrop.cloneNode(true);
    mobileBackdrop.parentNode.replaceChild(newBackdrop, mobileBackdrop);

    // Toggle mobile menu
    function toggleMobileMenu() {
        const isOpen = mobileMenu.classList.contains('active');
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    // Open mobile menu
    function openMobileMenu() {
        mobileMenu.classList.add('active');
        newBackdrop.classList.add('active');
        newToggle.setAttribute('aria-expanded', 'true');
        if (hamburgerLines.length >= 3) {
            hamburgerLines[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            hamburgerLines[1].style.opacity = '0';
            hamburgerLines[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        }
        document.body.style.overflow = 'hidden';
    }

    // Close mobile menu
    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        newBackdrop.classList.remove('active');
        newToggle.setAttribute('aria-expanded', 'false');
        if (hamburgerLines.length >= 3) {
            hamburgerLines[0].style.transform = '';
            hamburgerLines[1].style.opacity = '';
            hamburgerLines[2].style.transform = '';
        }
        document.body.style.overflow = '';
    }

    newToggle.addEventListener('click', function(e) {
        e.preventDefault();
        toggleMobileMenu();
    });
    newBackdrop.addEventListener('click', closeMobileMenu);

    // Close menu when clicking on menu links
    const mobileMenuLinks = mobileMenu.querySelectorAll('.mobile-nav-link, .mobile-dropdown-item');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Setup mobile dropdown toggles
    const mobileDropdownToggles = mobileMenu.querySelectorAll('.mobile-dropdown-toggle');
    mobileDropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = this.parentElement;
            const menu = dropdown.querySelector('.mobile-dropdown-menu');
            const isOpen = dropdown.classList.contains('open');
            
            // Close other mobile dropdowns
            mobileMenu.querySelectorAll('.mobile-nav-dropdown').forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    otherDropdown.classList.remove('open');
                }
            });
            
            // Toggle current dropdown
            if (isOpen) {
                dropdown.classList.remove('open');
            } else {
                dropdown.classList.add('open');
            }
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024 && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

// Setup dropdown functionality
function setupDropdowns() {
    // Handle desktop dropdown click for touch devices
    const desktopDropdowns = document.querySelectorAll('.dropdown-toggle');
    desktopDropdowns.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = this.parentElement;
            const menu = dropdown.querySelector('.dropdown-menu');
            
            // Close other dropdowns
            document.querySelectorAll('.nav-dropdown').forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    const otherMenu = otherDropdown.querySelector('.dropdown-menu');
                    if (otherMenu) {
                        otherMenu.classList.remove('show');
                    }
                }
            });
            
            // Toggle current dropdown
            if (menu) {
                menu.classList.toggle('show');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // Close dropdowns when scrolling
    document.addEventListener('scroll', function() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    });
}

// Call setupMobileMenu on DOMContentLoaded (for static nav)
document.addEventListener('DOMContentLoaded', function() {
    setupMobileMenu();
    setupDropdowns();
});

// NSFW Blur Toggle
function toggleNSFWBlur(overlayElement) {
    const galleryItem = overlayElement.closest('.gallery-item');
    if (galleryItem) {
        // Add both 'nsfw-revealed' and 'revealed' for CSS compatibility
        galleryItem.classList.add('nsfw-revealed');
        galleryItem.classList.add('revealed');
        overlayElement.style.display = 'none';
    }
}

// Lightbox functionality with zoom and pan
let lightboxState = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    frames: [],
    currentFrame: 0,
    baseCaption: ''
};

function openLightbox(src, caption, frames) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    if (!lightbox || !lightboxImg || !lightboxCaption) {
        return;
    }

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
    // If frames exist and include the src, start there. If src isn't in frames,
    // default to the first frame (do NOT prepend the thumbnail). This avoids
    // showing the thumbnail twice when frames are separate full-size images.
    if (frames && frames.length > 0) {
        // Normalize helper to strip cache busters and query strings
        const stripQuery = (s) => (s || '').split('?')[0];
        const basename = (s) => stripQuery(s).split('/').pop();

        const framesBasenames = frames.map(f => basename(f));
        const srcBasename = basename(src);

        if (!framesBasenames.includes(srcBasename)) {
            // src isn't present in frames — include it at the front
            lightboxState.frames = [src, ...frames];
            lightboxState.currentFrame = 0;
        } else {
            // src exists in frames already — use frames as-is and start at that index
            lightboxState.frames = frames;
            lightboxState.currentFrame = framesBasenames.indexOf(srcBasename);
            // ensure src points to the matching frames entry (may include cache-buster)
            src = lightboxState.frames[lightboxState.currentFrame];
        }
    } else {
        lightboxState.frames = [src];
        lightboxState.currentFrame = 0;
    }
    lightboxState.baseCaption = displayCaption;

    lightbox.style.display = 'block';
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

    const { category, workType, tags } = lightboxState.itemInfo;

    // Generate tags HTML
    const tagsHTML = tags && tags.length > 0 ?
        `<div class="lightbox-tags">
            ${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>` : '';

    // Display category, workType, and tags
    lightboxItemInfo.innerHTML = `
        <div class="lightbox-type">${category || ''}</div>
        <div class="lightbox-work-type">${workType || ''}</div>
        ${tagsHTML}
    `;
    lightboxItemInfo.style.display = 'flex';
}

function updateFrameNavigation() {
    let prevBtn = document.getElementById('lightbox-prev');
    let nextBtn = document.getElementById('lightbox-next');
    const wrapper = document.getElementById('lightbox-img-wrapper');

    if (!prevBtn || !nextBtn) {
        // Create navigation buttons if they don't exist
        if (wrapper && lightboxState.frames && lightboxState.frames.length > 1) {
            if (!prevBtn) {
                prevBtn = document.createElement('button');
                prevBtn.id = 'lightbox-prev';
                prevBtn.className = 'lightbox-nav-btn lightbox-prev';
                prevBtn.innerHTML = '‹';
                prevBtn.onclick = () => changeFrame(-1);
                wrapper.appendChild(prevBtn);
            }

            if (!nextBtn) {
                nextBtn = document.createElement('button');
                nextBtn.id = 'lightbox-next';
                nextBtn.className = 'lightbox-nav-btn lightbox-next';
                nextBtn.innerHTML = '›';
                nextBtn.onclick = () => changeFrame(1);
                wrapper.appendChild(nextBtn);
            }
        }
    }

    // Show/hide based on frame count
    const showNavigation = lightboxState.frames && lightboxState.frames.length > 1;
    if (prevBtn) {
        prevBtn.style.display = showNavigation ? 'flex' : 'none';
    }
    if (nextBtn) {
        nextBtn.style.display = showNavigation ? 'flex' : 'none';
    }
}

function changeFrame(direction) {
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
    resetLightboxTransform();
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Re-enable pointer events on navigation and other content
        const nav = document.querySelector('nav');
        const mobileMenu = document.getElementById('mobile-menu');
        if (nav) nav.style.pointerEvents = 'auto';
        if (mobileMenu) mobileMenu.style.pointerEvents = 'auto';

        // Reset zoom and pan state
        resetLightboxTransform();
        removeLightboxZoomPanEvents();
        removeLightboxKeyboardNavigation();
    }
}

// Setup keyboard navigation for lightbox
function setupLightboxKeyboardNavigation() {
    document.addEventListener('keydown', handleLightboxKeydown);
}

// Remove keyboard navigation for lightbox
function removeLightboxKeyboardNavigation() {
    document.removeEventListener('keydown', handleLightboxKeydown);
}

// Handle keyboard events for lightbox
function handleLightboxKeydown(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || lightbox.style.display === 'none') return;
    
    switch(e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            if (lightboxState.frames && lightboxState.frames.length > 1) {
                changeFrame(-1);
            }
            break;
        case 'ArrowRight':
            if (lightboxState.frames && lightboxState.frames.length > 1) {
                changeFrame(1);
            }
            break;
    }
}

// Reset lightbox transform state
function resetLightboxTransform() {
    // Preserve frames and caption data during transform reset
    const preservedFrames = lightboxState.frames;
    const preservedCurrentFrame = lightboxState.currentFrame;
    const preservedBaseCaption = lightboxState.baseCaption;
    
    lightboxState = {
        scale: 1,
        translateX: 0,
        translateY: 0,
        isDragging: false,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        frames: preservedFrames,
        currentFrame: preservedCurrentFrame,
        baseCaption: preservedBaseCaption
    };

    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) {
        lightboxImg.style.transform = 'scale(1) translate(0px, 0px)';
        lightboxImg.style.cursor = 'zoom-in';
    }
}

// Apply transform to lightbox image
function updateLightboxTransform() {
    const lightboxImg = document.getElementById('lightbox-img');
    if (lightboxImg) {
        lightboxImg.style.transform = `scale(${lightboxState.scale}) translate(${lightboxState.translateX}px, ${lightboxState.translateY}px)`;
        lightboxImg.style.cursor = lightboxState.scale > 1 ? 'grab' : 'zoom-in';
        if (lightboxState.isDragging) {
            lightboxImg.style.cursor = 'grabbing';
        }
    }
}

// Setup zoom and pan event listeners
function setupLightboxZoomPan() {
    const lightboxImg = document.getElementById('lightbox-img');
    const lightbox = document.getElementById('lightbox');

    if (!lightboxImg || !lightbox) return;

    // Mouse wheel zoom
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.5, Math.min(5, lightboxState.scale + delta));

        if (newScale !== lightboxState.scale) {
            lightboxState.scale = newScale;

            // If zooming out to 1 or less, reset position
            if (lightboxState.scale <= 1) {
                lightboxState.translateX = 0;
                lightboxState.translateY = 0;
                lightboxState.scale = 1;
            }

            updateLightboxTransform();
        }
    };

    // Mouse drag for panning
    const handleMouseDown = (e) => {
        if (lightboxState.scale > 1) {
            e.preventDefault();
            lightboxState.isDragging = true;
            lightboxState.startX = e.clientX;
            lightboxState.startY = e.clientY;
            lightboxState.lastX = lightboxState.translateX;
            lightboxState.lastY = lightboxState.translateY;
            updateLightboxTransform();
        }
    };

    const handleMouseMove = (e) => {
        if (lightboxState.isDragging && lightboxState.scale > 1) {
            e.preventDefault();
            const deltaX = e.clientX - lightboxState.startX;
            const deltaY = e.clientY - lightboxState.startY;
            lightboxState.translateX = lightboxState.lastX + deltaX / lightboxState.scale;
            lightboxState.translateY = lightboxState.lastY + deltaY / lightboxState.scale;
            updateLightboxTransform();
        }
    };

    const handleMouseUp = () => {
        lightboxState.isDragging = false;
        updateLightboxTransform();
    };

    // Touch events for mobile
    const handleTouchStart = (e) => {
        if (e.touches.length === 1 && lightboxState.scale > 1) {
            e.preventDefault();
            lightboxState.isDragging = true;
            lightboxState.startX = e.touches[0].clientX;
            lightboxState.startY = e.touches[0].clientY;
            lightboxState.lastX = lightboxState.translateX;
            lightboxState.lastY = lightboxState.translateY;
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 1 && lightboxState.isDragging && lightboxState.scale > 1) {
            e.preventDefault();
            const deltaX = e.touches[0].clientX - lightboxState.startX;
            const deltaY = e.touches[0].clientY - lightboxState.startY;
            lightboxState.translateX = lightboxState.lastX + deltaX / lightboxState.scale;
            lightboxState.translateY = lightboxState.lastY + deltaY / lightboxState.scale;
            updateLightboxTransform();
        }
    };

    const handleTouchEnd = () => {
        lightboxState.isDragging = false;
        updateLightboxTransform();
    };

    // Double click/tap to toggle zoom
    const handleDoubleClick = (e) => {
        e.preventDefault();
        if (lightboxState.scale === 1) {
            lightboxState.scale = 2;
        } else {
            lightboxState.scale = 1;
            lightboxState.translateX = 0;
            lightboxState.translateY = 0;
        }
        updateLightboxTransform();
    };

    // Store event handlers for cleanup
    lightboxImg._zoomPanHandlers = {
        wheel: handleWheel,
        mousedown: handleMouseDown,
        mousemove: handleMouseMove,
        mouseup: handleMouseUp,
        touchstart: handleTouchStart,
        touchmove: handleTouchMove,
        touchend: handleTouchEnd,
        dblclick: handleDoubleClick
    };

    // Add event listeners
    lightboxImg.addEventListener('wheel', handleWheel, { passive: false });
    lightboxImg.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    lightboxImg.addEventListener('touchstart', handleTouchStart, { passive: false });
    lightboxImg.addEventListener('touchmove', handleTouchMove, { passive: false });
    lightboxImg.addEventListener('touchend', handleTouchEnd);
    lightboxImg.addEventListener('dblclick', handleDoubleClick);
}

// Remove zoom and pan event listeners
function removeLightboxZoomPanEvents() {
    const lightboxImg = document.getElementById('lightbox-img');

    if (lightboxImg && lightboxImg._zoomPanHandlers) {
        const handlers = lightboxImg._zoomPanHandlers;

        lightboxImg.removeEventListener('wheel', handlers.wheel);
        lightboxImg.removeEventListener('mousedown', handlers.mousedown);
        document.removeEventListener('mousemove', handlers.mousemove);
        document.removeEventListener('mouseup', handlers.mouseup);
        lightboxImg.removeEventListener('touchstart', handlers.touchstart);
        lightboxImg.removeEventListener('touchmove', handlers.touchmove);
        lightboxImg.removeEventListener('touchend', handlers.touchend);
        lightboxImg.removeEventListener('dblclick', handlers.dblclick);

        delete lightboxImg._zoomPanHandlers;
    }
}

// Music Player Class
class ConsolidatedMusicPlayer {
    constructor(container, musicData) {
        this.container = container;
        this.musicData = musicData;
        this.currentTrack = 0;
        this.isPlaying = false;
        
        this.audio = container.querySelector('#main-audio');
        this.playPauseBtn = container.querySelector('#play-pause-btn');
        this.prevBtn = container.querySelector('#prev-btn');
        this.nextBtn = container.querySelector('#next-btn');
        this.progressBar = container.querySelector('#progress-bar');
        this.progressFill = container.querySelector('#progress-fill');
        this.currentTitle = container.querySelector('#current-title');
        this.currentTime = container.querySelector('#current-time');
        this.totalTime = container.querySelector('#total-time');
        this.trackList = container.querySelector('#track-list');
        
        this.init();
    }
    
    init() {
        if (!this.audio) return;

        // Control event listeners
        if (this.playPauseBtn) {
            this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        }
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousTrack());
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextTrack());
        }
        
        // Progress bar click to seek
        if (this.progressBar) {
            this.progressBar.addEventListener('click', (e) => this.seekToPosition(e));
        }
        
        // Audio event listeners
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('play', () => this.updatePlayButton(true));
        this.audio.addEventListener('pause', () => this.updatePlayButton(false));
        
        // Track list event listeners
        if (this.trackList) {
            this.trackList.addEventListener('click', (e) => {
                const trackItem = e.target.closest('.track-item');
                if (trackItem) {
                    const trackIndex = parseInt(trackItem.dataset.track);
                    this.playTrack(trackIndex);
                }
            });
        }
    }
    
    togglePlay() {
        if (!this.audio) return;
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(e => console.log('Play failed:', e));
        }
    }
    
    playTrack(index) {
        if (index < 0 || index >= this.musicData.length) return;
        
        this.currentTrack = index;
        this.audio.src = this.musicData[index].src;
        
        if (this.currentTitle) {
            this.currentTitle.textContent = this.musicData[index].title;
        }
        
        // Update active track in playlist
        if (this.trackList) {
            this.trackList.querySelectorAll('.track-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeTrack = this.trackList.querySelector(`[data-track="${index}"]`);
            if (activeTrack) {
                activeTrack.classList.add('active');
            }
        }
        
        this.audio.load();
        if (this.isPlaying) {
            this.audio.play().catch(e => console.log('Play failed:', e));
        }
    }
    
    nextTrack() {
        this.currentTrack = (this.currentTrack + 1) % this.musicData.length;
        this.playTrack(this.currentTrack);
    }
    
    previousTrack() {
        this.currentTrack = (this.currentTrack - 1 + this.musicData.length) % this.musicData.length;
        this.playTrack(this.currentTrack);
    }
    
    seekToPosition(e) {
        if (!this.audio.duration) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const clickPercent = clickX / width;
        const seekTime = clickPercent * this.audio.duration;
        this.audio.currentTime = Math.max(0, Math.min(seekTime, this.audio.duration));
    }
    
    updateProgress() {
        if (!this.audio.duration) return;
        
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        if (this.progressFill) {
            this.progressFill.style.width = progress + '%';
        }
        
        // Format time display
        const currentMin = Math.floor(this.audio.currentTime / 60);
        const currentSec = Math.floor(this.audio.currentTime % 60);
        const totalMin = Math.floor(this.audio.duration / 60);
        const totalSec = Math.floor(this.audio.duration % 60);
        
        if (this.currentTime) {
            this.currentTime.textContent = `${currentMin}:${String(currentSec).padStart(2, '0')}`;
        }
        if (this.totalTime) {
            this.totalTime.textContent = `${totalMin}:${String(totalSec).padStart(2, '0')}`;
        }
    }
    
    updateDuration() {
        if (this.audio.duration && this.trackList) {
            const trackItem = this.trackList.querySelector(`[data-track="${this.currentTrack}"]`);
            const durationSpan = trackItem ? trackItem.querySelector('.track-duration') : null;
            if (durationSpan) {
                const min = Math.floor(this.audio.duration / 60);
                const sec = Math.floor(this.audio.duration % 60);
                durationSpan.textContent = `${min}:${String(sec).padStart(2, '0')}`;
            }
        }
    }
    
    updatePlayButton(playing) {
        this.isPlaying = playing;
        if (!this.playPauseBtn) return;
        
        const playIcon = this.playPauseBtn.querySelector('#play-icon');
        if (playIcon) {
            if (playing) {
                // Show pause (two rectangles)
                playIcon.innerHTML = '<rect x="11" y="10" width="3" height="12" fill="white"/><rect x="18" y="10" width="3" height="12" fill="white"/>';
            } else {
                // Show play (triangle)
                playIcon.innerHTML = '<polygon points="13,10 13,22 23,16" fill="white"/>';
            }
        }
    }
}

// Video Lazy Loading Implementation
function initVideoLazyLoading() {
    const lazyVideos = document.querySelectorAll('.lazy-video');
    
    if ('IntersectionObserver' in window) {
        // Modern browser support
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    loadVideo(video);
                    videoObserver.unobserve(video);
                }
            });
        }, {
            rootMargin: '50px' // Start loading 50px before the video enters viewport
        });
        
        lazyVideos.forEach(video => {
            videoObserver.observe(video);
        });
    } else {
        // Fallback for older browsers
        lazyVideos.forEach(video => {
            loadVideo(video); // Just load all videos immediately
        });
    }
}

function loadVideo(video) {
    // Load the video source
    const dataSrc = video.getAttribute('data-src');
    if (dataSrc) {
        // Set the source
        const source = video.querySelector('source');
        if (source) {
            source.src = source.getAttribute('data-src');
        }
        video.src = dataSrc;
        
        // Change preload to metadata to get first frame
        video.preload = 'metadata';
        
        // Remove lazy class
        video.classList.remove('lazy-video');
        
        // Load the video
        video.load();
        
        // Optional: Auto-load first frame
        video.addEventListener('loadedmetadata', () => {
            video.currentTime = 0.5; // Get frame at 0.5 seconds
        });
    }
}

// Gallery generation with lazy loading
function generateGallery(containerSelector, mediaData) {
    const container = document.querySelector(containerSelector);
    if (!container || !mediaData) {
        console.log('Gallery generation failed: container or data missing');
        return;
    }
    
    container.innerHTML = '';
    
    mediaData.forEach((item, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        // Add NSFW class if item is marked as NSFW
        if (item.nsfw) {
            galleryItem.className += ' nsfw';
        }

        // Add data-categories attribute from tags AND category
        const tags = item.tags || [];
        const itemCategory = item.category || '';
        
        // Combine tags and category for filtering
        const allCategories = [...tags];
        if (itemCategory) {
            allCategories.push(itemCategory);
        }
        
        const categories = allCategories.map(cat => cat.toLowerCase()).join(',');
        if (categories) {
            galleryItem.setAttribute('data-categories', categories);
        }
        
        // Add data-featured attribute
        galleryItem.setAttribute('data-featured', item.featured ? 'true' : 'false');
        
        // Clean up the title
        const cleanTitle = item.title
            .replace(/-f$/, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        
        // Get category - prioritize genre over folder category
        let category = item.genre || item.category || 'Artwork';
        if (category === 'character-design') category = 'Character Design';
        if (category === 'game-art') category = 'Game Art';
        if (category === 'illustration') category = 'Illustration';
        if (category === '3d') category = '3D Art';
        
        // Get work type
        const workType = item.workType || 'Creative Work';

        // Generate tags HTML
        const tagsHTML = tags.length > 0 ?
            `<div class="gallery-tags">
                ${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>` : '';

        // Handle videos and images
        if (item.video) {
            galleryItem.className += ' video-item';
            // Use placeholder image or create a data-src for lazy loading
            const thumbnailSrc = item.thumbnail ? item.thumbnail : '';
            galleryItem.innerHTML = `
                <div class="video-thumb" onclick="openVideoModal('${item.video}', '${cleanTitle}')">
                    ${thumbnailSrc ?
                        `<img src="${item.thumbnail}" alt="${cleanTitle}" class="video-thumbnail" loading="lazy">` :
                        `<video class="video-thumbnail lazy-video"
                               data-src="${item.video}"
                               preload="none"
                               muted
                               playsinline>
                            <source data-src="${item.video}" type="video/mp4">
                        </video>`
                    }
                    <div class="play-overlay"></div>
                    <div class="gallery-title">${cleanTitle}</div>
                    <div class="gallery-overlay">
                        <div class="gallery-type">${category}</div>
                        <div class="gallery-work-type">${workType}</div>
                        ${tagsHTML}
                    </div>
                    ${item.nsfw ? '<div class="nsfw-overlay" onclick="toggleNSFWBlur(this)"><span>18+ Content<br>Click to View</span></div>' : ''}
                </div>
            `;
        } else {
            // Use fullImage if available, otherwise fallback to image
            const fullImage = item.fullImage || item.image;
            const frames = item.frames || [];

            galleryItem.innerHTML = `
                <img src="${item.image}" alt="${cleanTitle}" loading="lazy" class="gallery-image" data-fullimage="${fullImage}" data-caption="${cleanTitle}">
                <div class="gallery-title">${cleanTitle}</div>
                <div class="gallery-overlay">
                    <div class="gallery-type">${category}</div>
                    <div class="gallery-work-type">${workType}</div>
                    ${tagsHTML}
                </div>
                ${item.nsfw ? '<div class="nsfw-overlay" onclick="toggleNSFWBlur(this)"><span>18+ Content<br>Click to View</span></div>' : ''}
            `;

            // Store frames data and attach click event
            const img = galleryItem.querySelector('.gallery-image');
            if (img) {
                img._frames = frames; // Store frames directly on the element
                img.addEventListener('click', function() {
                    // Pass the actual clicked image src so the lightbox can include it
                    // If the clicked image is a custom thumbnail (e.g. thumbnails/..._thumb.jpg),
                    // map it to its full-size image (remove '/thumbnails/' and '_thumb') so
                    // the lightbox uses the large image and can match frames correctly.
                    const rawSrc = this.getAttribute('src') || this.src || this.dataset.fullimage;
                    let clickedSrc = rawSrc;

                    try {
                        // Separate path and querystring
                        const parts = rawSrc.split('?');
                        const pathOnly = parts[0] || '';
                        const query = parts[1] ? '?' + parts[1] : '';

                        // If the path contains a thumbnails directory or filename suffix, map it
                        if (/\/thumbnails\//.test(pathOnly) || /_thumb\.[^/.]+$/.test(pathOnly)) {
                            // Replace '/thumbnails/' with '/' and remove '_thumb' before extension
                            const mapped = pathOnly.replace('/thumbnails/', '/').replace(/_thumb(?=\.[^/.]+$)/, '');
                            clickedSrc = mapped + query;
                        }
                    } catch (e) {
                        // fallback to rawSrc on any error
                        clickedSrc = rawSrc;
                    }

                    openLightbox(clickedSrc, this.dataset.caption, this._frames);
                });
            }
        }
        
        // Add loading animation delay
        galleryItem.style.animationDelay = `${index * 0.1}s`;
        container.appendChild(galleryItem);
    });
    
    // Initialize video lazy loading after gallery is created
    initVideoLazyLoading();
}

// Enhanced gallery generation (alias for backward compatibility)
function generateEnhancedGallery(containerSelector, mediaData) {
    generateGallery(containerSelector, mediaData);
}

// Music player generation
function generateConsolidatedMusicPlayer(containerSelector, musicData) {
    const container = document.querySelector(containerSelector);
    if (!container || !musicData) return;
    
    const playerHTML = `
        <div class="music-player-unit">
            <div class="current-track">
                <div class="track-info">
                    <h3 id="current-title">${musicData[0].title}</h3>
                </div>
                <div class="player-controls">
                    <button id="prev-btn" class="control-btn" title="Previous">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <polygon points="19,20 9,12 19,4" fill="currentColor"/>
                            <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                    <button id="play-pause-btn" class="control-btn play-btn" title="Play/Pause">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <g id="play-icon">
                                <polygon points="13,10 13,22 23,16" fill="white"/>
                            </g>
                        </svg>
                    </button>
                    <button id="next-btn" class="control-btn" title="Next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <polygon points="5,4 15,12 5,20" fill="currentColor"/>
                            <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"/>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="progress-container">
                <span class="current-time" id="current-time">0:00</span>
                <div class="progress-bar-wrapper">
                    <div class="progress-bar" id="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                </div>
                <span class="total-time" id="total-time">0:00</span>
            </div>
            
            <div class="playlist">
                <h4>Playlist</h4>
                <div class="track-list" id="track-list">
                    ${musicData.map((track, index) => `
                        <div class="track-item ${index === 0 ? 'active' : ''}" data-track="${index}">
                            <span class="track-number">${String(index + 1).padStart(2, '0')}</span>
                            <span class="track-title">${track.title}</span>
                            <span class="track-duration">--:--</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <audio id="main-audio" preload="metadata">
                <source src="${musicData[0].src}" type="audio/mpeg">
            </audio>
        </div>
    `;
    
    container.innerHTML = playerHTML;
    return new ConsolidatedMusicPlayer(container, musicData);
}

// Enhanced video modal with lazy loading
function openVideoModal(src, caption) {
    let modal = document.getElementById('video-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video-modal';
        modal.className = 'video-modal';
        modal.innerHTML = `
            <button class="video-close" onclick="closeVideoModal()">&times;</button>
            <div class="video-modal-content">
                <div class="video-loading" id="video-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading video...</p>
                </div>
                <video id="modal-video" class="modal-video" controls preload="none" style="display: none;">
                    <source id="modal-video-src" src="" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
            <div id="video-modal-caption" class="lightbox-caption"></div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeVideoModal();
            }
        });
    }
    
    const video = document.getElementById('modal-video');
    const source = document.getElementById('modal-video-src');
    const captionElement = document.getElementById('video-modal-caption');
    const loadingElement = document.getElementById('video-loading');
    
    if (source && video && captionElement) {
        // Show loading state
        loadingElement.style.display = 'block';
        video.style.display = 'none';
        
        // Set up video
        source.src = src;
        video.load();
        captionElement.textContent = caption;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Hide loading when video is ready
        video.addEventListener('canplay', () => {
            loadingElement.style.display = 'none';
            video.style.display = 'block';
        }, { once: true });
        
        // Handle loading errors
        video.addEventListener('error', () => {
            loadingElement.innerHTML = '<p>Error loading video</p>';
        }, { once: true });
    }
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const video = document.getElementById('modal-video');
    
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
}

// Initialize everything when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Inject shared footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('footer.html')
            .then(res => res.text())
            .then(html => {
                footerPlaceholder.outerHTML = html;
            });
    }

    // Close lightbox on outside click
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLightbox();
            }
        });
    }
    
    // Close modals with escape key, navigate frames with arrow keys
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
            closeVideoModal();
        }

        // Navigate frames with arrow keys when lightbox is open
        const lightbox = document.getElementById('lightbox');
        if (lightbox && lightbox.style.display === 'block' && lightboxState.frames.length > 1) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                changeFrame(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                changeFrame(1);
            }
        }
    });
});

// Export functions for global access
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.generateGallery = generateGallery;
window.generateEnhancedGallery = generateEnhancedGallery;
window.generateConsolidatedMusicPlayer = generateConsolidatedMusicPlayer;

// Simple Game Toggle Functionality
function setupGameToggles() {
    document.querySelectorAll('[data-game-index]').forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            const gameIndex = this.dataset.gameIndex;
            const preview = document.getElementById(`game-preview-${gameIndex}`);
            const iframe = document.getElementById(`game-iframe-${gameIndex}`);
            
            if (preview && iframe) {
                // Hide preview, show iframe
                preview.style.display = 'none';
                iframe.style.display = 'block';
                
                // Load the game if not already loaded
                if (!iframe.src) {
                    iframe.src = iframe.dataset.embedUrl;
                }
            }
        });
    });
}

// Initialize game toggles when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGameToggles);
} else {
    setupGameToggles();
}

// Filter functionality for homepage
function initializeFilter() {
    const filterButtons = document.querySelectorAll('.filter-pill');
    const gallery = document.getElementById('featured-gallery');
    const sectionTitle = document.getElementById('section-title');
    const itemCount = document.getElementById('item-count');
    
    if (!filterButtons.length || !gallery) return;
    
    // Filter the data based on selected filter
    function filterItems(filterValue) {
        let filteredData;
        
        if (filterValue === 'all') {
            // Show all items except audio (since that's for audio page)
            filteredData = allData.filter(item => 
                item.type !== 'audio' && 
                !item.hidden &&
                item.title !== 'dirtpickle-portrait'
            );
        } else if (filterValue === 'featured') {
            // Show only featured items (excluding audio)
            filteredData = allData.filter(item => 
                item.featured && 
                item.type !== 'audio' && 
                !item.hidden &&
                item.title !== 'dirtpickle-portrait'
            );
        } else {
            // Filter by tag or category (excluding audio)
            filteredData = allData.filter(item => {
                if (item.type === 'audio' || item.hidden || item.title === 'dirtpickle-portrait') return false;
                
                const tags = item.tags || [];
                const category = item.category || '';
                const allCategories = [...tags, category].map(cat => cat.toLowerCase());
                
                return allCategories.includes(filterValue.toLowerCase());
            });
        }
        
        // Update section title and count
        let title = filterValue === 'all' ? 'All Work' : 
                   filterValue === 'featured' ? 'Featured Work' : 
                   filterValue.charAt(0).toUpperCase() + filterValue.slice(1);
        
        if (sectionTitle) sectionTitle.textContent = title;
        if (itemCount) itemCount.textContent = `${filteredData.length} items`;
        
        // Regenerate gallery with filtered data
        generateGallery('#featured-gallery', filteredData);
    }
    
    // Add click event listeners to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter items
            const filterValue = this.getAttribute('data-filter');
            filterItems(filterValue);
        });
    });
    
    // Initialize with featured items
    const activeButton = document.querySelector('.filter-pill.active');
    if (activeButton) {
        const initialFilter = activeButton.getAttribute('data-filter');
        filterItems(initialFilter);
    }
}

// Initialize filter when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setupGameToggles();
        initializeFilter();
    });
} else {
    setupGameToggles();
    initializeFilter();
}