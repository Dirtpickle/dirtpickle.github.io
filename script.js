// Portfolio JavaScript - Clean Version

// Navigation
function initializeNavigation() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileBackdrop = document.getElementById('mobile-backdrop');

    function openMobileMenu() {
        if (mobileMenu && mobileBackdrop) {
            mobileMenu.classList.add('active');
            mobileBackdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMobileMenu() {
        if (mobileMenu && mobileBackdrop) {
            mobileMenu.classList.remove('active');
            mobileBackdrop.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', openMobileMenu);
    }
    
    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', closeMobileMenu);
    }

    // Close mobile menu when clicking a link
    const mobileLinks = document.querySelectorAll('.mobile-menu .nav-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
}

// Lightbox functionality
function openLightbox(src, caption) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    if (!lightbox || !lightboxImg || !lightboxCaption) {
        return;
    }

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
    
    lightbox.style.display = 'block';
    lightboxImg.src = src;
    lightboxCaption.textContent = displayCaption;
    document.body.style.overflow = 'hidden';
    
    // Disable pointer events on navigation and other content
    const nav = document.querySelector('nav');
    const mobileMenu = document.getElementById('mobile-menu');
    if (nav) nav.style.pointerEvents = 'none';
    if (mobileMenu) mobileMenu.style.pointerEvents = 'none';
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
        
        // Clean up the title
        const cleanTitle = item.title
            .replace(/-f$/, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        
        // Get category
        let category = item.category || 'Artwork';
        if (category === 'character-design') category = 'Character Design';
        if (category === 'game-art') category = 'Game Art';
        if (category === 'illustration') category = 'Illustration';
        if (category === '3d') category = '3D Art';
        
        // Get work type
        const workType = item.workType || 'Creative Work';
        
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
                    <div class="gallery-overlay">
                        <div class="gallery-title">${cleanTitle}</div>
                        <div class="gallery-type">${category}</div>
                        <div class="gallery-work-type">${workType}</div>
                    </div>
                </div>
            `;
        } else {
            galleryItem.innerHTML = `
                <img src="${item.image}" alt="${cleanTitle}" loading="lazy" onclick="openLightbox('${item.image}', '${cleanTitle}')">
                <div class="gallery-overlay">
                    <div class="gallery-title">${cleanTitle}</div>
                    <div class="gallery-type">${category}</div>
                    <div class="gallery-work-type">${workType}</div>
                </div>
            `;
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
    initializeNavigation();
    
    // Close lightbox on outside click
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLightbox();
            }
        });
    }
    
    // Close modals with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
            closeVideoModal();
        }
    });
});

// Export functions for global access
window.initializeNavigation = initializeNavigation;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.generateGallery = generateGallery;
window.generateEnhancedGallery = generateEnhancedGallery;
window.generateConsolidatedMusicPlayer = generateConsolidatedMusicPlayer;