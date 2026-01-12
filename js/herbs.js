// js/herbs.js
const HerbData = {
    // COMMON (L1 CACHE)
    ginger:      { name: 'Alpha Fragment', time: 3, img: 'https://img.icons8.com/nolan/96/usb-memory.png', minPrice: 20, maxPrice: 35, chance: 10.0, rarity: 'L1 Cache' },
    turmeric:    { name: 'Beta Sector', time: 4, img: 'https://img.icons8.com/nolan/96/data-configuration.png', minPrice: 22, maxPrice: 38, chance: 10.0, rarity: 'L1 Cache' },
    galangal:    { name: 'Delta Node', time: 5, img: 'https://img.icons8.com/nolan/96/database.png', minPrice: 25, maxPrice: 40, chance: 10.0, rarity: 'L1 Cache' },
    lemongrass:  { name: 'Gamma Link', time: 6, img: 'https://img.icons8.com/nolan/96/external-link.png', minPrice: 28, maxPrice: 45, chance: 10.0, rarity: 'L1 Cache' },
    cassava:     { name: 'Z-Packet', time: 8, img: 'https://img.icons8.com/nolan/96/archive.png', minPrice: 30, maxPrice: 50, chance: 10.0, rarity: 'L1 Cache' },

    // UNCOMMON (ENCRYPTED)
    chili:       { name: 'Thermal Bypass', time: 15, img: 'https://img.icons8.com/nolan/96/integrated-circuit.png', minPrice: 50, maxPrice: 80, chance: 6.0, rarity: 'Encrypted' },
    pepper:      { name: 'Logic Core', time: 20, img: 'https://img.icons8.com/nolan/96/processor.png', minPrice: 55, maxPrice: 85, chance: 6.0, rarity: 'Encrypted' },
    onion:       { name: 'Pulse Module', time: 25, img: 'https://img.icons8.com/nolan/96/activity.png', minPrice: 60, maxPrice: 90, chance: 6.0, rarity: 'Encrypted' },
    garlic:      { name: 'Static Shield', time: 28, img: 'https://img.icons8.com/nolan/96/shield.png', minPrice: 65, maxPrice: 95, chance: 6.0, rarity: 'Encrypted' },
    paprika:     { name: 'Bitstream Red', time: 30, img: 'https://img.icons8.com/nolan/96/flow-chart.png', minPrice: 70, maxPrice: 100, chance: 6.0, rarity: 'Encrypted' },

    // RARE (MAINFRAME)
    aloeVera:    { name: 'Neural Link', time: 60, img: 'https://img.icons8.com/nolan/96/brainstorming.png', minPrice: 120, maxPrice: 180, chance: 3.0, rarity: 'Mainframe' },
    mint:        { name: 'Coolant Cell', time: 75, img: 'https://img.icons8.com/nolan/96/cooling-system.png', minPrice: 130, maxPrice: 190, chance: 3.0, rarity: 'Mainframe' },
    lavender:    { name: 'Nano Synth', time: 90, img: 'https://img.icons8.com/nolan/96/biotech.png', minPrice: 150, maxPrice: 220, chance: 3.0, rarity: 'Mainframe' },
    stevia:      { name: 'Data Crystal', time: 100, img: 'https://img.icons8.com/nolan/96/diamond.png', minPrice: 160, maxPrice: 240, chance: 3.0, rarity: 'Mainframe' },
    basil:       { name: 'Cyber Trunk', time: 120, img: 'https://img.icons8.com/nolan/96/root-server.png', minPrice: 170, maxPrice: 250, chance: 3.0, rarity: 'Mainframe' },

    // EPIC (BLACK OPS)
    cinnamon:    { name: 'Ghost Protocol', time: 300, img: 'https://img.icons8.com/nolan/96/incognito.png', minPrice: 400, maxPrice: 600, chance: 1.0, rarity: 'Black Ops' },
    nutmeg:      { name: 'Void Kernel', time: 400, img: 'https://img.icons8.com/nolan/96/hole.png', minPrice: 450, maxPrice: 650, chance: 1.0, rarity: 'Black Ops' },
    cardamom:    { name: 'Uplink Matrix', time: 500, img: 'https://img.icons8.com/nolan/96/grid.png', minPrice: 500, maxPrice: 700, chance: 1.0, rarity: 'Black Ops' },
    clove:       { name: 'Deep Proxy', time: 600, img: 'https://img.icons8.com/nolan/96/vpn.png', minPrice: 550, maxPrice: 800, chance: 1.0, rarity: 'Black Ops' },

    // LEGENDARY (GOD TIER)
    vanilla:     { name: 'Singularity', time: 1800, img: 'https://img.icons8.com/nolan/96/infinity.png', minPrice: 2000, maxPrice: 3500, chance: 0.5, rarity: 'God Tier' },
    saffron:     { name: 'Zenith Protocol', time: 3600, img: 'https://img.icons8.com/nolan/96/crown.png', minPrice: 5000, maxPrice: 8000, chance: 0.5, rarity: 'God Tier' }
};

window.HerbData = HerbData;