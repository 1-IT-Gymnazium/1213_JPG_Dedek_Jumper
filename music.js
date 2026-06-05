// Shared music player — injected on every page, state persists via sessionStorage
(function () {
  var TRACKS = [
    { src: 'assets/music/track1.mp3', title: 'Skákavý Ležák' },
    { src: 'assets/music/track2.mp3', title: 'Děda a ležák' },
  ];
  var KEY = 'oldFartJumper_music';

  function loadState() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        idx:  idx,
        time: isFinite(audio.currentTime) ? audio.currentTime : 0,
        vol:  audio.volume
      }));
    } catch (e) {}
  }

  var audio   = new Audio();
  var idx     = 0;
  var playing = false;

  // ── Inject widget HTML ───────────────────────────────────────
  var widget = document.createElement('div');
  widget.id        = 'musicPlayer';
  widget.className = 'music-player';
  widget.innerHTML =
    '<div class="mp-track-info">' +
      '<div class="mp-title" id="mpTitle"></div>' +
      '<div class="mp-sub">Dědek Jumper • OST</div>' +
    '</div>' +
    '<div class="mp-controls">' +
      '<button class="mp-btn" id="mpPrevBtn" title="Předchozí">&#9198;</button>' +
      '<button class="mp-btn mp-playbtn" id="mpPlay">&#9654;</button>' +
      '<button class="mp-btn" id="mpNextBtn" title="Další">&#9197;</button>' +
    '</div>' +
    '<div class="mp-progress-row">' +
      '<span class="mp-time" id="mpCur">0:00</span>' +
      '<input type="range" id="mpBar" class="mp-slider" value="0" min="0" max="100" step="0.01">' +
      '<span class="mp-time" id="mpDur">0:00</span>' +
    '</div>' +
    '<div class="mp-vol-row">' +
      '<span class="mp-vol-icon">&#9834;</span>' +
      '<input type="range" id="mpVol" class="mp-slider" value="70" min="0" max="100">' +
    '</div>';
  document.body.appendChild(widget);

  var elTitle = document.getElementById('mpTitle');
  var elPlay  = document.getElementById('mpPlay');
  var elBar   = document.getElementById('mpBar');
  var elCur   = document.getElementById('mpCur');
  var elDur   = document.getElementById('mpDur');
  var elVol   = document.getElementById('mpVol');

  // ── Helpers ──────────────────────────────────────────────────
  function fmt(s) {
    if (!s || !isFinite(s)) return '0:00';
    return Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2);
  }

  function fill(el, pct, col) {
    el.style.background =
      'linear-gradient(to right,' + col + ' ' + pct + '%,#241408 ' + pct + '%)';
  }

  function syncUI() {
    elTitle.textContent = TRACKS[idx].title;
    elPlay.textContent  = playing ? '⏸' : '▶';
    elPlay.classList.toggle('is-playing', playing);
    var vpct = Math.round(audio.volume * 100);
    elVol.value = vpct;
    fill(elVol, vpct, '#8b5a2e');
  }

  // ── Load & play track ────────────────────────────────────────
  function load(newIdx, autoplay, startTime) {
    idx = ((newIdx % TRACKS.length) + TRACKS.length) % TRACKS.length;
    audio.src = TRACKS[idx].src;
    audio.load();
    elBar.value = 0;
    fill(elBar, 0, '#c48a2e');
    elCur.textContent = '0:00';
    elDur.textContent = '0:00';
    playing = false;
    syncUI();

    if (autoplay || startTime) {
      audio.addEventListener('canplay', function handler() {
        audio.removeEventListener('canplay', handler);
        if (startTime) {
          try { audio.currentTime = startTime; } catch (e) {}
        }
        audio.play().then(function () {
          playing = true; syncUI();
        }).catch(function () {
          playing = false; syncUI();
        });
      });
    }
  }

  function toggle() {
    if (playing) { audio.pause(); playing = false; }
    else { audio.play().catch(function () {}); playing = true; }
    syncUI();
    saveState();
  }

  // ── Listeners ────────────────────────────────────────────────
  document.getElementById('mpPrevBtn').addEventListener('click', function () {
    load(idx - 1, playing);
  });
  document.getElementById('mpNextBtn').addEventListener('click', function () {
    load(idx + 1, playing);
  });
  elPlay.addEventListener('click', toggle);

  elBar.addEventListener('input', function (e) {
    audio.currentTime = parseFloat(e.target.value);
  });

  elVol.addEventListener('input', function (e) {
    audio.volume = e.target.value / 100;
    fill(elVol, e.target.value, '#8b5a2e');
    saveState();
  });

  // ── Audio events ─────────────────────────────────────────────
  audio.addEventListener('timeupdate', function () {
    if (!audio.duration) return;
    var pct = (audio.currentTime / audio.duration) * 100;
    elBar.max   = audio.duration;
    elBar.value = audio.currentTime;
    fill(elBar, pct, '#c48a2e');
    elCur.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener('durationchange', function () {
    elDur.textContent = fmt(audio.duration);
    elBar.max = audio.duration;
  });

  audio.addEventListener('ended', function () { load(idx + 1, true); });

  // ── Restore state & start ────────────────────────────────────
  var state = loadState();
  idx = state.idx || 0;
  if (idx >= TRACKS.length) idx = 0;
  audio.volume = typeof state.vol === 'number' ? state.vol : 0.7;

  load(idx, true, state.time || 0);

  // Fallback: if autoplay was blocked, start on first user click
  document.addEventListener('click', function startOnClick() {
    if (!playing) {
      audio.play().then(function () {
        playing = true; syncUI();
      }).catch(function () {});
    }
    document.removeEventListener('click', startOnClick);
  });

  window.addEventListener('beforeunload', saveState);
  setInterval(saveState, 3000);

  // ── Public API (for settings panel) ─────────────────────────
  window.musicPlayer = {
    setVolume: function (v) {
      audio.volume = Math.max(0, Math.min(1, v));
      var pct = Math.round(audio.volume * 100);
      elVol.value = pct;
      fill(elVol, pct, '#8b5a2e');
    },
    getVolume: function () {
      return audio.volume;
    }
  };
}());
