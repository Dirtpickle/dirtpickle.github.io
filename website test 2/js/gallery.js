// Gallery Generation and Management

// Video modal functionality
function openVideoModal(videoSrc, title) {
    let modal = document.getElementById('video-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video-modal';
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-content">
                <button class="lightbox-close" onclick="closeVideoModal()" aria-label="Close video">&times;</button>
                <div class="video-title" id="video-caption"></div>
                <video id="modal-video" controls autoplay>
                    <source src="" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const video = modal.querySelector('#modal-video');
    const caption = modal.querySelector('#video-caption');
    
    if (video && caption) {
        video.src = videoSrc;
        caption.textContent = title;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    if (modal) {
        const video = modal.querySelector('#modal-video');
        if (video) {
            video.pause();
            video.src = '';
        }
        modal.style.display = 'none';
        document.body.style.overflow = '';
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

        // Add data-categories attribute from tags only (category field no longer used for filtering)
        const tags = item.tags || [];
        const itemWorkType = item.workType || '';
        
        // Combine tags and workType for filtering (no category)
        const allCategories = [...tags];
        if (itemWorkType) {
            allCategories.push(itemWorkType);
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
        
        // Get work type for display
        const workType = item.workType || 'Creative Work';

        // Generate tags HTML
        const tagsHTML = tags.length > 0 ?
            `<div class="gallery-tags">
                ${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>` : '';

        // Handle videos and images
        if (item.video) {
            galleryItem.className += ' video-item';
            const thumbnailSrc = item.thumbnail ? item.thumbnail : '';
            galleryItem.innerHTML = `
                <div class="video-thumb">
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
                        <div class="gallery-type">${workType}</div>
                        ${tagsHTML}
                    </div>
                    ${item.nsfw ? `<div class="nsfw-overlay" onclick="toggleNSFWBlur(this)">
                        <div class="nsfw-content">
                            <div class="nsfw-warning">NSFW Content</div>
                            <div class="nsfw-toggle-text">Show NSFW Content</div>
                        </div>
                    </div>` : ''}
                </div>
            `;

            const videoThumb = galleryItem.querySelector('.video-thumb');
            if (videoThumb) {
                videoThumb.addEventListener('click', function(e) {
                    // Don't trigger if clicking on NSFW overlay
                    if (e.target.closest('.nsfw-overlay')) return;
                    
                    // Check if this item has a custom link URL
                    if (item.linkUrl) {
                        window.location.href = item.linkUrl;
                        return;
                    }
                    
                    // Otherwise open video modal as normal
                    openVideoModal(item.video, cleanTitle);
                });
            }
        } else {
            // Handle images
            const frames = item.frames || [];
            
            galleryItem.innerHTML = `
                <img src="${item.image}" 
                     alt="${cleanTitle}" 
                     class="gallery-image" 
                     loading="lazy"
                     data-fullimage="${item.fullImage || item.image}"
                     data-caption="${cleanTitle}">
                <div class="gallery-title">${cleanTitle}</div>
                <div class="gallery-overlay">
                    <div class="gallery-type">${workType}</div>
                    ${tagsHTML}
                </div>
                ${item.nsfw ? `<div class="nsfw-overlay" onclick="toggleNSFWBlur(this)">
                    <div class="nsfw-content">
                        <div class="nsfw-warning">NSFW Content</div>
                        <div class="nsfw-toggle-text">Show NSFW Content</div>
                    </div>
                </div>` : ''}
            `;

            // Store frames data and attach click event
            const img = galleryItem.querySelector('.gallery-image');
            if (img) {
                img._frames = frames; // Store frames directly on the element
                img._itemData = item; // Store item data for later
                img._mediaData = mediaData; // Store reference to full array
                img.addEventListener('click', function() {
                    // Check if this item has a custom link URL
                    if (item.linkUrl) {
                        window.location.href = item.linkUrl;
                        return;
                    }

                    // Always use the fullImage property for the lightbox, not the thumbnail
                    const fullImageSrc = this.dataset.fullimage;
                    const caption = this.dataset.caption;

                    // Get only gallery items from the SAME CONTAINER (specific gallery section)
                    const container = document.querySelector(containerSelector);
                    const containerGalleryItems = container ? container.querySelectorAll('.gallery-item') : [];

                    // Find current item index within this specific container
                    const galleryItemsArray = Array.from(containerGalleryItems);
                    const currentGalleryItem = this.closest('.gallery-item');
                    const currentVisibleIndex = galleryItemsArray.indexOf(currentGalleryItem);

                    // Only include visible (non-filtered) items for navigation
                    const visibleItems = galleryItemsArray.filter(item => 
                        getComputedStyle(item).display !== 'none'
                    );

                    openLightbox(fullImageSrc, caption, this._frames, visibleItems, currentVisibleIndex);
                });
            }
        }

        container.appendChild(galleryItem);
    });

    // Initialize lazy loading for videos
    initVideoLazyLoading();
    
    console.log(`Generated gallery with ${mediaData.length} items`);
    
    // Return the generated gallery for chaining
    return container;
}

// Lazy loading for videos
function initVideoLazyLoading() {
    const lazyVideos = document.querySelectorAll('.lazy-video');
    
    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    loadVideo(video);
                    videoObserver.unobserve(video);
                }
            });
        });

        lazyVideos.forEach(video => {
            videoObserver.observe(video);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        lazyVideos.forEach(loadVideo);
    }
}

function loadVideo(video) {
    const src = video.dataset.src;
    if (src) {
        video.src = src;
        const source = video.querySelector('source');
        if (source && source.dataset.src) {
            source.src = source.dataset.src;
        }
        video.classList.remove('lazy-video');
        video.load();
    }
}

/**
 * Setup game thumbnail toggles for items with external links
 * Handles the interaction between game thumbnails and iframe viewing
 */
function setupGameToggles() {
    console.log('Setting up game toggles...');
    
    const gameItems = document.querySelectorAll('.gallery-item[data-type="game"]');
    console.log('Game items found:', gameItems.length);
    
    gameItems.forEach(item => {
        const img = item.querySelector('.gallery-image');
        const linkUrl = item.dataset.linkUrl;
        
        if (img && linkUrl) {
            // Add special styling for game items
            item.classList.add('game-item');
            img.style.cursor = 'pointer';
            
            // Add play button overlay
            const playButton = document.createElement('div');
            playButton.className = 'play-button-overlay';
            playButton.innerHTML = '▶';
            playButton.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.7);
                color: white;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                z-index: 2;
            `;
            
            // Add hover effects
            item.style.position = 'relative';
            item.appendChild(playButton);
            
            item.addEventListener('mouseenter', () => {
                playButton.style.opacity = '1';
            });
            
            item.addEventListener('mouseleave', () => {
                playButton.style.opacity = '0';
            });
            
            // Override click behavior for games with linkUrl
            img.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Game clicked, opening:', linkUrl);
                
                // Create game modal for iframe viewing
                const gameModal = createGameModal(linkUrl, item.dataset.title || 'Game');
                document.body.appendChild(gameModal);
                
                // Show modal
                requestAnimationFrame(() => {
                    gameModal.classList.add('active');
                });
            });
        }
    });
}

/**
 * Create a modal for displaying games in iframe
 * @param {string} gameUrl - The URL of the game
 * @param {string} gameTitle - The title of the game
 * @returns {HTMLElement} The modal element
 */
function createGameModal(gameUrl, gameTitle) {
    const modal = document.createElement('div');
    modal.className = 'game-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div class="game-container" style="
            width: 90%;
            height: 90%;
            max-width: 1200px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        ">
            <div class="game-header" style="
                background: #333;
                color: white;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; font-size: 18px;">${gameTitle}</h3>
                <button class="close-game-btn" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
            </div>
            <iframe src="${gameUrl}" 
                    style="width: 100%; height: calc(100% - 60px); border: none;"
                    frameborder="0"
                    allowfullscreen>
            </iframe>
        </div>
    `;
    
    // Add close functionality
    const closeBtn = modal.querySelector('.close-game-btn');
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Add keyboard support
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    // Style active state
    modal.classList.add = function(className) {
        HTMLElement.prototype.classList.add.call(this, className);
        if (className === 'active') {
            this.style.opacity = '1';
        }
    };
    
    modal.classList.remove = function(className) {
        HTMLElement.prototype.classList.remove.call(this, className);
        if (className === 'active') {
            this.style.opacity = '0';
        }
    };
    
    return modal;
}

// Export functions for global access
window.generateGallery = generateGallery;
window.generateEnhancedGallery = generateGallery; // Alias for compatibility
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.setupGameToggles = setupGameToggles;