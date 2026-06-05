const SHOP_ITEMS = [
  { id: 'doubleJump', name: 'Double Jump', description: 'Extra skok ve vzduchu', price: 50, type: 'permanent', icon: 'assets/icons/icon_doublejump.png' },
  { id: 'shield',     name: 'Shield',      description: 'Přežiješ 1 kontakt s hrotem', price: 20, type: 'consumable', icon: 'assets/icons/icon_shield.png' },
  { id: 'speedBoost', name: 'Speed Boost', description: 'Rychlejší pohyb o 30%', price: 40, type: 'permanent', icon: 'assets/icons/icon_speed.png' },
  { id: 'dash',       name: 'Dash',        description: '1 dash za každý skok', price: 30, type: 'permanent', icon: 'assets/icons/icon_dash.png' },
  { id: 'magnet',     name: 'Magnet',      description: 'Přitahuje okolní piva', price: 80, type: 'permanent', icon: 'assets/icons/icon_magnet.png' }
];

function getSave() {
  try { return JSON.parse(sessionStorage.getItem('oldFartJumper_save')) || { coins: 0, items: [] }; }
  catch(e) { return { coins: 0, items: [] }; }
}
function setSave(data) {
  sessionStorage.setItem('oldFartJumper_save', JSON.stringify(data));
}

const shopGrid = document.getElementById('shopGrid');
const coinBalance = document.getElementById('coinBalance');

const isTesterShop = new URLSearchParams(window.location.search).get('tester') === '1';
if (isTesterShop) SHOP_ITEMS.forEach(item => item.price = 0);

function renderShop() {
  const save = getSave();
  coinBalance.innerHTML = `<img src="assets/ui/beer_coin.png" style="width:22px;height:22px;image-rendering:pixelated;"> ${save.coins}`;
  shopGrid.innerHTML = '';

  SHOP_ITEMS.forEach(item => {
    const owned = item.type === 'permanent' && save.items.includes(item.id);
    const canAfford = save.coins >= item.price;
    const shieldCount = item.id === 'shield' ? save.items.filter(i => i === 'shield').length : 0;

    const card = document.createElement('div');
    card.className = 'shop-card' + (owned ? ' owned' : '');

    let actionHtml;
    if (owned) {
      actionHtml = `<div class="shop-owned-badge">&#10003; Vlastníš</div>`;
    } else {
      const label = item.type === 'consumable' && shieldCount > 0
        ? `Koupit (${shieldCount}x)`
        : `Koupit`;
      actionHtml = `
        <button class="shop-buy-btn" ${!canAfford ? 'disabled' : ''} data-id="${item.id}">${label}</button>
        <div class="shop-msg">${!canAfford ? 'Málo piv' : ''}</div>
      `;
    }

    card.innerHTML = `
      <img src="${item.icon}" class="shop-card-icon" alt="${item.name}">
      <div class="shop-card-name">${item.name}</div>
      <div class="shop-card-desc">${item.description}</div>
      <div class="shop-card-price">
        <img src="assets/ui/beer_coin.png" style="width:16px;height:16px;image-rendering:pixelated;"> ${item.price}
      </div>
      ${actionHtml}
    `;

    shopGrid.appendChild(card);
  });

  document.querySelectorAll('.shop-buy-btn').forEach(btn => {
    btn.addEventListener('click', () => buyItem(btn.dataset.id));
  });
}

function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  const save = getSave();
  if (save.coins < item.price) return;
  if (item.type === 'permanent' && save.items.includes(itemId)) return;
  save.coins -= item.price;
  save.items.push(itemId);
  setSave(save);
  renderShop();
}

renderShop();
