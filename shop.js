// SHOP ITEMS CATALOG (same as in script.js)
const SHOP_ITEMS = [
  { id: 'doubleJump', name: 'Double Jump', description: 'Skok ve vzduchu', price: 50, type: 'permanent' },
  { id: 'shield', name: 'Shield', description: 'Prezije 1 naraz do spiku', price: 20, type: 'consumable' },
  { id: 'speedBoost', name: 'Speed Boost', description: 'Rychlejsi pohyb o 30%', price: 40, type: 'permanent' },
  { id: 'dash', name: 'Dash', description: '1 dash za skok', price: 30, type: 'permanent' },
  { id: 'magnet', name: 'Magnet', description: 'Pritahuje mince', price: 80, type: 'permanent' }
];

// SAVE/LOAD (bez persistentního ukládání — vždy začíná od nuly)
let _memSave = { coins: 0, items: [] };
function getSave() {
  return _memSave;
}
function setSave(data) {
  _memSave = data;
}

const shopGrid = document.getElementById('shopGrid');
const coinBalance = document.getElementById('coinBalance');

// Tester mode — everything is free
const isTesterShop = new URLSearchParams(window.location.search).get('tester') === '1';

if (isTesterShop) {
  SHOP_ITEMS.forEach(item => item.price = 0);
}

function renderShop() {
  const save = getSave();
  coinBalance.innerText = `Coins: ${save.coins}`;
  shopGrid.innerHTML = '';

  SHOP_ITEMS.forEach(item => {
    const owned = item.type === 'permanent' && save.items.includes(item.id);
    const canAfford = save.coins >= item.price;
    const shieldCount = item.id === 'shield' ? save.items.filter(i => i === 'shield').length : 0;

    const card = document.createElement('div');
    card.className = 'shopItem' + (owned ? ' owned' : '');

    let buttonHtml;
    if (owned) {
      buttonHtml = `<div class="ownedBadge">Vlastnis</div>`;
    } else {
      const label = item.type === 'consumable' && shieldCount > 0
        ? `Koupit (mas: ${shieldCount})`
        : `Koupit - ${item.price}`;
      buttonHtml = `<button class="buyBtn" ${!canAfford ? 'disabled' : ''} data-id="${item.id}">${label}</button>`;
      if (!canAfford) {
        buttonHtml += `<div class="shopMsg">Nedostatek minci</div>`;
      }
    }

    card.innerHTML = `
      <h3>${item.name}</h3>
      <div class="desc">${item.description}</div>
      <div class="price">${item.price} minci</div>
      ${buttonHtml}
    `;

    shopGrid.appendChild(card);
  });

  // Buy button handlers
  document.querySelectorAll('.buyBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      buyItem(itemId);
    });
  });
}

function buyItem(itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  const save = getSave();
  if (save.coins < item.price) return;

  // Permanent items: only buy once
  if (item.type === 'permanent' && save.items.includes(itemId)) return;

  save.coins -= item.price;
  save.items.push(itemId);
  setSave(save);
  renderShop();
}

renderShop();
