const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 1400;
canvas.height = 700;

const deathScreen = document.getElementById("deathScreen");
const scoreEl = document.getElementById("score") || {innerText: ''};
const timerEl = document.getElementById("timer") || {innerText: ''};
const levelEl = document.getElementById("level") || {innerText: ''};
const coinsEl = document.getElementById("coins") || {innerText: ''};
const activeItemsEl = document.getElementById("activeItems") || {innerText: ''};

// TEXTURY - PŘIDÁNO
const dedekImg = new Image();
dedekImg.src = 'dedek.png';
const skikesImg = new Image();
skikesImg.src = 'skikes.png';

// SAVE/LOAD (localStorage)
function getSave() {
  try {
    return JSON.parse(localStorage.getItem('oldFartJumper_save')) || { coins: 0, items: [] };
  } catch(e) {
    return { coins: 0, items: [] };
  }
}
function setSave(data) {
  localStorage.setItem('oldFartJumper_save', JSON.stringify(data));
}

// SHOP ITEMS CATALOG
const SHOP_ITEMS = [
  { id: 'doubleJump', name: 'Double Jump', description: 'Skok ve vzduchu', price: 50, type: 'permanent' },
  { id: 'shield', name: 'Shield', description: 'Prezije 1 naraz do spiku', price: 20, type: 'consumable' },
  { id: 'speedBoost', name: 'Speed Boost', description: 'Rychlejsi pohyb o 30%', price: 40, type: 'permanent' },
  { id: 'extraDash', name: 'Extra Dash', description: 'Kratsi cooldown dashe o 50%', price: 60, type: 'permanent' },
  { id: 'magnet', name: 'Magnet', description: 'Pritahuje mince', price: 80, type: 'permanent' }
];

// LEVEL Z URL
const params = new URLSearchParams(window.location.search);
let level = parseInt(params.get("level")) || 0;
let walkTimer = 0;

// ZVUKY
const sounds = {
  hit: new Audio('hit.wav'),
  win: new Audio('win.wav'), 
  jump: new Audio('jump.wav'),
  walk: new Audio('walk.wav'),
  coin: new Audio('win.wav'),
  dash: new Audio('dash.wav'),
  music1: new Audio('music1.mp3')
};
sounds.music1.loop = true;
sounds.music1.volume = 0.3;

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
  dashCooldown: 0,
  baseSpeed: 7,
  hasDoubleJump: false,
  hasShield: false,
  hasSpeedBoost: false,
  hasExtraDash: false,
  hasMagnet: false,
  canDoubleJump: false
};

// LEVELY (stejné)
const levels = [
  // 🟢 TUTORIAL
  {
    length: 1800,
    platforms: [
      { x: 0, y: 650, width: 1800, height: 50 },
      { x: 400, y: 550, width: 200, height: 20 },
      { x: 700, y: 500, width: 200, height: 20 }
    ],
    spikes: [],
    coins: [
      { x: 420, y: 520, width: 20, height: 20 },
      { x: 720, y: 470, width: 20, height: 20 },
      { x: 900, y: 620, width: 20, height: 20 }
    ],
    winZone: { x: 1600, y: 600, width: 100, height: 50 }
  },
  // 🟡 LEVEL 1
  {
    length: 2000,
    platforms: [
      { x: 0, y: 650, width: 2000, height: 50 },
      { x: 500, y: 550, width: 150, height: 20 },
      { x: 800, y: 500, width: 150, height: 20 }
    ],
    spikes: [
      { x: 900, y: 610, width: 40, height: 40 }
    ],
    coins: [
      { x: 520, y: 520, width: 20, height: 20 },
      { x: 820, y: 470, width: 20, height: 20 },
      { x: 950, y: 620, width: 20, height: 20 },
      { x: 1400, y: 620, width: 20, height: 20 }
    ],
    winZone: { x: 1800, y: 600, width: 100, height: 50 }
  },
  // 🟠 LEVEL 2 (dash)
  {
    length: 2200,
    platforms: [
      { x: 0, y: 650, width: 2200, height: 50 },
      { x: 600, y: 550, width: 120, height: 20 },
      { x: 1100, y: 550, width: 120, height: 20 }
    ],
    spikes: [
      { x: 800, y: 610, width: 40, height: 40 }
    ],
    coins: [
      { x: 620, y: 520, width: 20, height: 20 },
      { x: 1120, y: 520, width: 20, height: 20 },
      { x: 850, y: 620, width: 20, height: 20 },
      { x: 1500, y: 620, width: 20, height: 20 }
    ],
    winZone: { x: 2000, y: 600, width: 100, height: 50 }
  },
  // 🔴 LEVEL 3
  {
    length: 2400,
    platforms: [
      { x: 0, y: 650, width: 2400, height: 50 },
      { x: 400, y: 550, width: 100, height: 20 },
      { x: 650, y: 500, width: 100, height: 20 },
      { x: 900, y: 450, width: 100, height: 20 }
    ],
    spikes: [
      { x: 1000, y: 610, width: 40, height: 40 }
    ],
    coins: [
      { x: 420, y: 520, width: 20, height: 20 },
      { x: 670, y: 470, width: 20, height: 20 },
      { x: 920, y: 420, width: 20, height: 20 },
      { x: 1050, y: 620, width: 20, height: 20 },
      { x: 1600, y: 620, width: 20, height: 20 }
    ],
    winZone: { x: 2200, y: 600, width: 100, height: 50 }
  },
  // 🔥 LEVEL 4
  {
    length: 2600,
    platforms: [
      { x: 0, y: 650, width: 2600, height: 50 },
      { x: 500, y: 550, width: 80, height: 20 },
      { x: 700, y: 500, width: 80, height: 20 },
      { x: 900, y: 450, width: 80, height: 20 },
      { x: 1100, y: 400, width: 80, height: 20 }
    ],
    spikes: [
      { x: 1300, y: 610, width: 40, height: 40 },
      { x: 1500, y: 610, width: 40, height: 40 }
    ],
    coins: [
      { x: 520, y: 520, width: 20, height: 20 },
      { x: 720, y: 470, width: 20, height: 20 },
      { x: 920, y: 420, width: 20, height: 20 },
      { x: 1120, y: 370, width: 20, height: 20 },
      { x: 1350, y: 620, width: 20, height: 20 }
    ],
    winZone: { x: 2400, y: 600, width: 100, height: 50 }
  },
  // 💀 LEVEL 5 (hard)
  {
    length: 2800,
    platforms: [
      { x: 0, y: 650, width: 2800, height: 50 },
      { x: 400, y: 550, width: 60, height: 20 },
      { x: 550, y: 500, width: 60, height: 20 },
      { x: 700, y: 450, width: 60, height: 20 }
    ],
    spikes: [
      { x: 900, y: 610, width: 40, height: 40 },
      { x: 1100, y: 610, width: 40, height: 40 },
      { x: 1300, y: 610, width: 40, height: 40 }
    ],
    coins: [
      { x: 420, y: 520, width: 20, height: 20 },
      { x: 570, y: 470, width: 20, height: 20 },
      { x: 720, y: 420, width: 20, height: 20 },
      { x: 950, y: 620, width: 20, height: 20 },
      { x: 1150, y: 620, width: 20, height: 20 }
    ],
    winZone: { x: 2600, y: 600, width: 100, height: 50 }
  }
];

let platforms, spikes, winZone;
let score = 0, time = 0, lastTime = 0;
let cameraX = 0;
let levelCoins = [];
let tempCoins = 0;
let savedCoins = getSave().coins;

function loadLevel() {
  const lvl = levels[level];
  platforms = lvl.platforms;
  spikes = lvl.spikes;
  winZone = lvl.winZone;
  levelCoins = (lvl.coins || []).map(c => ({ ...c, collected: false }));
  levelEl.innerText = "Level: " + (level + 1);
  player.x = 100; 
  player.y = 500; 
  player.dx = 0; 
  player.dy = 0; 
  player.dashCooldown = 0;
  walkTimer = 0;
  tempCoins = 0;
  const save = getSave();
  savedCoins = save.coins;
  coinsEl.innerText = `Coins: ${savedCoins}`;

  // Apply owned item effects
  player.hasDoubleJump = save.items.includes('doubleJump');
  player.hasShield = save.items.filter(i => i === 'shield').length > 0;
  player.hasSpeedBoost = save.items.includes('speedBoost');
  player.hasExtraDash = save.items.includes('extraDash');
  player.hasMagnet = save.items.includes('magnet');
  player.canDoubleJump = false;

  // Speed Boost: +30%
  player.speed = player.baseSpeed * (player.hasSpeedBoost ? 1.3 : 1);

  // Show active items in HUD
  const active = [];
  if (player.hasDoubleJump) active.push('2xJump');
  if (player.hasShield) active.push('Shield');
  if (player.hasSpeedBoost) active.push('Speed');
  if (player.hasExtraDash) active.push('Dash+');
  if (player.hasMagnet) active.push('Magnet');
  activeItemsEl.innerText = active.length ? active.join(' | ') : '';
}

// CONTROLS
const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// RESET
function resetGame() {
  deathScreen.classList.remove("active");
  loadLevel();
}

// UPDATE
function update(delta) {
  // Input
  if (keys["KeyD"]) { 
    player.dx = player.speed; 
    player.facing = 1;
  } else if (keys["KeyA"]) { 
    player.dx = -player.speed; 
    player.facing = -1;
  } else { 
    player.dx = 0; 
  }

  // Jump + ZVUK + Double Jump
  if (keys["Space"] && player.grounded) {
    player.dy = player.jump;
    sounds.jump.currentTime = 0;
    sounds.jump.play().catch(() => {});
    player.grounded = false;
    player.canDoubleJump = player.hasDoubleJump;
  } else if (keys["Space"] && !player.grounded && player.canDoubleJump) {
    player.dy = player.jump;
    sounds.jump.currentTime = 0;
    sounds.jump.play().catch(() => {});
    player.canDoubleJump = false;
    keys["Space"] = false; // prevent repeated trigger
  }

  // Dash + ZVUK + Extra Dash
  if (level >= 2 && keys["KeyW"] && player.dashCooldown <= 0) {
    player.dx = player.facing * player.dashSpeed;
    player.dashCooldown = player.hasExtraDash ? 90 : 180;
    sounds.dash.currentTime = 0;
    sounds.dash.play().catch(() => {});
  }
  if (player.dashCooldown > 0) player.dashCooldown -= 1;

  // Physics
  player.dy += player.gravity * delta * 60;
  player.x += player.dx * delta * 60;
  player.y += player.dy * delta * 60;

  // Platform collision
  player.grounded = false;
  for (let p of platforms) {
    if (player.x + 5 < p.x + p.width - 5 &&
        player.x + player.width - 5 > p.x + 5 &&
        player.y + player.height > p.y - 10 &&
        player.y + player.height <= p.y + 5 &&
        player.dy >= 0) {
      player.y = p.y - player.height;
      player.dy = 0;
      player.grounded = true;
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
      coinsEl.innerText = `Coins: ${savedCoins + tempCoins}`;
      sounds.coin.currentTime = 0;
      sounds.coin.play().catch(() => {});
    }
  }

  // WALK ZVUK LOOP
  if (player.grounded && (keys["KeyD"] || keys["KeyA"])) {
    walkTimer += delta * 60;
    if (walkTimer > 0.4) {
      sounds.walk.currentTime = 0;
      sounds.walk.play().catch(() => {});
      walkTimer = 0;
    }
  } else {
    walkTimer = 0;
    sounds.walk.pause();
  }

  // CAMERA - follow player
  cameraX = player.x - canvas.width / 3;
  const lvl = levels[level];
  if (cameraX < 0) cameraX = 0;
  if (cameraX > lvl.length - canvas.width) cameraX = lvl.length - canvas.width;

  // WIN + ZVUK
  if (player.x + player.width > winZone.x) {
    // Save collected coins
    if (tempCoins > 0) {
      const save = getSave();
      save.coins += tempCoins;
      setSave(save);
      tempCoins = 0;
    }
    sounds.win.currentTime = 0;
    sounds.win.play().catch(() => {});
    level++;
    if (level > 5) {
      location.href = "levels.html";
    } else {
      location.href = `game.html?level=${level}`;
    }
  }
}

// DRAW - ZMĚNĚNO NA TEXTURY
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Platformy (zelené)
  ctx.fillStyle = "green";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, p.height));

  // Win zone (žlutá)
  ctx.fillStyle = "yellow";
  ctx.fillRect(winZone.x, winZone.y, winZone.width, winZone.height);

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

  // DEDEK - TEXTURA dedek.png + facing flip
  if (dedekImg.complete) {
    ctx.save();
    ctx.scale(player.facing, 1);
    ctx.drawImage(dedekImg,
      player.facing > 0 ? player.x : player.x + player.width,
      player.y,
      player.width, player.height
    );
    ctx.restore();
  } else {
    ctx.fillStyle = "blue";  // Fallback
    ctx.fillRect(player.x, player.y, player.width, player.height);
  }

  ctx.restore();
}

// LOOP
function loop(timestamp) {
  const delta = (timestamp - lastTime) / 1000 || 0.016;
  lastTime = timestamp;
  time += delta;
  
  scoreEl.innerText = `Score: ${Math.floor(time * 10 + level * 100)}`;
  timerEl.innerText = `Time: ${time.toFixed(2)}`;

  if (!deathScreen.classList.contains("active"))
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