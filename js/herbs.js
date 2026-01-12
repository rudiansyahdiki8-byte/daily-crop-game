// js/herbs.js
// Updated based on Economy Rules: 40-10-10-40 Principle
const HerbData = {
    // COMMON (Chance 50% | Time 3m | Price 20-50)
    ginger:      { name: 'Ginger', time: 180, img: 'https://img.icons8.com/color/96/ginger.png', minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'Common' },
    turmeric:    { name: 'Turmeric', time: 180, img: 'https://img.icons8.com/color/96/turmeric.png', minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'Common' },
    galangal:    { name: 'Galangal', time: 180, img: 'https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-ginger-vegetables-flaticons-flat-flat-icons-2.png', minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'Common' },
    lemongrass:  { name: 'Lemongrass', time: 180, img: 'https://img.icons8.com/color/96/lemongrass.png', minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'Common' },
    cassava:     { name: 'Cassava', time: 180, img: 'https://img.icons8.com/color/96/cassava.png', minPrice: 20, maxPrice: 50, chance: 10.0, rarity: 'Common' },

    // UNCOMMON (Chance 30% | Time 4m | Price 50-100)
    chili:       { name: 'Red Chili', time: 240, img: 'https://img.icons8.com/color/96/chili-pepper.png', minPrice: 50, maxPrice: 100, chance: 6.0, rarity: 'Uncommon' },
    pepper:      { name: 'Pepper', time: 240, img: 'https://img.icons8.com/color/96/pepper-shaker.png', minPrice: 50, maxPrice: 100, chance: 6.0, rarity: 'Uncommon' },
    onion:       { name: 'Onion', time: 240, img: 'https://img.icons8.com/color/96/onion.png', minPrice: 50, maxPrice: 100, chance: 6.0, rarity: 'Uncommon' },
    garlic:      { name: 'White Garlic', time: 240, img: 'https://img.icons8.com/color/96/garlic.png', minPrice: 50, maxPrice: 100, chance: 6.0, rarity: 'Uncommon' },
    paprika:     { name: 'Paprika', time: 240, img: 'https://img.icons8.com/color/96/paprika.png', minPrice: 50, maxPrice: 100, chance: 6.0, rarity: 'Uncommon' },

    // RARE (Chance 15% | Time 5m | Price 120-250)
    aloeVera:    { name: 'Aloe Vera', time: 300, img: 'https://img.icons8.com/external-flaticons-lineal-color-flat-icons/64/external-aloe-vera-plants-flaticons-lineal-color-flat-icons.png', minPrice: 120, maxPrice: 250, chance: 3.0, rarity: 'Rare' },
    mint:        { name: 'Mint Leaf', time: 300, img: 'https://img.icons8.com/color/96/mint.png', minPrice: 120, maxPrice: 250, chance: 3.0, rarity: 'Rare' },
    lavender:    { name: 'Lavender', time: 300, img: 'https://img.icons8.com/color/96/lavender.png', minPrice: 120, maxPrice: 250, chance: 3.0, rarity: 'Rare' },
    stevia:      { name: 'Stevia', time: 300, img: 'https://img.icons8.com/color/96/tea-plant.png', minPrice: 120, maxPrice: 250, chance: 3.0, rarity: 'Rare' },
    basil:       { name: 'Basil', time: 300, img: 'https://img.icons8.com/color/96/basil.png', minPrice: 120, maxPrice: 250, chance: 3.0, rarity: 'Rare' },

    // EPIC (Chance 4% | Time 6m | Price 400-800)
    cinnamon:    { name: 'Cinnamon', time: 360, img: 'https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-cinnamon-coffee-flaticons-flat-flat-icons.png', minPrice: 400, maxPrice: 800, chance: 1.0, rarity: 'Epic' },
    nutmeg:      { name: 'Nutmeg', time: 360, img: 'https://img.icons8.com/color/96/nutmeg.png', minPrice: 400, maxPrice: 800, chance: 1.0, rarity: 'Epic' },
    cardamom:    { name: 'Cardamom', time: 360, img: 'https://img.icons8.com/color/96/waffle.png', minPrice: 400, maxPrice: 800, chance: 1.0, rarity: 'Epic' },
    clove:       { name: 'Clove', time: 360, img: 'https://img.icons8.com/color/96/clove.png', minPrice: 400, maxPrice: 800, chance: 1.0, rarity: 'Epic' },

    // LEGENDARY (Chance 1% | Time 10m | Price 2.000-8.000)
    vanilla:     { name: 'Vanilla', time: 600, img: 'https://img.icons8.com/color/96/vanilla.png', minPrice: 2000, maxPrice: 8000, chance: 0.5, rarity: 'Legendary' },
    saffron:     { name: 'Saffron', time: 600, img: 'https://img.icons8.com/color/96/saffron.png', minPrice: 2000, maxPrice: 8000, chance: 0.5, rarity: 'Legendary' }
};
window.HerbData = HerbData;