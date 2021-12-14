import { parse, cue } from 'https://lsong.org/lyric.js/index.js';

class MiniPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.audio = new Audio();
    this.isMuted = false;
    this.previousVolume = 1;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setTrack(track) {
    this.track = track;
    this.render();
    this.playTrack();
  }

  setLyric(lyric) {
    const lrc = parse(lyric);
    const lyricElement = this.shadowRoot.querySelector('.player-lyric');
    this.updateLyric = cue(lrc.lines, line => {
      lyricElement.textContent = line.content;
    });
  }

  playTrack() {
    if (!this.track) return;
    this.audio.src = this.track.src;
    this.audio.play();
    const meta = new MediaMetadata({
      title: this.track.title,
      artist: this.track.artist,
      album: this.track.album,
      artwork: [{ type: "image/png", src: this.track.artwork }]
    });

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = meta;
      navigator.mediaSession.setActionHandler("play", () => this.audio.play());
      navigator.mediaSession.setActionHandler("pause", () => this.audio.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => this.dispatchEvent(new CustomEvent('prev')));
      navigator.mediaSession.setActionHandler("nexttrack", () => this.dispatchEvent(new CustomEvent('next')));
    }
  }

  setupEventListeners() {
    this.audio.onended = () => this.dispatchEvent(new CustomEvent('next'));
    this.audio.ontimeupdate = () => {
      this.updateLyric(this.audio.currentTime);
      this.updateProgressBar();
      this.updateTimeDisplay();
    };
    this.audio.onvolumechange = () => this.updateVolumeDisplay();
  }

  togglePlay() {
    if (this.audio.paused) {
      this.audio.play();
    } else {
      this.audio.pause();
    }
    this.render();
  }

  setVolume(e) {
    const volumeBar = this.shadowRoot.querySelector('.volume-bar');
    const rect = volumeBar.getBoundingClientRect();
    const volumeWidth = rect.width;
    const clickX = e.clientX - rect.left;
    const newVolume = clickX / volumeWidth;
    this.audio.volume = Math.max(0, Math.min(1, newVolume));
    this.updateVolumeDisplay();
  }

  toggleMute() {
    if (this.isMuted) {
      this.audio.volume = this.previousVolume;
      this.isMuted = false;
    } else {
      this.previousVolume = this.audio.volume;
      this.audio.volume = 0;
      this.isMuted = true;
    }
    this.updateVolumeDisplay();
  }

  updateProgressBar() {
    const progressBar = this.shadowRoot.querySelector('.progress-bar-filled');
    const progress = (this.audio.currentTime / this.audio.duration) * 100;
    progressBar.style.width = `${progress}%`;
  }

  updateVolumeDisplay() {
    const volumeBarFilled = this.shadowRoot.querySelector('.volume-bar-filled');
    const volumePercentage = this.shadowRoot.querySelector('.volume-percentage');
    const volumeIcon = this.shadowRoot.querySelector('.volume-icon');

    volumeBarFilled.style.width = `${this.audio.volume * 100}%`;
    volumePercentage.textContent = `${Math.round(this.audio.volume * 100)}%`;

    if (this.audio.volume === 0) {
      volumeIcon.textContent = '🔇';
    } else if (this.audio.volume < 0.5) {
      volumeIcon.textContent = '🔉';
    } else {
      volumeIcon.textContent = '🔊';
    }
  }

  updateTimeDisplay() {
    const currentTimeElement = this.shadowRoot.querySelector('.current-time');
    const durationElement = this.shadowRoot.querySelector('.duration');
    currentTimeElement.textContent = this.formatTime(this.audio.currentTime);
    durationElement.textContent = this.formatTime(this.audio.duration);
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  seekAudio(e) {
    const progressBar = this.shadowRoot.querySelector('.progress-bar');
    const clickPosition = (e.offsetX / progressBar.offsetWidth);
    this.audio.currentTime = clickPosition * this.audio.duration;
  }

  render() {
    if (!this.track) return;
    this.shadowRoot.innerHTML = `
      <style>
        .player {
          left: 0;
          bottom: 0;
          right: 0;
          margin: auto;
          position: fixed;
          padding: 10px;
          display: flex;
          z-index: 999;
          background-color: rgba(0, 0, 0, 0.85);
          color: #fff;
          gap: 10px;
        }

        .player-left {
          display: flex;
          align-items: center;
        }

        .player img {
          width: 80px;
          height: 80px;
          border-radius: 3px;
        }

        .player-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-grow: 1;
          width: 100%;
          overflow: hidden;
        }

        .player-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          overflow: hidden;
        }

        .player-title {
          margin: 0;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .player-artist {
          color: #999;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
        }

        .player-lyric {
          font-size: 14px;
          color: #1db954;
          font-style: italic;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .player-controls {
          gap: 10px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .progress-container {
          display: flex;
          align-items: center;
          flex-grow: 1;
          gap: 5px;
        }

        .progress-bar {
          flex-grow: 1;
          height: 4px;
          background-color: #444;
          cursor: pointer;
        }

        .progress-bar-filled {
          height: 100%;
          background-color: #1db954;
          width: 0;
        }

        .time {
          color: #ccc;
          font-size: 12px;
        }

        .volume-container {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .volume-icon {
          cursor: pointer;
        }

        .volume-bar {
          width: 60px;
          height: 4px;
          width: 0;
          background-color: #444;
          cursor: pointer;
          position: relative;
          transition: width 0.3s;
        }

        .volume-bar-filled {
          height: 100%;
          background-color: #1db954;
          position: absolute;
          left: 0;
        }

        .volume-percentage {
          color: #ccc;
          font-size: 12px;
          display: none;
        }

        .volume-container:hover .volume-bar {
          width: 60px;
        }
        .volume-container:hover .volume-percentage {
          display: block;
        }

        .player-prev,
        .player-play,
        .player-next {
          color: white;
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
      </style>
      <div class="player">
        <div class="player-left">
          <img src="${this.track.artwork}" />
        </div>
        <div class="player-right">
          <div class="player-main" >
            <div class="player-info">
              <h4 class="player-title">${this.track.title}</h4>
              <div class="player-artist">${this.track.artist} - ${this.track.album}</div>
            </div>
            <div class="player-controls">
              <div class="player-prev">⏮</div>
              <div class="player-play">${this.audio.paused ? "▶️" : "⏸"}</div>
              <div class="player-next">⏭</div>
              <div class="volume-container">
                <div class="volume-icon">🔊</div>
                <div class="volume-bar">
                  <div class="volume-bar-filled"></div>
                </div>
                <span class="volume-percentage">100%</span>
              </div>
            </div>
          </div>
          <div class="progress-container">
            <span class="time current-time">0:00</span>
            <div class="progress-bar">
              <div class="progress-bar-filled"></div>
            </div>
            <span class="time duration">0:00</span>
          </div>
          <div class="player-lyric"></div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.player-prev').addEventListener('click', () => this.dispatchEvent(new CustomEvent('prev')));
    this.shadowRoot.querySelector('.player-next').addEventListener('click', () => this.dispatchEvent(new CustomEvent('next')));
    this.shadowRoot.querySelector('.player-play').addEventListener('click', () => this.togglePlay());
    this.shadowRoot.querySelector('.volume-bar').addEventListener('click', (e) => this.setVolume(e));
    this.shadowRoot.querySelector('.volume-icon').addEventListener('click', () => this.toggleMute());
    this.shadowRoot.querySelector('.progress-bar').addEventListener('click', (e) => this.seekAudio(e));

    this.updateVolumeDisplay();
    this.updateTimeDisplay();
  }
}

customElements.define('mini-player', MiniPlayer);