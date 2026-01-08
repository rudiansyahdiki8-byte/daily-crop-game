// ui.js
// UI navigation & tab handling

function switchTab(id, btn) {
  document.querySelectorAll('.tab-content')
    .forEach(t => t.classList.remove('active'));
function updateInventoryUI() {
  document.getElementById('inv-leaf').innerText = State.inventory.leaf;
}

  document.getElementById(id)?.classList.add('active');

  document.querySelectorAll('nav button').forEach(b => {
    b.classList.remove('text-emerald-500');
    b.classList.add('text-gray-500');
  });

  btn.classList.add('text-emerald-500');
  btn.classList.remove('text-gray-500');
}

