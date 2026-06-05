const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1400;
canvas.height = 700;

const deathScreen = document.getElementById("deathScreen");
const levelEl = document.getElementById("level") || {innerText: ''};
const coinsEl = document.getElementById("coins") || {innerText: ''};
const activeItemsEl = document.getElementById("activeItems") || {innerText: ''};
const timerEl = document.getElementById("timer") || {innerText: ''};
let gameTime = 0;

// TEXTURY - PŘIDÁNO
const dedekImg = new Image();
dedekImg.src = 'assets/player/Dedek.png';

// ANIMACE - idle frames
const idleFrames = [];
for (let i = 1; i <= 7; i++) {
  const img = new Image();
  img.src = `assets/player/idle${i}.png`;
  idleFrames.push(img);
}
// ANIMACE - walk frames
const walkFrames = [];
for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `assets/player/walk${i}.png`;
  walkFrames.push(img);
}
// ANIMACE - jump frames (s automatickým centrováním)
const jumpFrames = [];
const jumpOffsets = []; // {cx, cy} center of content relative to image center
function calcContentCenter(img, index, offsetArray) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const cx = c.getContext('2d');
  cx.drawImage(img, 0, 0);
  const data = cx.getContext ? cx.getImageData(0, 0, c.width, c.height).data : null;
  if (!data) { offsetArray[index] = { ox: 0, oy: 0 }; return; }
  let minX = c.width, maxX = 0, minY = c.height, maxY = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const contentCX = (minX + maxX) / 2;
  const contentCY = (minY + maxY) / 2;
  offsetArray[index] = {
    ox: (contentCX - c.width / 2) / c.width,
    oy: (contentCY - c.height / 2) / c.height
  };
}
for (let i = 1; i <= 7; i++) {
  const img = new Image();
  const idx = i - 1;
  img.src = `assets/player/jump${i}.png`;
  img.onload = () => calcContentCenter(img, idx, jumpOffsets);
  jumpFrames.push(img);
}
// ANIMACE - dash frames
const dashFrames = [];
for (let i = 1; i <= 4; i++) {
  const img = new Image();
  img.src = `assets/player/dash${i}.png`;
  dashFrames.push(img);
}
let animState = 'idle';
let prevAnimState = 'idle';
let animFrame = 0;
let animTimer = 0;
const IDLE_FPS = 8;
const WALK_FPS = 18;
const DASH_FPS = 14;
const JUMP_FPS = 10;
const skikesImg = new Image();
skikesImg.src = 'assets/ui/skikes.png';
const beerCoinImg = new Image();
beerCoinImg.src = 'assets/ui/beer_coin.png';
const grassImg = new Image();
grassImg.src = 'assets/tiles/grass.png';
const dirtImg = new Image();
dirtImg.src = 'assets/tiles/dirt.png';
const stonePlatformImg = new Image();
stonePlatformImg.src = 'assets/tiles/stonePlatform.png';
const tavernImg = new Image();
tavernImg.src = 'assets/tavern/tavern.png';
const tavernOpenFrames = ['assets/tavern/tavern_open1.png', 'assets/tavern/tavern_open2.png', 'assets/tavern/tavern_open3.png'].map(src => {
  const img = new Image(); img.src = src; return img;
});

// ITEM ICONS
const iconShield = new Image(); iconShield.src = 'assets/icons/icon_shield.png';
const iconDash = new Image(); iconDash.src = 'assets/icons/icon_dash.png';
const iconDoubleJump = new Image(); iconDoubleJump.src = 'assets/icons/icon_doublejump.png';
const iconSpeed = new Image(); iconSpeed.src = 'assets/icons/icon_speed.png';
const iconMagnet = new Image(); iconMagnet.src = 'assets/icons/icon_magnet.png';

// BACKGROUNDS
const bgImages = [];
const bgSources = ['assets/backgrounds/bg1.png', 'assets/backgrounds/backGround1.png'];
bgSources.forEach(src => {
  const img = new Image();
  img.src = src;
  bgImages.push(img);
});

// Separate parallax layers for bg index 1
const bgLayerSky       = new Image(); bgLayerSky.src       = 'assets/bg/mraky.png';
const bgLayerMountains = new Image(); bgLayerMountains.src = 'assets/bg/hory.png';
const bgLayerTrees     = new Image(); bgLayerTrees.src     = 'assets/bg/stromy.png';

// Seamless sky: blend right edge into left edge so tiling has no visible seam
let bgLayerSkySeamless = null;
function _buildSkySeamless() {
  const img = bgLayerSky;
  if (!img.naturalWidth) return;
  const blendW = 160; // px in source coords to cross-fade
  const oc = document.createElement('canvas');
  oc.width = img.naturalWidth; oc.height = img.naturalHeight;
  const ox = oc.getContext('2d');
  ox.drawImage(img, 0, 0);
  // Build a blended strip: left edge of img faded from transparent→opaque
  const tmp = document.createElement('canvas');
  tmp.width = blendW; tmp.height = img.naturalHeight;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, 0, 0, blendW, img.naturalHeight, 0, 0, blendW, img.naturalHeight);
  tc.globalCompositeOperation = 'destination-in';
  const g = tc.createLinearGradient(0, 0, blendW, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  tc.fillStyle = g; tc.fillRect(0, 0, blendW, img.naturalHeight);
  // Composite the faded strip onto the right edge of the full image
  ox.drawImage(tmp, img.naturalWidth - blendW, 0);
  bgLayerSkySeamless = oc;
}
bgLayerSky.onload = _buildSkySeamless;
if (bgLayerSky.complete && bgLayerSky.naturalWidth) _buildSkySeamless();

// SAVE/LOAD (sessionStorage — ukládá se mezi levely, resetuje po zavření prohlížeče)
function getSave() {
  try {
    return JSON.parse(sessionStorage.getItem('oldFartJumper_save')) || { coins: 0, items: [] };
  } catch(e) {
    return { coins: 0, items: [] };
  }
}
function setSave(data) {
  sessionStorage.setItem('oldFartJumper_save', JSON.stringify(data));
}

// SHOP ITEMS CATALOG
const SHOP_ITEMS = [
  { id: 'doubleJump', name: 'Double Jump', description: 'Skok ve vzduchu', price: 50, type: 'permanent' },
  { id: 'shield', name: 'Shield', description: 'Prezije 1 naraz do spiku', price: 20, type: 'consumable' },
  { id: 'speedBoost', name: 'Speed Boost', description: 'Rychlejsi pohyb o 30%', price: 40, type: 'permanent' },
  { id: 'dash', name: 'Dash', description: '1 dash za skok', price: 30, type: 'permanent' },
  { id: 'magnet', name: 'Magnet', description: 'Pritahuje mince', price: 80, type: 'permanent' }
];

// LEVEL Z URL
const params = new URLSearchParams(window.location.search);
let level = parseInt(params.get("level")) || 0;
const isTryMode = params.get("mode") === 'try';
let walkTimer = 0;
let jumpPressed = false;
let dashPressed = false;

// ZVUKY
const sounds = {
  hit: new Audio('hit.wav'),
  win: new Audio('win.wav'), 
  jump: new Audio('jump.wav'),
  walk: new Audio('walk.wav'),
  coin: new Audio('coin.wav'),
  dash: new Audio('dash.wav'),
  music1: new Audio('music1.mp3')
};
sounds.music1.loop = true;
sounds.music1.volume = 0.7;
sounds.coin.volume = 0.3;

// SETTINGS
const DEFAULT_SETTINGS = { sfxVol: 1, musicVol: 0.7, masterVol: 1, brightness: 100 };
function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('oldFartJumper_settings')) }; }
  catch(e) { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) { localStorage.setItem('oldFartJumper_settings', JSON.stringify(s)); }
function applySettings(s) {
  const master = s.masterVol;
  sounds.music1.volume = s.musicVol * master;
  const sfxV = s.sfxVol * master;
  sounds.hit.volume = sfxV;
  sounds.win.volume = sfxV;
  sounds.jump.volume = sfxV;
  sounds.walk.volume = sfxV * 0.8;
  sounds.coin.volume = sfxV * 0.3;
  sounds.dash.volume = sfxV;
  const bo = document.getElementById('brightnessOverlay');
  if (bo) bo.style.opacity = (100 - s.brightness) / 100 * 0.85;
}
let currentSettings = loadSettings();
applySettings(currentSettings);

// PAUSE MENU
let isMenuOpen = false;
function openPauseMenu() {
  isMenuOpen = true;
  gamePaused = true;
  for (const k in keys) keys[k] = false;
  document.getElementById('pauseOverlay').classList.add('active');
  showMainPause();
}
function closePauseMenu() {
  isMenuOpen = false;
  document.getElementById('pauseOverlay').classList.remove('active');
  lastTime = 0;
  setTimeout(() => { if (!isMenuOpen) gamePaused = false; }, 100);
}
function showMainPause() {
  document.getElementById('mainPauseContent').classList.remove('hidden');
  document.getElementById('settingsPanel').classList.remove('active');
}
function showSettingsPanel() {
  document.getElementById('mainPauseContent').classList.add('hidden');
  document.getElementById('settingsPanel').classList.add('active');
}

document.getElementById('menuBtn').addEventListener('click', openPauseMenu);
document.getElementById('resumeBtn').addEventListener('click', closePauseMenu);
document.getElementById('goMenuBtn').addEventListener('click', () => {
  location.href = _isTry ? 'editor.html' : 'index.html';
});
document.getElementById('settingsBtn').addEventListener('click', showSettingsPanel);
document.getElementById('backBtn').addEventListener('click', showMainPause);

// Fullscreen toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}
function updateFsBtn() {
  const btn = document.getElementById('fullscreenBtn');
  if (btn) btn.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
}
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFsBtn);
document.addEventListener('webkitfullscreenchange', updateFsBtn);

// Slider sync
const _sMusic = document.getElementById('musicVolSlider');
const _sSfx = document.getElementById('sfxVolSlider');
const _sMaster = document.getElementById('masterVolSlider');
const _sBright = document.getElementById('brightnessSlider');
const _vMusic = document.getElementById('musicVolVal');
const _vSfx = document.getElementById('sfxVolVal');
const _vMaster = document.getElementById('masterVolVal');
const _vBright = document.getElementById('brightnessVal');

function pct(v, max) { return Math.round(v / max * 100) + '%'; }
function syncSliderDisplays() {
  _vMusic.textContent = pct(_sMusic.value, 1);
  _vSfx.textContent = pct(_sSfx.value, 1);
  _vMaster.textContent = pct(_sMaster.value, 1);
  _vBright.textContent = Math.round(_sBright.value) + '%';
}
_sMusic.value = currentSettings.musicVol;
_sSfx.value = currentSettings.sfxVol;
_sMaster.value = currentSettings.masterVol;
_sBright.value = currentSettings.brightness;
syncSliderDisplays();

function onSettingChange() {
  currentSettings.musicVol = parseFloat(_sMusic.value);
  currentSettings.sfxVol = parseFloat(_sSfx.value);
  currentSettings.masterVol = parseFloat(_sMaster.value);
  currentSettings.brightness = parseFloat(_sBright.value);
  saveSettings(currentSettings);
  applySettings(currentSettings);
  syncSliderDisplays();
}
[_sMusic, _sSfx, _sMaster, _sBright].forEach(s => s.addEventListener('input', onSettingChange));

// Escape toggles pause
document.addEventListener('keydown', e => {
  if (e.code !== 'Escape') return;
  if (isMenuOpen) {
    if (document.getElementById('settingsPanel').classList.contains('active')) showMainPause();
    else closePauseMenu();
  } else if (!deathScreen.classList.contains('active')) {
    openPauseMenu();
  }
});

// PLAYER
let player = {
  x: 100, y: 500,
  width: 60, height: 60,
  dx: 0, dy: 0,
  speed: 7,
  gravity: 0.9,
  jump: -20,
  grounded: false,
  facing: 1,
  dashSpeed: 18,
  dashesLeft: 1,
  dashing: 0,
  baseSpeed: 7,
  hasDoubleJump: false,
  hasShield: false,
  hasSpeedBoost: false,
  hasDash: false,
  hasMagnet: false,
  canDoubleJump: false,
  lastDashEnd: 99
};

// LEVELY (stejné)
const levels = [...BUILT_IN_LEVELS];

// Load custom levels from localStorage
try {
  const customLevels = JSON.parse(localStorage.getItem('oldFartJumper_customLevels')) || [];
  customLevels.forEach(cl => levels.push(cl));
} catch(e) {}

let platforms, spikes, winZone, grounds, dirts, invisibles;
let currentLevelLength = 2000;
let hasCustomTerrain = false;
let nearTavern = false;
let tavernHintOpacity = 0;
let sessionDeaths = 0;
let winAnimFrame = 0;
let winAnimTime = 0;
let currentBg = null;
let currentBgIndex = null;
let lastTime = 0;
let cameraX = 0;
let levelCoins = [];
let tempCoins = 0;
let coinParticles = [];
let savedCoins = getSave().coins;
let winning = false;

function loadLevel() {
  let lvl;
  if (isTryMode) {
    try {
      lvl = JSON.parse(localStorage.getItem('oldFartJumper_tryLevel'));
    } catch(e) {}
    if (!lvl) { location.href = 'editor.html'; return; }
  } else {
    lvl = levels[level];
  }
  currentLevelLength = lvl.length || 2000;
  platforms = lvl.platforms;
  grounds = lvl.grounds || [];
  dirts = lvl.dirts || [];
  invisibles = lvl.invisibles || [];
  hasCustomTerrain = grounds.length > 0 || dirts.length > 0;
  currentBgIndex = lvl.bg !== undefined ? lvl.bg : null;
  currentBg = (currentBgIndex !== null && bgImages[currentBgIndex]) ? bgImages[currentBgIndex] : null;
  spikes = lvl.spikes;
  winZone = lvl.winZone;
  levelCoins = (lvl.coins || []).map(c => ({ ...c, collected: false }));
  levelEl.innerText = isTryMode ? "Try" : "Lv " + (level + 1);
  player.x = lvl.spawn ? lvl.spawn.x : 100;
  player.y = lvl.spawn ? lvl.spawn.y : 400; 
  player.dx = 0; 
  player.dy = 0; 
  player.dashesLeft = player.hasDash ? 1 : 0;
  player.dashing = 0;
  walkTimer = 0;
  tempCoins = 0;
  coinParticles = [];
  winning = false;
  winAnimFrame = 0;
  winAnimTime = 0;
  gameTime = 0;
  timerEl.innerText = '0:00';
  const save = getSave();
  savedCoins = save.coins;
  coinsEl.innerText = savedCoins;

  // Apply owned item effects
  player.hasDoubleJump = save.items.includes('doubleJump');
  player.hasShield = save.items.filter(i => i === 'shield').length > 0;
  player.hasSpeedBoost = save.items.includes('speedBoost');
  player.hasDash = save.items.includes('dash');
  player.hasMagnet = save.items.includes('magnet');
  player.canDoubleJump = false;

  player.speed = player.baseSpeed;

  // Show active items in HUD
  const active = [];
  if (player.hasDoubleJump) active.push('2xJump');
  if (player.hasShield) active.push('Shield');
  if (player.hasSpeedBoost) active.push('Speed');
  if (player.hasDash) active.push('Dash');
  if (player.hasMagnet) active.push('Magnet');
  activeItemsEl.innerText = active.length ? active.join(' | ') : '';
}

// CONTROLS
const keys = {};
let gamePaused = false;
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// Pause when window loses focus — reset all keys
window.addEventListener("blur", () => {
  gamePaused = true;
  for (const k in keys) keys[k] = false;
});
window.addEventListener("focus", () => {
  gamePaused = true;
  lastTime = 0;
  setTimeout(() => { gamePaused = false; }, 100);
});

// DEATH SCREEN
function showDeathScreen() {
  sessionDeaths++;
  const mins = Math.floor(gameTime / 60);
  const secs = Math.floor(gameTime % 60);
  document.getElementById('deathLevel').textContent = isTryMode ? 'Try Mode' : 'Level ' + (level + 1);
  document.getElementById('deathTime').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  document.getElementById('deathCoins').innerHTML =
    `<img src="assets/ui/beer_coin.png" style="width:14px;height:14px;image-rendering:pixelated;vertical-align:middle;margin-right:4px;">${tempCoins}`;
  document.getElementById('deathTotal').textContent = sessionDeaths + 'x';
  deathScreen.classList.add('active');
}

document.getElementById('deathRetryBtn').addEventListener('click', resetGame);
document.getElementById('deathHomeBtn').addEventListener('click', () => {
  location.href = isTryMode ? 'editor.html' : 'index.html';
});

// RESET
function resetGame() {
  deathScreen.classList.remove("active");
  loadLevel();
}

// UPDATE
function update(delta) {
  // Track time since last dash ended
  if (player.lastDashEnd !== undefined) player.lastDashEnd += delta * 60;

  // Input (dash overrides normal movement while active)
  if (player.dashing > 0) {
    player.dashing -= delta * 60;
    // During dash: constant horizontal speed, no vertical movement
    player.dx = player.facing * player.dashSpeed;
    player.dy = 0;
  } else {
    const sprinting = player.hasSpeedBoost && keys["ShiftLeft"];
    const maxSpeed = player.speed * (sprinting ? 1.6 : 1);
    const accel = (sprinting ? 2.2 : 1.5) * delta * 60;
    const decel = 2.5 * delta * 60;
    if (keys["KeyD"]) {
      player.dx = Math.min(player.dx + accel, maxSpeed);
      player.facing = 1;
    } else if (keys["KeyA"]) {
      player.dx = Math.max(player.dx - accel, -maxSpeed);
      player.facing = -1;
    } else {
      if (player.dx > 0) {
        player.dx = Math.max(0, player.dx - decel);
      } else if (player.dx < 0) {
        player.dx = Math.min(0, player.dx + decel);
      }
    }
  }

  // Detekce blízkosti hospůdky — blokuje skok, umožní vstup
  nearTavern = !winning &&
      player.x + player.width > winZone.x - 20 &&
      player.x < winZone.x + winZone.width + 20 &&
      player.grounded;

  // Fade in/out hint opacity
  tavernHintOpacity = nearTavern
    ? Math.min(1, tavernHintOpacity + delta * 3.5)
    : Math.max(0, tavernHintOpacity - delta * 5);

  // Jump + ZVUK + Double Jump (zablokováno u hospůdky)
  if (keys["Space"] && !jumpPressed && !nearTavern) {
    jumpPressed = true;
    // Cancel dash with jump — remaining dash power boosts the jump
    const dashBoost = player.dashing > 0 ? player.dashing / 15 : (player.lastDashEnd < 5 ? 0.3 : 0);
    if (player.dashing > 0) {
      player.dashing = 0;
      player.lastDashEnd = 0;
    }
    if (player.grounded) {
      player.dy = player.jump * (1 + dashBoost * 0.25);
      sounds.jump.currentTime = 0;
      sounds.jump.play().catch(() => {});
      player.grounded = false;
      player.canDoubleJump = player.hasDoubleJump;
    } else if (player.canDoubleJump) {
      player.dy = player.jump * (1 + dashBoost * 0.25);
      sounds.jump.currentTime = 0;
      sounds.jump.play().catch(() => {});
      player.canDoubleJump = false;
      // Recharge dash on double jump
      player.dashesLeft = player.hasDash ? 1 : 0;
    }
  }
  if (!keys["Space"]) {
    jumpPressed = false;
  }

  // Dash — must press (not hold), goes straight (no gravity during dash)
  if (keys["KeyW"] && !dashPressed && player.hasDash && player.dashesLeft > 0 && player.dashing <= 0) {
    dashPressed = true;
    player.dashing = 15;
    player.dashesLeft--;
    sounds.dash.currentTime = 0;
    sounds.dash.play().catch(() => {});
  }
  if (!keys["KeyW"]) {
    dashPressed = false;
  }

  // Physics (no gravity during dash)
  if (player.dashing <= 0) {
    player.dy += player.gravity * delta * 60;
  }
  player.x += player.dx * delta * 60;
  player.y += player.dy * delta * 60;

  // Left boundary
  if (player.x < 0) player.x = 0;

  // Invisible wall collision (solid from all sides)
  for (let w of invisibles) {
    if (player.x + player.width > w.x &&
        player.x < w.x + w.width &&
        player.y + player.height > w.y &&
        player.y < w.y + w.height) {
      // Calculate overlap from each side
      const overlapLeft = (player.x + player.width) - w.x;
      const overlapRight = (w.x + w.width) - player.x;
      const overlapTop = (player.y + player.height) - w.y;
      const overlapBottom = (w.y + w.height) - player.y;
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

      if (minOverlap === overlapLeft) {
        player.x = w.x - player.width;
        player.dx = 0;
      } else if (minOverlap === overlapRight) {
        player.x = w.x + w.width;
        player.dx = 0;
      } else if (minOverlap === overlapTop) {
        player.y = w.y - player.height;
        player.dy = 0;
        player.grounded = true;
        player.dashesLeft = player.hasDash ? 1 : 0;
      } else {
        player.y = w.y + w.height;
        player.dy = 0;
      }
    }
  }

  // Fall death
  if (player.y > canvas.height + 100) {
    sounds.hit.currentTime = 0;
    sounds.hit.play().catch(() => {});
    showDeathScreen();
    return;
  }

  // Platform collision
  player.grounded = false;
  for (let p of platforms) {
    // Legacy levels (no custom terrain) use +45 offset for big grass platforms;
    // editor levels always use p.y so resized stone platforms work correctly
    const collisionY = (!hasCustomTerrain && p.height >= 100) ? p.y + 45 : p.y;
    if (player.x + 5 < p.x + p.width - 5 &&
        player.x + player.width - 5 > p.x + 5 &&
        player.y + player.height >= collisionY &&
        player.y + player.height <= collisionY + Math.max(p.height, Math.abs(player.dy * delta * 60) + 2) &&
        player.dy >= 0) {
      player.y = collisionY - player.height;
      player.dy = 0;
      player.grounded = true;
      player.dashesLeft = player.hasDash ? 1 : 0;
      break;
    }
  }

  // Spikes + HIT ZVUK + Shield
  for (let s of spikes) {
    if (player.x < s.x + s.width &&
        player.x + player.width > s.x &&
        player.y < s.y + s.height &&
        player.y + player.height > s.y) {
      if (player.hasShield) {
        // Consume shield
        player.hasShield = false;
        const save = getSave();
        const idx = save.items.indexOf('shield');
        if (idx !== -1) save.items.splice(idx, 1);
        setSave(save);
        // Bounce player up and away from spike
        player.dy = -15;
        player.y = s.y - player.height - 5;
        sounds.hit.currentTime = 0;
        sounds.hit.play().catch(() => {});
        break;
      }
      sounds.hit.currentTime = 0;
      sounds.hit.play().catch(() => {});
      showDeathScreen();
      return;
    }
  }

  // MAGNET - attract nearby coins
  if (player.hasMagnet) {
    const magnetRadius = 150;
    for (let c of levelCoins) {
      if (c.collected) continue;
      const dx = (player.x + player.width / 2) - (c.x + c.width / 2);
      const dy = (player.y + player.height / 2) - (c.y + c.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < magnetRadius && dist > 0) {
        const speed = 4 * delta * 60;
        c.x += (dx / dist) * speed;
        c.y += (dy / dist) * speed;
      }
    }
  }

  // COIN COLLECTION
  for (let c of levelCoins) {
    if (c.collected) continue;
    if (player.x < c.x + c.width &&
        player.x + player.width > c.x &&
        player.y < c.y + c.height &&
        player.y + player.height > c.y) {
      c.collected = true;
      tempCoins++;
      coinsEl.innerText = savedCoins + tempCoins;
      sounds.coin.currentTime = 0;
      sounds.coin.play().catch(() => {});
      // Spawn particles
      const cx = c.x + c.width / 2;
      const cy = c.y + c.height / 2;
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        coinParticles.push({
          x: cx, y: cy,
          dx: Math.cos(angle) * speed,
          dy: Math.sin(angle) * speed - 1.5,
          life: 1.0,
          size: 2 + Math.random() * 4,
          color: Math.random() > 0.5 ? '#f5a623' : '#ffd700'
        });
      }
    }
  }

  // WALK ZVUK LOOP
  if (player.grounded && (keys["KeyD"] || keys["KeyA"])) {
    walkTimer += delta * 60;
    if (walkTimer > 20) {
      sounds.walk.currentTime = 0;
      sounds.walk.play().catch(() => {});
      walkTimer = 0;
    }
  } else {
    walkTimer = 0;
    sounds.walk.pause();
  }

  // TIMER
  gameTime += delta;
  const mins = Math.floor(gameTime / 60);
  const secs = Math.floor(gameTime % 60);
  timerEl.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;

  // CAMERA - follow player
  cameraX = player.x - canvas.width / 3;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > currentLevelLength - canvas.width) cameraX = currentLevelLength - canvas.width;

  // ANIMACE - urceni stavu
  prevAnimState = animState;
  if (player.dashing > 0) {
    animState = 'dash';
  } else if (!player.grounded) {
    animState = 'jump';
  } else if (Math.abs(player.dx) > 0.5) {
    animState = 'walk';
  } else {
    animState = 'idle';
  }

  // Reset frame when animation state changes
  if (animState !== prevAnimState) {
    animFrame = 0;
    animTimer = 0;
  }

  // Posun snimku animace
  if (animState === 'idle' || animState === 'walk' || animState === 'dash' || animState === 'jump') {
    const fps = animState === 'walk' ? WALK_FPS : animState === 'dash' ? DASH_FPS : animState === 'jump' ? JUMP_FPS : IDLE_FPS;
    const frameCount = animState === 'walk' ? walkFrames.length : animState === 'dash' ? dashFrames.length : animState === 'jump' ? jumpFrames.length : idleFrames.length;
    animTimer += delta;
    if (animTimer >= 1 / fps) {
      animTimer = 0;
      if (animState === 'jump') {
        // Jump animation plays once, holds last frame
        if (animFrame < frameCount - 1) animFrame++;
      } else {
        animFrame = (animFrame + 1) % frameCount;
      }
    }
  } else {
    animFrame = 0;
    animTimer = 0;
  }

  // WIN — hráč musí stát u dveří hospůdky a zmáčknout Space
  if (nearTavern && keys["Space"] && !jumpPressed) {
    winning = true;
    // Save collected coins
    if (tempCoins > 0) {
      const save = getSave();
      save.coins += tempCoins;
      setSave(save);
      tempCoins = 0;
    }
    // Stop player movement
    player.dx = 0;
    player.dy = 0;
    sounds.win.currentTime = 0;
    sounds.win.play().catch(() => {});
    sounds.win.addEventListener('ended', function goNext() {
      sounds.win.removeEventListener('ended', goNext);
      if (isTryMode) {
        location.href = 'editor.html';
      } else {
        level++;
        if (level >= levels.length) {
          location.href = "index.html";
        } else {
          location.href = `game.html?level=${level}`;
        }
      }
    });
  }
}

// DRAW - ZMĚNĚNO NA TEXTURY
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background — 3-layer parallax using separate PNG files
  if (currentBgIndex === 1) {
    const cH = canvas.height;
    const cW = canvas.width;
    const drawLayer = (img, rate, src) => {
      src = src || img;
      const isCanvas = src instanceof HTMLCanvasElement;
      if (!isCanvas && (!src.complete || !src.naturalWidth)) return;
      const iW = isCanvas ? src.width : src.naturalWidth;
      const iH = isCanvas ? src.height : src.naturalHeight;
      const scaledW = Math.round(iW * (cH / iH));
      const scroll  = Math.round((cameraX * rate) % scaledW);
      for (let bx = -scroll; bx < cW + scaledW; bx += scaledW) {
        ctx.drawImage(src, Math.round(bx), 0, scaledW, cH);
      }
    };
    drawLayer(bgLayerSky,       0.04, bgLayerSkySeamless); // mraky — seamless, nejpomalejší
    drawLayer(bgLayerMountains, 0.17);                     // hory  — průhledný vršek, střední
    drawLayer(bgLayerTrees,     0.42);                     // stromy — nejrychlejší
  } else if (currentBg && currentBg.complete && currentBg.naturalWidth > 0) {
    ctx.drawImage(currentBg, 0, 0, canvas.width, canvas.height);
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Platformy
  const groundSet = new Set(grounds.map(g => `${g.x},${g.y},${g.width},${g.height}`));
  const dirtSet = new Set(dirts.map(d => `${d.x},${d.y},${d.width},${d.height}`));
  platforms.forEach(p => {
    const key = `${p.x},${p.y},${p.width},${p.height}`;
    if (groundSet.has(key) || dirtSet.has(key)) return;
    if (!hasCustomTerrain && p.height >= 100 && grassImg.complete && grassImg.naturalWidth > 0) {
      // Legacy levels: render big platforms with grass+dirt textures
      const grassDrawY = p.y + 30;
      const grassH = 120;
      const tileW = grassH * (grassImg.naturalWidth / grassImg.naturalHeight);
      // Dirt fill
      if (dirtImg.complete && dirtImg.naturalWidth > 0) {
        const dirtStartY = grassDrawY + grassH * 0.4;
        const dirtFillH = canvas.height - dirtStartY;
        const dirtDrawH = grassH;
        const dirtDrawW = dirtDrawH * (dirtImg.naturalWidth / dirtImg.naturalHeight);
        for (let ty = 0; ty < dirtFillH; ty += dirtDrawH) {
          const drawH = Math.min(dirtDrawH, dirtFillH - ty);
          const srcH = (drawH / dirtDrawH) * dirtImg.naturalHeight;
          for (let tx = 0; tx < p.width; tx += dirtDrawW) {
            const drawW = Math.min(dirtDrawW, p.width - tx);
            const srcW = (drawW / dirtDrawW) * dirtImg.naturalWidth;
            ctx.drawImage(dirtImg, 0, 0, srcW, srcH, p.x + tx, dirtStartY + ty, drawW, drawH);
          }
        }
      }
      // Grass on top
      for (let tx = 0; tx < p.width; tx += tileW) {
        const drawW = Math.min(tileW, p.width - tx);
        const srcW = (drawW / tileW) * grassImg.naturalWidth;
        ctx.drawImage(grassImg, 0, 0, srcW, grassImg.naturalHeight, p.x + tx, grassDrawY, drawW, grassH);
      }
    } else {
      if (stonePlatformImg.complete && stonePlatformImg.naturalWidth > 0) {
        const srcX = 191, srcY = 400, srcW = 1152, srcH = 190, dispH = 40;
        const tileW = Math.round(srcW * dispH / srcH);
        ctx.save();
        ctx.beginPath(); ctx.rect(p.x, p.y, p.width, dispH); ctx.clip();
        for (let tx = -(p.x % tileW); tx < p.width; tx += tileW) {
          ctx.drawImage(stonePlatformImg, srcX, srcY, srcW, srcH, Math.round(p.x + tx), p.y, tileW + 1, dispH);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = "#888";
        ctx.fillRect(p.x, p.y, p.width, p.height);
      }
    }
  });

  // Dirts first (with overlap so they connect under grass)
  dirts.forEach(d => {
    if (dirtImg.complete && dirtImg.naturalWidth > 0) {
      const tW = dirtImg.naturalWidth, tH = dirtImg.naturalHeight;
      const ox = -(Math.round(d.x) % tW);
      const oy = -(Math.round(d.y) % tH);
      ctx.save();
      ctx.beginPath(); ctx.rect(d.x, d.y - 8, d.width, d.height + 8); ctx.clip();
      for (let ty = oy - tH; ty < d.height + 8; ty += tH) {
        for (let tx = ox; tx < d.width; tx += tW) {
          ctx.drawImage(dirtImg, Math.round(d.x + tx), Math.round(d.y - 8 + ty));
        }
      }
      ctx.restore();
    }
  });

  // Grounds on top (grass texture)
  grounds.forEach(g => {
    if (grassImg.complete && grassImg.naturalWidth > 0) {
      const tW = Math.round(grassImg.naturalWidth * g.height / grassImg.naturalHeight);
      ctx.save();
      ctx.beginPath(); ctx.rect(g.x, g.y, g.width, g.height); ctx.clip();
      for (let tx = -(Math.round(g.x) % tW); tx < g.width; tx += tW) {
        ctx.drawImage(grassImg, Math.round(g.x + tx), g.y, tW + 1, g.height);
      }
      ctx.restore();
    }
  });

  // Win zone (hospůdka) — vždy statický obrázek
  if (tavernImg && tavernImg.complete && tavernImg.naturalWidth > 0) {
    const aspect = tavernImg.naturalWidth / tavernImg.naturalHeight;
    const drawH = 420;
    const drawW = drawH * aspect;
    const groundY = 725;
    const refX = winZone.x - 60;
    ctx.drawImage(tavernImg, refX, groundY - drawH, drawW, drawH);
  } else {
    ctx.fillStyle = "yellow";
    ctx.fillRect(winZone.x, winZone.y, winZone.width, winZone.height);
  }

  // SPIKES - TEXTURA skikes.png (rendered larger than hitbox, anchored to ground)
  spikes.forEach(s => {
    if (skikesImg.complete) {
      const drawW = s.width * 2.5;
      const drawH = s.height * 2;
      const drawX = s.x + (s.width - drawW) / 2;
      const drawY = s.y + s.height - drawH + 29;
      ctx.drawImage(skikesImg, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = "red";  // Fallback
      ctx.fillRect(s.x, s.y, s.width, s.height);
    }
  });

  // COINS - beer texture
  levelCoins.forEach(c => {
    if (c.collected) return;
    if (beerCoinImg.complete && beerCoinImg.naturalWidth > 0) {
      const aspect = beerCoinImg.naturalWidth / beerCoinImg.naturalHeight;
      const drawH = c.height * 2.5;
      const drawW = drawH * aspect;
      const drawX = c.x + (c.width - drawW) / 2;
      const bob = Math.sin(Date.now() / 300 + c.x) * 5;
      const drawY = c.y + (c.height - drawH) / 2 + bob;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(beerCoinImg, drawX, drawY, drawW, drawH);
      ctx.imageSmoothingEnabled = true;
    } else {
      const shimmer = Math.sin(Date.now() / 200 + c.x) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 215, 0, ${shimmer})`;
      ctx.beginPath();
      ctx.arc(c.x + c.width / 2, c.y + c.height / 2, c.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // COIN PARTICLES
  for (let i = coinParticles.length - 1; i >= 0; i--) {
    const p = coinParticles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.dy += 0.05;
    p.life -= 0.02;
    if (p.life <= 0) {
      coinParticles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // DEDEK - animovana textura + facing flip
  let currentDedekImg = dedekImg;
  if (animState === 'idle') {
    const f = idleFrames[animFrame];
    if (f && f.complete && f.naturalWidth > 0) currentDedekImg = f;
  } else if (animState === 'walk') {
    const f = walkFrames[animFrame % walkFrames.length];
    if (f && f.complete && f.naturalWidth > 0) currentDedekImg = f;
  } else if (animState === 'jump') {
    const f = jumpFrames[animFrame % jumpFrames.length];
    if (f && f.complete && f.naturalWidth > 0) currentDedekImg = f;
  } else if (animState === 'dash') {
    const f = dashFrames[animFrame % dashFrames.length];
    if (f && f.complete && f.naturalWidth > 0) currentDedekImg = f;
  }
  if (!winning && currentDedekImg.complete && currentDedekImg.naturalWidth > 0) {
    // idle/walk maji hodne bileho okraje, dash/land maji postavu vetsi v ramci
    const heightMult = animState === 'dash' ? 2.2 : 4.5;
    const aspectRatio = currentDedekImg.naturalWidth / currentDedekImg.naturalHeight;
    const renderH = player.height * heightMult;
    const renderW = renderH * aspectRatio;
    ctx.save();
    // Zarovnání: nohy dědka sedí na spodní hraně kolizního boxu
    ctx.translate(player.x + player.width / 2, player.y + player.height);
    ctx.scale(player.facing, 1);
    // Kompenzace offsetu pro jump framy (postava neni vycentrovana v kazdem framu)
    let offX = 0, offY = 0;
    if (animState === 'jump') {
      const off = jumpOffsets[animFrame % jumpFrames.length];
      if (off) { offX = -off.ox * renderW; offY = -off.oy * renderH; }
    }
    // Posun dolů — obrázky mají průhledný okraj nahoře, posuneme aby nohy seděly na zemi
    const footOffset = renderH * 0.27;
    ctx.drawImage(currentDedekImg, -renderW / 2 + offX, -renderH + footOffset + offY, renderW, renderH);
    ctx.restore();
  } else if (!winning) {
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  ctx.restore();

  // HUD — tematický panel vlevo nahoře
  {
    const hx = 16, hy = 16, hW = 256, hH = 76, hPad = 12;
    ctx.save();

    // Tmavý dřevěný panel
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = '#1a0c03';
    ctx.beginPath();
    ctx.roundRect(hx, hy, hW, hH, 9);
    ctx.fill();

    // Zlatý rámeček
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#8b5a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(hx, hy, hW, hH, 9);
    ctx.stroke();

    // Jemný vnitřní highlight
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#ffe08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hx + 2, hy + 2, hW - 4, hH - 4, 8);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 4;
    ctx.font = 'bold 16px "Cinzel", serif';

    // Level (vlevo)
    ctx.fillStyle = '#f0ddb0';
    ctx.textAlign = 'left';
    ctx.fillText(levelEl.innerText, hx + hPad, hy + 30);

    // Timer (střed)
    ctx.fillStyle = '#d4c4a0';
    ctx.textAlign = 'center';
    ctx.fillText(timerEl.innerText, hx + hW / 2, hy + 30);

    // Beer ikona + počet (vpravo)
    const bSz = 22;
    ctx.shadowBlur = 0;
    if (beerCoinImg.complete && beerCoinImg.naturalWidth > 0) {
      ctx.drawImage(beerCoinImg, hx + hW - hPad - bSz - 34, hy + 10, bSz, bSz);
    }
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#f5d060';
    ctx.textAlign = 'right';
    ctx.fillText(coinsEl.innerText, hx + hW - hPad, hy + 30);

    // Řádek 2 — ikony aktivních itemů
    const iSz = 18, iY = hy + 50;
    const activeIcons = [];
    if (player.hasShield) activeIcons.push(iconShield);
    if (player.hasDoubleJump) activeIcons.push(iconDoubleJump);
    if (player.hasDash) activeIcons.push(iconDash);
    if (player.hasSpeedBoost) activeIcons.push(iconSpeed);
    if (player.hasMagnet) activeIcons.push(iconMagnet);

    ctx.shadowBlur = 0;
    for (let i = 0; i < activeIcons.length; i++) {
      const ic = activeIcons[i];
      if (ic.complete && ic.naturalWidth > 0) {
        ctx.globalAlpha = 0.9;
        ctx.drawImage(ic, hx + hPad + i * (iSz + 5), iY, iSz, iSz);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Tavern hint — thematic floating panel with fade + bob
  if (tavernHintOpacity > 0.01) {
    const hintX = winZone.x - cameraX + winZone.width / 2;
    const bob = Math.sin(gameTime * 2.4) * 5;
    const pW = 216, pH = 60;
    const px = hintX - pW / 2;
    const py = winZone.y - 162 + bob;

    ctx.save();

    // Dark wood panel
    ctx.globalAlpha = tavernHintOpacity * 0.88;
    ctx.fillStyle = '#1a0c03';
    ctx.beginPath();
    ctx.roundRect(px, py, pW, pH, 10);
    ctx.fill();

    // Gold border
    ctx.strokeStyle = '#8b5a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px, py, pW, pH, 10);
    ctx.stroke();

    // Subtle inner highlight
    ctx.globalAlpha = tavernHintOpacity * 0.11;
    ctx.strokeStyle = '#ffe08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 2, pW - 4, pH - 4, 9);
    ctx.stroke();

    // Text — SPACE key label
    ctx.globalAlpha = tavernHintOpacity;
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 5;
    ctx.textAlign = 'center';

    ctx.font = 'bold 16px "Cinzel", serif';
    ctx.fillStyle = '#ffe08a';
    ctx.fillText('SPACE', hintX, py + 26);

    ctx.font = '11px "Cinzel", serif';
    ctx.fillStyle = '#b8986a';
    ctx.fillText('pro vstup do hospody', hintX, py + 46);

    ctx.shadowBlur = 0;

    // Arrow pointing down at the door
    const aX = hintX;
    const aY = py + pH + 5;
    ctx.globalAlpha = tavernHintOpacity * 0.9;
    ctx.fillStyle = '#c48a2e';
    ctx.beginPath();
    ctx.moveTo(aX - 12, aY);
    ctx.lineTo(aX + 12, aY);
    ctx.lineTo(aX, aY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a4a1e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }

}

// LOOP
function loop(timestamp) {
  if (gamePaused || isMenuOpen) {
    lastTime = timestamp;
    draw();
    requestAnimationFrame(loop);
    return;
  }
  const delta = Math.min((timestamp - lastTime) / 1000, 0.05) || 0.016;
  lastTime = timestamp;

  if (!deathScreen.classList.contains("active") && !winning)
    update(delta);

  draw();
  requestAnimationFrame(loop);
}

// START
sounds.music1.play().catch(() => {
  console.log("Klikni do hry pro zvuky");
});
document.addEventListener('click', () => {
  sounds.music1.play().catch(() => {});
}, { once: true });

loadLevel();
requestAnimationFrame(loop);

// Scale game to fit window — maintains 2:1 (1400×700) aspect ratio
function fitGame() {
  const wrapper = document.querySelector('.gameWrapper');
  if (!wrapper) return;
  const scale = Math.min(window.innerWidth / 1400, window.innerHeight / 700);
  wrapper.style.transform = `scale(${scale})`;
}
fitGame();
window.addEventListener('resize', fitGame);