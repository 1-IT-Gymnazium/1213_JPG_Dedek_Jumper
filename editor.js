// === EDITOR ROLE CHECK ===
if (localStorage.getItem('oldFartJumper_editor') !== 'true') {
  location.href = 'index.html';
}

// === CANVAS SETUP ===
const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');
const wrapper = canvas.parentElement;

canvas.width = 1400;
canvas.height = 700;

// === TEXTURES ===
const grassImg = new Image(); grassImg.src = 'grass.png';
const dirtImg = new Image(); dirtImg.src = 'dirt.png';
const skikesImg = new Image(); skikesImg.src = 'skikes.png';

// === STATE ===
let currentTool = 'select';
let objects = []; // {type, x, y, width, height, id}
let selectedId = null;
let cameraX = 0;
let levelLength = 2000;
let nextId = 1;

// Drag state
let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Resize state
let resizing = false;
let resizeHandle = null; // 'right', 'bottom', 'corner'

// Place state
let placing = false;
let placeStartX = 0;
let placeStartY = 0;

// Pan state
let panning = false;
let panStartX = 0;

// Mouse world coords
let mouseWorldX = 0;
let mouseWorldY = 0;

// === UI REFS ===
const statusTool = document.getElementById('statusTool');
const statusObjects = document.getElementById('statusObjects');
const statusMouse = document.getElementById('statusMouse');
const statusCamera = document.getElementById('statusCamera');
const levelLengthInput = document.getElementById('levelLength');
const warningEl = document.getElementById('warning');

levelLengthInput.addEventListener('change', () => {
  levelLength = Math.max(1400, parseInt(levelLengthInput.value) || 2000);
  levelLengthInput.value = levelLength;
  render();
});

// === DEFAULT SIZES ===
const DEFAULT_SIZES = {
  platform: { width: 200, height: 20 },
  spike: { width: 40, height: 40 },
  coin: { width: 20, height: 20 },
  winZone: { width: 100, height: 50 },
  spawn: { width: 60, height: 60 }
};

// Ground platform default
const GROUND_SIZE = { width: 2000, height: 200 };

// === TOOL SELECTION ===
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tool' + tool.charAt(0).toUpperCase() + tool.slice(1));
  if (btn) btn.classList.add('active');
  statusTool.textContent = tool;
  selectedId = null;
  render();
}

// === OBJECT HELPERS ===
function getObjectAt(wx, wy) {
  // Return topmost (last) object at position
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i];
    if (wx >= o.x && wx <= o.x + o.width && wy >= o.y && wy <= o.y + o.height) {
      return o;
    }
  }
  return null;
}

function getSelected() {
  return objects.find(o => o.id === selectedId) || null;
}

function getResizeHandle(obj, wx, wy) {
  const handleSize = 8;
  const r = obj.x + obj.width;
  const b = obj.y + obj.height;

  const onRight = Math.abs(wx - r) < handleSize && wy >= obj.y && wy <= b;
  const onBottom = Math.abs(wy - b) < handleSize && wx >= obj.x && wx <= r;
  const onCorner = Math.abs(wx - r) < handleSize && Math.abs(wy - b) < handleSize;

  if (onCorner) return 'corner';
  if (onRight) return 'right';
  if (onBottom) return 'bottom';
  return null;
}

// === SNAP TO GRID ===
const GRID_SIZE = 20;
function snap(val) {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

// === MOUSE EVENTS ===
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top) * scaleY;
  const wx = cx + cameraX;
  const wy = cy;

  // Middle mouse pan
  if (e.button === 1) {
    panning = true;
    panStartX = e.clientX;
    e.preventDefault();
    return;
  }

  if (e.button !== 0) return;

  if (currentTool === 'select') {
    const sel = getSelected();
    // Check resize handles first
    if (sel) {
      const handle = getResizeHandle(sel, wx, wy);
      if (handle) {
        resizing = true;
        resizeHandle = handle;
        return;
      }
    }

    const obj = getObjectAt(wx, wy);
    if (obj) {
      selectedId = obj.id;
      dragging = true;
      dragOffsetX = wx - obj.x;
      dragOffsetY = wy - obj.y;
    } else {
      selectedId = null;
    }
    render();
  } else {
    // Place mode - start drawing
    placing = true;
    placeStartX = snap(wx);
    placeStartY = snap(wy);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top) * scaleY;
  mouseWorldX = cx + cameraX;
  mouseWorldY = cy;

  statusMouse.textContent = `${Math.round(mouseWorldX)}, ${Math.round(mouseWorldY)}`;

  if (panning) {
    const dx = (panStartX - e.clientX) * scaleX;
    cameraX = Math.max(0, Math.min(levelLength - canvas.width, cameraX + dx));
    panStartX = e.clientX;
    statusCamera.textContent = Math.round(cameraX);
    render();
    return;
  }

  if (dragging) {
    const obj = getSelected();
    if (obj) {
      obj.x = snap(mouseWorldX - dragOffsetX);
      obj.y = snap(mouseWorldY - dragOffsetY);
      render();
    }
    return;
  }

  if (resizing) {
    const obj = getSelected();
    if (obj) {
      if (resizeHandle === 'right' || resizeHandle === 'corner') {
        obj.width = Math.max(GRID_SIZE, snap(mouseWorldX - obj.x));
      }
      if (resizeHandle === 'bottom' || resizeHandle === 'corner') {
        obj.height = Math.max(GRID_SIZE, snap(mouseWorldY - obj.y));
      }
      render();
    }
    return;
  }

  if (placing) {
    render();
    // Draw preview
    const pw = snap(mouseWorldX) - placeStartX;
    const ph = snap(mouseWorldY) - placeStartY;
    ctx.save();
    ctx.translate(-cameraX, 0);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(placeStartX, placeStartY, pw, ph);
    ctx.restore();
    return;
  }

  // Cursor change for resize handles
  if (currentTool === 'select') {
    const sel = getSelected();
    if (sel) {
      const handle = getResizeHandle(sel, mouseWorldX, mouseWorldY);
      if (handle === 'corner') canvas.style.cursor = 'nwse-resize';
      else if (handle === 'right') canvas.style.cursor = 'ew-resize';
      else if (handle === 'bottom') canvas.style.cursor = 'ns-resize';
      else if (getObjectAt(mouseWorldX, mouseWorldY)) canvas.style.cursor = 'move';
      else canvas.style.cursor = 'default';
    } else {
      canvas.style.cursor = getObjectAt(mouseWorldX, mouseWorldY) ? 'pointer' : 'default';
    }
  } else {
    canvas.style.cursor = 'crosshair';
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (panning) {
    panning = false;
    return;
  }

  if (dragging) {
    dragging = false;
    return;
  }

  if (resizing) {
    resizing = false;
    resizeHandle = null;
    return;
  }

  if (placing && currentTool !== 'select') {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const wx = snap(cx + cameraX);
    const wy = snap(cy);

    let w = wx - placeStartX;
    let h = wy - placeStartY;

    // If just clicked (no drag), use default sizes
    if (Math.abs(w) < GRID_SIZE && Math.abs(h) < GRID_SIZE) {
      const def = DEFAULT_SIZES[currentTool];
      w = def.width;
      h = def.height;
      // Center on click point
      const obj = {
        type: currentTool,
        x: snap(placeStartX - w / 2),
        y: snap(placeStartY - h / 2),
        width: w,
        height: h,
        id: nextId++
      };
      objects.push(obj);
      selectedId = obj.id;
    } else {
      // Dragged to create
      const x = w > 0 ? placeStartX : placeStartX + w;
      const y = h > 0 ? placeStartY : placeStartY + h;
      const obj = {
        type: currentTool,
        x: x,
        y: y,
        width: Math.abs(w),
        height: Math.abs(h),
        id: nextId++
      };
      objects.push(obj);
      selectedId = obj.id;
    }

    placing = false;
    setTool('select');
    updateStatus();
    render();
  }
});

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', e => e.preventDefault());

// === KEYBOARD ===
document.addEventListener('keydown', (e) => {
  // Delete selected
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId !== null) {
    objects = objects.filter(o => o.id !== selectedId);
    selectedId = null;
    updateStatus();
    render();
    e.preventDefault();
    return;
  }

  // Escape deselect
  if (e.key === 'Escape') {
    selectedId = null;
    setTool('select');
    render();
    return;
  }

  // Arrow keys for camera pan
  const panSpeed = 40;
  if (e.key === 'ArrowRight') {
    cameraX = Math.min(levelLength - canvas.width, cameraX + panSpeed);
    statusCamera.textContent = Math.round(cameraX);
    render();
  }
  if (e.key === 'ArrowLeft') {
    cameraX = Math.max(0, cameraX - panSpeed);
    statusCamera.textContent = Math.round(cameraX);
    render();
  }
});

// === SCROLL TO PAN ===
canvas.addEventListener('wheel', (e) => {
  cameraX = Math.max(0, Math.min(levelLength - canvas.width, cameraX + e.deltaX + e.deltaY));
  statusCamera.textContent = Math.round(cameraX);
  render();
  e.preventDefault();
}, { passive: false });

// === RENDER ===
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#24395e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  const startX = Math.floor(cameraX / GRID_SIZE) * GRID_SIZE;
  for (let gx = startX; gx < cameraX + canvas.width + GRID_SIZE; gx += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, canvas.height);
    ctx.stroke();
  }
  for (let gy = 0; gy < canvas.height; gy += GRID_SIZE) {
    ctx.beginPath();
    ctx.moveTo(cameraX, gy);
    ctx.lineTo(cameraX + canvas.width, gy);
    ctx.stroke();
  }

  // Level bounds
  ctx.strokeStyle = 'rgba(233,69,96,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(levelLength, 0);
  ctx.lineTo(levelLength, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Objects
  objects.forEach(obj => {
    drawObject(obj);

    // Selection highlight
    if (obj.id === selectedId) {
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(obj.x - 2, obj.y - 2, obj.width + 4, obj.height + 4);
      ctx.setLineDash([]);

      // Resize handles
      const hs = 6;
      ctx.fillStyle = '#e94560';
      // Right handle
      ctx.fillRect(obj.x + obj.width - hs/2, obj.y + obj.height/2 - hs/2, hs, hs);
      // Bottom handle
      ctx.fillRect(obj.x + obj.width/2 - hs/2, obj.y + obj.height - hs/2, hs, hs);
      // Corner handle
      ctx.fillRect(obj.x + obj.width - hs/2, obj.y + obj.height - hs/2, hs, hs);
    }
  });

  ctx.restore();
}

function drawObject(obj) {
  switch (obj.type) {
    case 'platform':
      if (obj.height >= 100 && grassImg.complete && grassImg.naturalWidth > 0) {
        // Ground platform with textures
        const grassH = 120;
        const grassDrawY = obj.y + 30;
        const tileW = grassH * (grassImg.naturalWidth / grassImg.naturalHeight);

        // Dirt fill
        if (dirtImg.complete && dirtImg.naturalWidth > 0) {
          const dirtStartY = grassDrawY + grassH * 0.55;
          const dirtFillH = canvas.height - dirtStartY;
          const dirtTileH = grassH * 1.5;
          for (let ty = 0; ty < dirtFillH; ty += dirtTileH) {
            const drawH = Math.min(dirtTileH, dirtFillH - ty);
            const srcH = (drawH / dirtTileH) * dirtImg.naturalHeight;
            for (let tx = 0; tx < obj.width; tx += tileW) {
              const drawW = Math.min(tileW, obj.width - tx);
              const srcW2 = (drawW / tileW) * dirtImg.naturalWidth;
              ctx.drawImage(dirtImg, 0, 0, srcW2, srcH, obj.x + tx, dirtStartY + ty, drawW, drawH);
            }
          }
        }

        // Grass on top
        for (let tx = 0; tx < obj.width; tx += tileW) {
          const drawW = Math.min(tileW, obj.width - tx);
          const srcW = (drawW / tileW) * grassImg.naturalWidth;
          ctx.drawImage(grassImg, 0, 0, srcW, grassImg.naturalHeight, obj.x + tx, grassDrawY, drawW, grassH);
        }
      } else {
        // Air platform - green
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      }
      break;

    case 'spike':
      if (skikesImg.complete && skikesImg.naturalWidth > 0) {
        ctx.drawImage(skikesImg, obj.x, obj.y, obj.width, obj.height);
      } else {
        ctx.fillStyle = '#e94560';
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      }
      break;

    case 'coin':
      const shimmer = Math.sin(Date.now() / 200 + obj.x) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 215, 0, ${shimmer})`;
      ctx.beginPath();
      ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;

    case 'winZone':
      ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('WIN', obj.x + obj.width / 2, obj.y + obj.height / 2 + 4);
      break;

    case 'spawn':
      ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      ctx.strokeStyle = '#00c8ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      ctx.fillStyle = '#fff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SPAWN', obj.x + obj.width / 2, obj.y + obj.height / 2 + 4);
      break;
  }

  // Type label
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '10px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(obj.type, obj.x + 2, obj.y - 4);
}

// === STATUS ===
function updateStatus() {
  statusObjects.textContent = objects.length;
}

// === WARNING ===
function showWarning(msg) {
  warningEl.textContent = msg;
  warningEl.classList.add('show');
  setTimeout(() => warningEl.classList.remove('show'), 3000);
}

// === SAVE / LOAD ===
function toLevelJSON() {
  const platforms = objects.filter(o => o.type === 'platform').map(o => ({ x: o.x, y: o.y, width: o.width, height: o.height }));
  const spikes = objects.filter(o => o.type === 'spike').map(o => ({ x: o.x, y: o.y, width: o.width, height: o.height }));
  const coins = objects.filter(o => o.type === 'coin').map(o => ({ x: o.x, y: o.y, width: o.width, height: o.height }));
  const winZones = objects.filter(o => o.type === 'winZone');

  const spawns = objects.filter(o => o.type === 'spawn');

  if (winZones.length === 0) {
    showWarning('Win Zone is missing! Add one before saving.');
    return null;
  }

  const wz = winZones[0];
  const level = {
    length: levelLength,
    platforms,
    spikes,
    coins,
    winZone: { x: wz.x, y: wz.y, width: wz.width, height: wz.height }
  };

  if (spawns.length > 0) {
    level.spawn = { x: spawns[0].x, y: spawns[0].y };
  }

  return level;
}

function saveLevel() {
  const level = toLevelJSON();
  if (!level) return;

  const name = prompt('Level name:', 'Level ' + (getSavedLevels().length + 1));
  if (!name) return;

  const saved = getSavedLevels();
  saved.push({ name, data: level, date: new Date().toISOString() });
  localStorage.setItem('oldFartJumper_editorLevels', JSON.stringify(saved));
  showWarning('Level saved: ' + name);
}

function getSavedLevels() {
  try {
    return JSON.parse(localStorage.getItem('oldFartJumper_editorLevels')) || [];
  } catch (e) {
    return [];
  }
}

function showLoadModal() {
  const list = document.getElementById('loadList');
  const saved = getSavedLevels();
  list.innerHTML = '';

  if (saved.length === 0) {
    list.innerHTML = '<p style="color:#aaa">No saved levels</p>';
  } else {
    saved.forEach((s, i) => {
      const div = document.createElement('div');
      div.className = 'level-item';
      div.textContent = `${s.name} (${new Date(s.date).toLocaleDateString()})`;
      div.onclick = () => { loadLevelData(s.data); closeLoadModal(); };
      list.appendChild(div);
    });
  }

  document.getElementById('loadModal').classList.add('active');
}

function closeLoadModal() {
  document.getElementById('loadModal').classList.remove('active');
}

function loadLevelData(data) {
  objects = [];
  nextId = 1;
  levelLength = data.length || 2000;
  levelLengthInput.value = levelLength;

  (data.platforms || []).forEach(p => {
    objects.push({ type: 'platform', x: p.x, y: p.y, width: p.width, height: p.height, id: nextId++ });
  });
  (data.spikes || []).forEach(s => {
    objects.push({ type: 'spike', x: s.x, y: s.y, width: s.width, height: s.height, id: nextId++ });
  });
  (data.coins || []).forEach(c => {
    objects.push({ type: 'coin', x: c.x, y: c.y, width: c.width, height: c.height, id: nextId++ });
  });
  if (data.winZone) {
    objects.push({ type: 'winZone', x: data.winZone.x, y: data.winZone.y, width: data.winZone.width, height: data.winZone.height, id: nextId++ });
  }
  if (data.spawn) {
    objects.push({ type: 'spawn', x: data.spawn.x, y: data.spawn.y, width: 60, height: 60, id: nextId++ });
  }

  selectedId = null;
  cameraX = 0;
  updateStatus();
  render();
}

// === EXPORT / IMPORT ===
function exportJSON() {
  const level = toLevelJSON();
  if (!level) return;

  const blob = new Blob([JSON.stringify(level, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'level.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.platforms && !data.spikes && !data.coins) {
        showWarning('Invalid level JSON format');
        return;
      }
      loadLevelData(data);
      showWarning('Level imported successfully');
    } catch (err) {
      showWarning('Error parsing JSON file');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// === TRY LEVEL ===
function tryLevel() {
  const level = toLevelJSON();
  if (!level) return;
  // Save editor state so it restores after try
  localStorage.setItem('oldFartJumper_tryLevel', JSON.stringify(level));
  localStorage.setItem('oldFartJumper_editorState', JSON.stringify({ objects, levelLength }));
  location.href = 'game.html?mode=try';
}

// === CLEAR ===
function clearCanvas() {
  if (objects.length === 0) return;
  if (!confirm('Clear all objects?')) return;
  objects = [];
  selectedId = null;
  nextId = 1;
  updateStatus();
  render();
}

// === RESIZE CANVAS TO FIT WRAPPER ===
function resizeCanvas() {
  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;
  const ratio = canvas.width / canvas.height;

  if (w / h > ratio) {
    canvas.style.height = h + 'px';
    canvas.style.width = (h * ratio) + 'px';
  } else {
    canvas.style.width = w + 'px';
    canvas.style.height = (w / ratio) + 'px';
  }

  canvas.style.left = ((w - parseInt(canvas.style.width)) / 2) + 'px';
  canvas.style.top = ((h - parseInt(canvas.style.height)) / 2) + 'px';
}

window.addEventListener('resize', resizeCanvas);

// === ANIMATION LOOP (for coin shimmer) ===
function animLoop() {
  render();
  requestAnimationFrame(animLoop);
}

// === INIT ===
resizeCanvas();

// Restore editor state if returning from try mode
const savedState = localStorage.getItem('oldFartJumper_editorState');
if (savedState) {
  try {
    const state = JSON.parse(savedState);
    objects = state.objects || [];
    levelLength = state.levelLength || 2000;
    levelLengthInput.value = levelLength;
    nextId = objects.reduce((max, o) => Math.max(max, o.id + 1), 1);
  } catch(e) {}
  localStorage.removeItem('oldFartJumper_editorState');
}

updateStatus();
setTool('select');
requestAnimationFrame(animLoop);
