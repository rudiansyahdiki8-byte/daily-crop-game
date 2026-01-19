// js/herbs.js
// DATA VISUAL TANAMAN (GAMBAR & NAMA)
// Logic Harga & Waktu diambil dari Window.GameConfig (yang di-load dari server)

const HerbAssets = {
    // COMMON
    ginger:      { name: 'Ginger', img: 'https://img.icons8.com/color/96/ginger.png', rarity: 'Common' },
    turmeric:    { name: 'Turmeric', img: 'https://img.icons8.com/external-colored-outline-lafs/64/external-turmeric-flavors-colored-outline-part-3-colored-outline-lafs-2.png', rarity: 'Common' },
    galangal:    { name: 'Galangal', img: 'https://img.icons8.com/external-others-pike-picture/50/external-Ginger-aromatherapy-others-pike-picture.png', rarity: 'Common' },
    lemongrass:  { name: 'Lemongrass', img: 'https://img.icons8.com/external-ddara-lineal-color-ddara/64/external-lemongrass-natural-scent-ddara-lineal-color-ddara.png', rarity: 'Common' },
    cassava:     { name: 'Cassava', img: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-yucca-world-cuisine-flaticons-lineal-color-flat-icons.png', rarity: 'Common' },

    // UNCOMMON
    chili:       { name: 'Red Chili', img: 'https://img.icons8.com/color/96/chili-pepper.png', rarity: 'Uncommon' },
    pepper:      { name: 'Pepper', img: 'https://img.icons8.com/doodle/48/paprika--v1.png', rarity: 'Uncommon' },
    onion:       { name: 'Onion', img: 'https://img.icons8.com/color/96/onion.png', rarity: 'Uncommon' },
    garlic:      { name: 'White Garlic', img: 'https://img.icons8.com/color/96/garlic.png', rarity: 'Uncommon' },
    paprika:     { name: 'Paprika', img: 'https://img.icons8.com/color/96/paprika.png', rarity: 'Uncommon' },

    // RARE
    aloeVera:    { name: 'Aloe Vera', img: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-aloe-vera-plants-flaticons-lineal-color-flat-icons.png', rarity: 'Rare' },
    mint:        { name: 'Mint Leaf', img: 'https://img.icons8.com/color/96/mint.png', rarity: 'Rare' },
    lavender:    { name: 'Lavender', img: 'https://img.icons8.com/color/96/lavender.png', rarity: 'Rare' },
    stevia:      { name: 'Stevia', img: 'https://img.icons8.com/dusk/64/leaf.png', rarity: 'Rare' },
    basil:       { name: 'Basil', img: 'https://img.icons8.com/color/96/basil.png', rarity: 'Rare' },

    // EPIC
    cinnamon:    { name: 'Cinnamon', img: 'https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-cinnamon-coffee-flaticons-flat-flat-icons.png', rarity: 'Epic' },
    nutmeg:      { name: 'Nutmeg', img: 'https://img.icons8.com/color/96/nutmeg.png', rarity: 'Epic' },
    cardamom:    { name: 'Cardamom', img: 'https://img.icons8.com/external-others-pike-picture/50/external-Cardamom-aromatherapy-others-pike-picture.png', rarity: 'Epic' },
    clove:       { name: 'Clove', img: 'https://img.icons8.com/arcade/64/cloves.png', rarity: 'Epic' },

    // LEGENDARY
    vanilla:     { name: 'Vanilla', img: 'https://img.icons8.com/external-ddara-lineal-color-ddara/64/external-vanilla-natural-scent-ddara-lineal-color-ddara.png', rarity: 'Legendary' },
    saffron:     { name: 'Saffron', img: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-saffron-world-cuisine-flaticons-lineal-color-flat-icons-2.png', rarity: 'Legendary' }
};

// Container Data Global (Awalnya Kosong)
window.HerbData = {};

function initHerbData() {
    // Cek apakah Config Server sudah masuk?
    if (!window.GameConfig || !window.GameConfig.Crops) {
        console.warn("[HERBS] Config Server belum siap. Menunggu...");
        return; 
    }

    console.log("[HERBS] Menggabungkan Aset Visual dengan Config Server...");
    
    for (const key in HerbAssets) {
        const configData = window.GameConfig.Crops[key];
        
        if (configData) {
            window.HerbData[key] = {
                ...HerbAssets[key], // Ambil nama & img dari sini (Frontend)
                ...configData       // Ambil time, price, chance dari Server (Backend)
            };
        } else {
            // Fallback aman jika config server macet
            window.HerbData[key] = { ...HerbAssets[key], time: 0, minPrice: 0 };
        }
    }
    
    console.log("[HERBS] Data Tanaman Siap Digunakan!");
}

// 1. Coba init langsung (Jika config kebetulan sudah ada di cache browser)
initHerbData();

// 2. Dengarkan Event 'ConfigLoaded' yang dikirim oleh file config.js
window.addEventListener('ConfigLoaded', initHerbData);
