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
        if (!this.audio || this.audio.duration === 0) return;
        
        const rect = this.progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * this.audio.duration;
        
        this.audio.currentTime = newTime;
    }
    
    updateProgress() {
        if (!this.audio || this.audio.duration === 0) return;
        
        const percentage = (this.audio.currentTime / this.audio.duration) * 100;
        
        if (this.progressFill) {
            this.progressFill.style.width = `${percentage}%`;
        }
        
        if (this.currentTime) {
            this.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        if (!this.audio) return;
        
        if (this.totalTime) {
            this.totalTime.textContent = this.formatTime(this.audio.duration);
        }
    }
    
    updatePlayButton(playing) {
        this.isPlaying = playing;
        
        if (this.playPauseBtn) {
            const icon = this.playPauseBtn.querySelector('i');
            if (icon) {
                icon.className = playing ? 'fas fa-pause' : 'fas fa-play';
            } else {
                this.playPauseBtn.textContent = playing ? '⏸️' : '▶️';
            }
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Load new tracks dynamically
    loadTracks(newMusicData) {
        this.musicData = newMusicData;
        this.currentTrack = 0;
        
        if (this.musicData.length > 0) {
            this.playTrack(0);
        }
        
        // Rebuild track list if it exists
        this.buildTrackList();
    }
    
    buildTrackList() {
        if (!this.trackList) return;
        
        this.trackList.innerHTML = '';
        
        this.musicData.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.track = index;
            trackItem.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                </div>
            `;
            
            this.trackList.appendChild(trackItem);
        });
    }
}

// Music player generation function
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

// Export class and functions for global access
window.ConsolidatedMusicPlayer = ConsolidatedMusicPlayer;
window.generateConsolidatedMusicPlayer = generateConsolidatedMusicPlayer;