// Initialize Navigation (called after nav.html is loaded)
function initializeNavigation() {
    // Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileBackdrop = document.getElementById('mobile-backdrop');

    function openMobileMenu() {
        if (mobileMenu) {
            mobileMenu.classList.add('active');
            if (mobileBackdrop) mobileBackdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMobileMenu() {
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
            if (mobileBackdrop) mobileBackdrop.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (mobileToggle) mobileToggle.addEventListener('click', openMobileMenu);
    if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileMenu);

    // Close mobile menu when clicking a link
    document.querySelectorAll('.mobile-menu-content a').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });
}

// Lightbox Functionality
function openLightbox(src, caption) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    // Clean up the filename for the caption
    let displayCaption = caption;
    if (!displayCaption || displayCaption.trim() === '') {
        // Extract filename from src
        const base = src.split('/').pop();
        displayCaption = base
            .replace(/-f(?=\.[^/.]+$)/, '') // Remove -f before extension
            .replace(/\.[^/.]+$/, '') // Remove extension
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
    if (lightbox && lightboxImg && lightboxCaption) {
        lightbox.style.display = 'block';
        lightboxImg.src = src;
        lightboxCaption.textContent = displayCaption;
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close lightbox on outside click
document.addEventListener('DOMContentLoaded', function() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLightbox();
            }
        });
    }
});

// Close lightbox on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Music Player Functionality (using ConsolidatedMusicPlayer class below)

// Consolidated Music Player Class
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
        // Control event listeners
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Progress bar click to seek
        this.progressBar.addEventListener('click', (e) => this.seekToPosition(e));
        
        // Audio event listeners
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.nextTrack());
        this.audio.addEventListener('play', () => this.updatePlayButton(true));
        this.audio.addEventListener('pause', () => this.updatePlayButton(false));
        
        // Track list event listeners
        this.trackList.addEventListener('click', (e) => {
            if (e.target.closest('.track-item')) {
                const trackIndex = parseInt(e.target.closest('.track-item').dataset.track);
                this.playTrack(trackIndex);
            }
        });
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    }
    
    playTrack(index) {
        this.currentTrack = index;
        this.audio.src = this.musicData[index].src;
        this.currentTitle.textContent = this.musicData[index].title;
        
        // Update active track in playlist
        this.trackList.querySelectorAll('.track-item').forEach(item => item.classList.remove('active'));
        this.trackList.querySelector(`[data-track="${index}"]`).classList.add('active');
        
        this.audio.load();
        if (this.isPlaying) {
            this.audio.play();
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
        if (this.audio.duration) {
            const rect = this.progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const clickPercent = clickX / width;
            const seekTime = clickPercent * this.audio.duration;
            this.audio.currentTime = Math.max(0, Math.min(seekTime, this.audio.duration));
        }
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = progress + '%';
            
            // Format time display
            const currentMin = Math.floor(this.audio.currentTime / 60);
            const currentSec = Math.floor(this.audio.currentTime % 60);
            const totalMin = Math.floor(this.audio.duration / 60);
            const totalSec = Math.floor(this.audio.duration % 60);
            
            this.currentTime.textContent = `${currentMin}:${String(currentSec).padStart(2, '0')}`;
            this.totalTime.textContent = `${totalMin}:${String(totalSec).padStart(2, '0')}`;
        }
    }
    
    updateDuration() {
        if (this.audio.duration) {
            const trackItem = this.trackList.querySelector(`[data-track="${this.currentTrack}"]`);
            const durationSpan = trackItem.querySelector('.track-duration');
            const min = Math.floor(this.audio.duration / 60);
            const sec = Math.floor(this.audio.duration % 60);
            durationSpan.textContent = `${min}:${String(sec).padStart(2, '0')}`;
        }
    }
    
    updatePlayButton(playing) {
        this.isPlaying = playing;
        // Toggle SVG play/pause icon
        const svg = this.playPauseBtn.querySelector('svg');
        if (!svg) return;
        const playIcon = svg.querySelector('#play-icon');
        if (playing) {
            // Show pause (two rectangles)
            if (playIcon) playIcon.setAttribute('points', '13,10 13,22 16,22 16,10 20,10 20,22 23,22 23,10');
        } else {
            // Show play (triangle)
            if (playIcon) playIcon.setAttribute('points', '13,10 13,22 23,16');
        }
    }
}

// Gallery Grid Auto-generation (for pages with galleries)
function generateGallery(containerSelector, mediaData) {
    const container = document.querySelector(containerSelector);
    if (!container || !mediaData) {
        console.log('❌ Gallery generation failed: container or data missing');
        return;
    }
    
    console.log('🎯 Generating gallery for', containerSelector, 'with', mediaData.length, 'items');
    
    container.innerHTML = '';
    
    mediaData.forEach((item, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        
        // Clean up the title
        const cleanTitle = item.title
            .replace(/-f$/, '') // Remove -f suffix
            .replace(/[-_]+/g, ' ') // Replace dashes/underscores with spaces
            .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize words
        
        // Get category from item or derive from filename/path
        let category = item.category || 'Artwork';
        if (category === 'character-design') category = 'Character Design';
        if (category === 'game-art') category = 'Game Art';
        if (category === 'illustration') category = 'Illustration';
        if (category === '3d') category = '3D Art';
        
        // Handle both images and videos
        if (item.video) {
            // Video item
            console.log(`🎬 Creating video gallery item ${index}: ${cleanTitle} (${item.video})`);
            galleryItem.className += ' video-item';
            
            // Use custom thumbnail if available, otherwise use video thumbnail
            const thumbnailSrc = item.thumbnail ? item.thumbnail : `${item.video}#t=0.5`;
            const thumbnailElement = item.thumbnail 
                ? `<img src="${item.thumbnail}" alt="${cleanTitle}" class="video-thumbnail">`
                : `<video class="video-thumbnail" preload="metadata" muted><source src="${thumbnailSrc}" type="video/mp4"></video>`;
            
            galleryItem.innerHTML = `
                <div class="video-thumb" onclick="openVideoModal('${item.video}', '${cleanTitle}')">
                    ${thumbnailElement}
                    <div class="play-overlay"></div>
                    <div class="gallery-overlay">
                        <div class="gallery-title">${cleanTitle}</div>
                        <div class="gallery-type">${category}</div>
                    </div>
                </div>
            `;
        } else {
            // Image item
            console.log(`📷 Creating image gallery item ${index}: ${cleanTitle} (${item.image})`);
            
            galleryItem.innerHTML = `
                <img src="${item.image}" alt="${cleanTitle}" loading="lazy" onclick="openLightbox('${item.image}', '${cleanTitle}')">
                <div class="gallery-overlay">
                    <div class="gallery-title">${cleanTitle}</div>
                    <div class="gallery-type">${category}</div>
                </div>
            `;
        }
        
        // Add loading animation delay for smoother appearance
        galleryItem.style.animationDelay = `${index * 0.1}s`;
        
        container.appendChild(galleryItem);
        
        // Handle loading for both images and videos
        if (item.image) {
            const img = galleryItem.querySelector('img');
            img.addEventListener('load', () => {
                img.classList.remove('loading');
                console.log(`✅ Image loaded: ${item.image}`);
            });
            
            img.addEventListener('error', () => {
                img.classList.add('error');
                console.error(`❌ Image failed to load: ${item.image}`);
            });
        }
    });
    
    console.log('🎯 Gallery generation complete');
}

// Gallery Grid Auto-generation (for pages with galleries)
function generateConsolidatedMusicPlayer(containerSelector, musicData) {
    const container = document.querySelector(containerSelector);
    if (!container || !musicData) return;
    
    let currentTrack = 0;
    
    const playerHTML = `
        <div class="music-player-unit">
            <div class="current-track">
                <div class="track-info">
                    <h3 id="current-title">${musicData[0].title}</h3>
                </div>
                <div class="player-controls">
                    <button id="prev-btn" class="audio-icon-btn" title="Previous">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="12" fill="rgba(255,45,85,0.15)"/>
                            <polygon points="15,7 15,17 8,12" fill="#fff"/>
                        </svg>
                    </button>
                    <button id="play-pause-btn" class="audio-icon-btn accent" title="Play/Pause">
                        <svg id="play-pause-svg" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="16" fill="#ff2d55"/>
                            <polygon id="play-icon" points="13,10 13,22 23,16" fill="#fff"/>
                        </svg>
                    </button>
                    <button id="next-btn" class="audio-icon-btn" title="Next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="12" fill="rgba(255,45,85,0.15)"/>
                            <polygon points="9,7 9,17 16,12" fill="#fff"/>
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
    
    // Initialize the consolidated player
    new ConsolidatedMusicPlayer(container, musicData);
}

// Video Modal Functions for Mixed Media Galleries
function openVideoModal(src, caption) {
    // Create video modal if it doesn't exist
    let modal = document.getElementById('video-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video-modal';
        modal.className = 'lightbox';
        modal.style.display = 'none';
        modal.innerHTML = `
            <span class="lightbox-close" onclick="closeVideoModal()">&times;</span>
            <div class="video-container">
                <video id="modal-video" class="modal-video" controls preload="metadata">
                    <source id="modal-video-src" src="" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <button id="fullscreen-btn" onclick="toggleVideoFullscreen()" class="fullscreen-btn" title="Fullscreen">⛶</button>
            </div>
            <div id="video-modal-caption" class="lightbox-caption"></div>
        `;
        document.body.appendChild(modal);
    }
    
    const video = document.getElementById('modal-video');
    const source = document.getElementById('modal-video-src');
    const cap = document.getElementById('video-modal-caption');
    
    source.src = src;
    video.load();
    cap.textContent = caption;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
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

function toggleVideoFullscreen() {
    const video = document.getElementById('modal-video');
    if (video) {
        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        }
    }
}

// Close video modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('video-modal');
    if (modal && e.target === modal) {
        closeVideoModal();
    }
});

// Close video modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeVideoModal();
    }
});
 
 // Expose gallery and modal functions globally for inline HTML usage
 window.generateGallery = generateGallery;
 window.openVideoModal = openVideoModal;
 window.openLightbox = openLightbox;