const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1400;
canvas.height = 700;

const deathScreen = document.getElementById("deathScreen");
const levelEl = document.getElementById("level") || {innerText: ''};
const coinsEl = document.getElementById("coins") || {innerText: ''};
const activeItemsEl = document.getElementById("activeItems") || {innerText: ''};
const timerEl = document.getElementById("timer") || {innerText: ''};
const layoutImg = new Image();
layoutImg.src = 'assets/ui/layout.png';
let layoutOpacity = 1;
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
let winAnimFrame = 0;
let winAnimTime = 0;
let currentBg = null;
let currentBgIndex = null;
let lastTime = 0;
let cameraX = 0;
let levelCoins = [];
let tempCoins = 0;
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
    deathScreen.classList.add("active");
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
      deathScreen.classList.add("active");
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

  // LAYOUT OVERLAY - fade when player near edges
  const screenX = player.x - cameraX;
  const edgeZone = 450;
  const nearLeft = screenX < edgeZone ? 1 - screenX / edgeZone : 0;
  const nearRight = screenX + player.width > canvas.width - edgeZone
    ? 1 - (canvas.width - screenX - player.width) / edgeZone : 0;
  const fade = Math.max(nearLeft, nearRight);
  layoutOpacity = fade > 0 ? Math.max(0.3, 1 - fade) : 1;

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
          location.href = "levels.html";
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

  // Background
  if (currentBg && currentBg.complete && currentBg.naturalWidth > 0) {
    if (currentBgIndex === 1) {
      // Looping background with parallax
      const parallax = 0.3;
      const bgW = canvas.width;
      const bgH = canvas.height;
      const scrollX = Math.round((cameraX * parallax) % bgW);
      const x1 = -scrollX;
      for (let bx = x1; bx < canvas.width; bx += bgW) {
        ctx.drawImage(currentBg, Math.round(bx), 0, bgW + 1, bgH);
      }
      if (x1 > 0) ctx.drawImage(currentBg, Math.round(x1 - bgW), 0, bgW + 1, bgH);
    } else {
      ctx.drawImage(currentBg, 0, 0, canvas.width, canvas.height);
    }
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
        // Crop rounded ends (191px each side) and stone content rows (400-590)
        ctx.drawImage(stonePlatformImg, 191, 400, 1152, 190, p.x, p.y, p.width, 40);
      } else {
        ctx.fillStyle = "#888";
        ctx.fillRect(p.x, p.y, p.width, p.height);
      }
    }
  });

  // Dirts first (with overlap so they connect under grass)
  dirts.forEach(d => {
    if (dirtImg.complete && dirtImg.naturalWidth > 0) {
      ctx.drawImage(dirtImg, d.x, d.y - 8, d.width, d.height + 8);
    }
  });

  // Grounds on top (grass texture)
  grounds.forEach(g => {
    if (grassImg.complete && grassImg.naturalWidth > 0) {
      ctx.drawImage(grassImg, g.x, g.y, g.width, g.height);
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

  // SPIKES - TEXTURA skikes.png
  spikes.forEach(s => {
    if (skikesImg.complete) {
      ctx.drawImage(skikesImg, s.x, s.y, s.width, s.height);
    } else {
      ctx.fillStyle = "red";  // Fallback
      ctx.fillRect(s.x, s.y, s.width, s.height);
    }
  });

  // COINS - yellow circles with shimmer
  levelCoins.forEach(c => {
    if (c.collected) return;
    const shimmer = Math.sin(Date.now() / 200 + c.x) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 215, 0, ${shimmer})`;
    ctx.beginPath();
    ctx.arc(c.x + c.width / 2, c.y + c.height / 2, c.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

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

  // "Press SPACE" hint u hospůdky (nearTavern je globální z update)
  if (nearTavern) {
    const hintX = winZone.x - cameraX + winZone.width / 2;
    const hintY = winZone.y - 20;
    ctx.save();
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(hintX - 60, hintY - 16, 120, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText('SPACE — vstoupit', hintX, hintY);
    ctx.restore();
  }

  // LAYOUT OVERLAY on canvas
  if (layoutImg.complete && layoutImg.naturalWidth > 0) {
    ctx.globalAlpha = layoutOpacity;
    ctx.drawImage(layoutImg, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }

  // HUD - drawn on canvas, positioned inside layout wooden boxes
  // Top dark bar: x=113..405, y=27..58  |  Bottom dark bar: x=113..405, y=68..100
  ctx.globalAlpha = layoutOpacity;

  // Level (top bar left)
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#f5e6c8';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 3;
  ctx.fillText(levelEl.innerText, 210, 44);

  // Timer (top bar right)
  ctx.textAlign = 'right';
  ctx.fillText(timerEl.innerText, 398, 44);

  // Coins (bottom bar left)
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = '#f5d060';
  ctx.textAlign = 'left';
  ctx.fillText(coinsEl.innerText, 195, 90);

  // Active items as icons (bottom bar right, outside the box)
  const iconSize = 20;
  const iconY = 78;
  const iconRightEdge = 460;
  const activeIcons = [];
  if (player.hasMagnet) activeIcons.push(iconMagnet);
  if (player.hasDash) activeIcons.push(iconDash);
  if (player.hasSpeedBoost) activeIcons.push(iconSpeed);
  if (player.hasDoubleJump) activeIcons.push(iconDoubleJump);
  if (player.hasShield) activeIcons.push(iconShield);
  for (let i = 0; i < activeIcons.length; i++) {
    const icon = activeIcons[i];
    if (icon.complete && icon.naturalWidth > 0) {
      ctx.drawImage(icon, iconRightEdge - (activeIcons.length - i) * (iconSize + 3), iconY, iconSize, iconSize);
    }
  }

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// LOOP
function loop(timestamp) {
  if (gamePaused) {
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