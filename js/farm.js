// farm.js
// Farming system logic (PHASE 1)

function renderFarm() {
  const grid = document.getElementById('garden-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div onclick="harvest()"
      class="glass aspect-square rounded-[2.5rem] flex flex-col items-center justify-center border-b-4 border-emerald-500 btn-press">
      <span class="text-4xl mb-2">🥬</span>
      <span class="text-[8px] font-black text-emerald-400 uppercase">Harvest (Ads)</span>
    </div>
  `;

  for (let i = 0; i < 3; i++) {
    grid.innerHTML += `
      <div class="glass aspect-square rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-white/5 opacity-20">
        <i class="fas fa-lock text-xl text-gray-600"></i>
      </div>
    `;
  }
}

function harvest() {
  State.inventory.leaf = (State.inventory.leaf || 0) + 1;
  updateInventoryUI();
}

