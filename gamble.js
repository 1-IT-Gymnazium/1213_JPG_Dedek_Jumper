// ── Prizes & weights ─────────────────────────────────────────────
const PRIZES = [
  { label:'Nic',        sub:'',           rarity:'common',    rl:'OBYČEJNÉ',   rc:'#9a8060', bg:'#1e1008', reward:{type:'nothing'} },
  { label:'10 Piv',     sub:'',           rarity:'common',    rl:'OBYČEJNÉ',   rc:'#c8a060', bg:'#1a1005', reward:{type:'coins',n:10} },
  { label:'20 Piv',     sub:'',           rarity:'uncommon',  rl:'NEOBVYKLÉ',  rc:'#50c850', bg:'#081808', reward:{type:'coins',n:20} },
  { label:'Volné',      sub:'Točení',     rarity:'uncommon',  rl:'NEOBVYKLÉ',  rc:'#50a8d8', bg:'#081828', reward:{type:'free_spin'} },
  { label:'30 Piv',     sub:'',           rarity:'rare',      rl:'VZÁCNÉ',     rc:'#7090f0', bg:'#0c0830', reward:{type:'coins',n:30} },
  { label:'50 Piv',     sub:'',           rarity:'rare',      rl:'VZÁCNÉ',     rc:'#9060e0', bg:'#150828', reward:{type:'coins',n:50} },
  { label:'2× Příjem',  sub:'10 min',     rarity:'epic',      rl:'EPICKÉ',     rc:'#e87828', bg:'#250c00', reward:{type:'double_income',dur:600} },
  { label:'100 Piv',    sub:'',           rarity:'epic',      rl:'EPICKÉ',     rc:'#e87828', bg:'#250e00', reward:{type:'coins',n:100} },
  { label:'50% Sleva',  sub:'v obchodě',  rarity:'legendary', rl:'LEGENDÁRNÍ', rc:'#ffd700', bg:'#1e1400', reward:{type:'shop_discount'} },
  { label:'250 Piv',    sub:'',           rarity:'legendary', rl:'LEGENDÁRNÍ', rc:'#ffd700', bg:'#1c1000', reward:{type:'coins',n:250} },
];

// True probability weights (sum ≈ 100)
const WEIGHTS = [18, 20, 17, 13, 12, 9, 5, 3.5, 1.5, 1];
const SPIN_COST = 25;
const N          = PRIZES.length;
const SEG        = (Math.PI * 2) / N;           // 36° per segment
// Offset so segment-0 starts at top when rotation=0
const BASE       = -Math.PI / 2 - SEG / 2;

// ── Canvas setup ─────────────────────────────────────────────────
const canvas = document.getElementById('wheelCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const CX = W / 2, CY = H / 2;
const R = 190;

let rotation     = 0;
let spinning     = false;
let highlightIdx = -1;
let notifTimer   = null;

// ── Save helpers ─────────────────────────────────────────────────
function getSave() {
  try { return JSON.parse(sessionStorage.getItem('oldFartJumper_save')) || {coins:0,items:[]}; }
  catch { return {coins:0,items:[]}; }
}
function setSave(d) { sessionStorage.setItem('oldFartJumper_save', JSON.stringify(d)); }

// ── UI refresh ───────────────────────────────────────────────────
function refreshBalance() {
  const coins  = getSave().coins;
  const hasFree = sessionStorage.getItem('oldFartJumper_buff_freespin') === 'true';
  document.getElementById('coinBalance').innerHTML =
    `<img src="assets/ui/beer_coin.png" style="width:22px;height:22px;image-rendering:pixelated;"> ${coins}`;
  const btn = document.getElementById('spinBtn');
  btn.disabled   = spinning || (!hasFree && coins < SPIN_COST);
  btn.textContent = hasFree ? '★ Točit! (GRATIS)' : '▶ Točit!';
  refreshBuffs();
}

function refreshBuffs() {
  const panel = document.getElementById('activeBuffs');
  const items = [];

  const raw2x = sessionStorage.getItem('oldFartJumper_buff_2x');
  if (raw2x) {
    const d = JSON.parse(raw2x);
    if (d.expires > Date.now()) {
      const s   = Math.ceil((d.expires - Date.now()) / 1000);
      const m   = Math.floor(s / 60);
      const sec = String(s % 60).padStart(2, '0');
      items.push(`<span class="buff epic">2× Příjem piva: ${m}:${sec}</span>`);
    } else {
      sessionStorage.removeItem('oldFartJumper_buff_2x');
    }
  }
  if (sessionStorage.getItem('oldFartJumper_buff_discount') === 'true')
    items.push('<span class="buff legendary">50% Sleva v obchodě</span>');
  if (sessionStorage.getItem('oldFartJumper_buff_freespin') === 'true')
    items.push('<span class="buff uncommon">Volné Točení k dispozici!</span>');

  panel.innerHTML = items.length
    ? `<div class="buff-label">Aktivní vylepšení:</div>${items.join('')}`
    : '';
}

// ── Weighted prize pick ──────────────────────────────────────────
function pick() {
  const total = WEIGHTS.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < N; i++) { r -= WEIGHTS[i]; if (r <= 0) return i; }
  return N - 1;
}

// ── Target rotation for a given prize index ───────────────────────
// Midpoint of segment idx in unrotated space = BASE + (idx+0.5)*SEG = -PI/2 + idx*SEG
// After rotation R, screen midpoint = -PI/2 + idx*SEG + R
// To align with pointer at -PI/2:  R = -idx*SEG + n*2PI
function targetFor(idx, minSpins) {
  let base = ((-idx * SEG) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  let target = base;
  while (target < rotation + minSpins * Math.PI * 2) target += Math.PI * 2;
  // Small random jitter within the winning segment (±27% of segment width)
  return target + (Math.random() - 0.5) * SEG * 0.54;
}

// ── Draw ─────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(CX, CY);

  // Outer glow halo
  const halo = ctx.createRadialGradient(0, 0, R * 0.75, 0, 0, R + 36);
  halo.addColorStop(0, 'rgba(196,138,46,0)');
  halo.addColorStop(1, 'rgba(196,138,46,0.14)');
  ctx.beginPath();
  ctx.arc(0, 0, R + 36, 0, Math.PI * 2);
  ctx.fillStyle = halo;
  ctx.fill();

  // ── Rotating wheel ──
  ctx.save();
  ctx.rotate(rotation);

  // Wheel base
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = '#0e0704';
  ctx.fill();

  for (let i = 0; i < N; i++) {
    const a0  = BASE + i * SEG;
    const a1  = a0 + SEG;
    const am  = a0 + SEG / 2;
    const p   = PRIZES[i];

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R - 3, a0, a1);
    ctx.closePath();
    ctx.fillStyle = p.bg;
    ctx.fill();

    // Win highlight
    if (i === highlightIdx) {
      ctx.fillStyle = 'rgba(255,255,200,0.14)';
      ctx.fill();
    }

    // Divider line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a0) * (R - 3), Math.sin(a0) * (R - 3));
    ctx.strokeStyle = '#4a2c0e';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Segment text
    ctx.save();
    ctx.rotate(am);
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur  = 5;
    ctx.textAlign   = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle   = p.rc;

    if (p.sub) {
      ctx.font = 'bold 11px "Cinzel", serif';
      ctx.fillText(p.label, R - 10, -7);
      ctx.font      = '9px "Cinzel", serif';
      ctx.fillStyle = 'rgba(200,180,140,0.75)';
      ctx.fillText(p.sub, R - 10, 7);
    } else {
      ctx.font = 'bold 12px "Cinzel", serif';
      ctx.fillText(p.label, R - 10, 0);
    }
    ctx.restore();
  }

  ctx.restore(); // end wheel rotation

  // ── Fixed decorative rim ──
  ctx.beginPath(); ctx.arc(0, 0, R + 16, 0, Math.PI * 2);
  ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 2; ctx.stroke();

  ctx.beginPath(); ctx.arc(0, 0, R + 9, 0, Math.PI * 2);
  ctx.strokeStyle = '#c48a2e'; ctx.lineWidth = 7; ctx.stroke();

  ctx.beginPath(); ctx.arc(0, 0, R + 5, 0, Math.PI * 2);
  ctx.strokeStyle = '#f5d060'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.strokeStyle = '#8b5a1e'; ctx.lineWidth = 3; ctx.stroke();

  // Rivet nails on rim
  for (let i = 0; i < 20; i++) {
    const a  = (i / 20) * Math.PI * 2;
    const rx = Math.cos(a) * (R + 9);
    const ry = Math.sin(a) * (R + 9);
    ctx.beginPath();
    ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
    const rg = ctx.createRadialGradient(rx - 1, ry - 1, 0, rx, ry, 3.5);
    rg.addColorStop(0, '#ffe890');
    rg.addColorStop(1, '#7a4010');
    ctx.fillStyle = rg;
    ctx.fill();
  }

  // ── Center hub ──
  const hg = ctx.createRadialGradient(-5, -5, 0, 0, 0, 24);
  hg.addColorStop(0,    '#fff4a0');
  hg.addColorStop(0.35, '#c48a2e');
  hg.addColorStop(1,    '#4a2200');
  ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fillStyle = hg; ctx.fill();
  ctx.strokeStyle = '#f5d060'; ctx.lineWidth = 2; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,220,80,0.45)'; ctx.lineWidth = 1.5; ctx.stroke();

  // ── Fixed pointer (triangle pointing down into wheel) ──
  const pY = -(R + 25);
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur  = 10;
  ctx.beginPath();
  ctx.moveTo(0,   pY + 26);
  ctx.lineTo(-15, pY);
  ctx.lineTo(15,  pY);
  ctx.closePath();
  ctx.fillStyle   = '#f5d060';
  ctx.fill();
  ctx.strokeStyle = '#5a2800';
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  ctx.restore();
}

// ── Spin ─────────────────────────────────────────────────────────
function spin() {
  if (spinning) return;
  const save    = getSave();
  const hasFree = sessionStorage.getItem('oldFartJumper_buff_freespin') === 'true';
  if (!hasFree && save.coins < SPIN_COST) return;

  if (hasFree) {
    sessionStorage.removeItem('oldFartJumper_buff_freespin');
  } else {
    save.coins -= SPIN_COST;
    setSave(save);
  }

  spinning     = true;
  highlightIdx = -1;
  document.getElementById('spinMsg').textContent = '';
  refreshBalance();

  const idx      = pick();
  const minSpins = 6 + Math.floor(Math.random() * 3); // 6–8 full spins
  const target   = targetFor(idx, minSpins);
  const t0       = performance.now();
  const dur      = 4500 + Math.random() * 1500;       // 4.5–6 s
  const start    = rotation;

  function frame(now) {
    const t     = Math.min((now - t0) / dur, 1);
    const ease  = 1 - Math.pow(1 - t, 4);             // quartic ease-out
    rotation    = start + (target - start) * ease;
    draw();

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      rotation     = target;
      highlightIdx = idx;
      draw();
      spinning = false;
      applyPrize(idx);
    }
  }
  requestAnimationFrame(frame);
}

// ── Apply prize ──────────────────────────────────────────────────
function applyPrize(idx) {
  const p    = PRIZES[idx];
  const save = getSave();
  const main = p.label + (p.sub ? ' ' + p.sub : '');
  let   sub  = '';

  switch (p.reward.type) {
    case 'nothing':
      sub = 'Tentokrát štěstí nefouká...';
      break;
    case 'coins':
      save.coins += p.reward.n;
      setSave(save);
      sub = `+${p.reward.n} Piv přidáno do váčku!`;
      break;
    case 'free_spin':
      sessionStorage.setItem('oldFartJumper_buff_freespin', 'true');
      sub = 'Příští točení je zdarma!';
      break;
    case 'double_income':
      sessionStorage.setItem('oldFartJumper_buff_2x',
        JSON.stringify({expires: Date.now() + p.reward.dur * 1000}));
      sub = 'Příjem piva zdvojen na 10 minut!';
      break;
    case 'shop_discount':
      sessionStorage.setItem('oldFartJumper_buff_discount', 'true');
      sub = '50% sleva na jeden nákup v obchodě!';
      break;
  }

  showNotification(p, main, sub);
  refreshBalance();
}

// ── Win notification ─────────────────────────────────────────────
function showNotification(prize, mainText, subText) {
  const el = document.getElementById('winNotification');
  // Force re-trigger animation by removing show first
  el.className = 'win-notification rarity-' + prize.rarity;
  document.getElementById('winRarity').textContent  = prize.rl;
  document.getElementById('winText').textContent    = mainText;
  document.getElementById('winSubtext').textContent = subText;

  // Double rAF ensures the browser processes the class removal before re-adding
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));

  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { highlightIdx = -1; draw(); }, 450);
  }, 5000);
}

// ── Init ─────────────────────────────────────────────────────────
document.fonts.ready.then(() => draw());
draw();
refreshBalance();
setInterval(refreshBuffs, 1000);
