// ==========================================================================
// CONFIG.JS - PENGATURAN DATA STATIS & CENTRAL DATA (WAJIB SATU SUMBER)
// ==========================================================================

// 1. Pengaturan Tingkat Kesulitan (Game Mode)
var currentMode = localStorage.getItem("gameMode") || "normal";

// Logika untuk mengatur status awal Game (HP & Gold) berdasarkan kesulitan
if (currentMode === "easy") {
    window.STARTING_HP = 30;
    window.STARTING_GOLD = 250;
} else if (currentMode === "hard") {
    window.STARTING_HP = 10;
    window.STARTING_GOLD = 100;
} else {
    // Mode Normal (Default)
    window.STARTING_HP = 20;
    window.STARTING_GOLD = 150;
}

// 2. Jalur musuh dari titik awal ke markas
window.path = [
    { x: -50, y: 150 }, { x: 180, y: 220 }, { x: 400, y: 230 },   
    { x: 600, y: 180 }, { x: 750, y: 220 }, { x: 820, y: 320 },   
    { x: 750, y: 400 }, { x: 550, y: 450 }, { x: 250, y: 480 },
    { x: 150, y: 550 }, { x: 220, y: 680 }, { x: 400, y: 780 },   
    { x: 580, y: 830 }, { x: 780, y: 820 }, { x: 880, y: 920 },   
    { x: 800, y: 1020 },{ x: 500, y: 1080 },{ x: 220, y: 1120 },
    { x: 150, y: 1250 },{ x: 350, y: 1350 },{ x: 650, y: 1320 },
    { x: 800, y: 1250 },{ x: 900, y: 1250 }   
];

// 3. Daftar Tipe Tower
window.TOWER_TYPES = ["panah", "bomb", "ice", "lightning", "poison", "magic"];

// 4. Data statistik dasar untuk Tower (Damage, Jangkauan, Harga Beli, Harga Upgrade)
window.TOWER_DATA = {
    panah:     { damage: 20, range: 150, fireRate: 45, cost: 50,  upgradeCost: 50,  color: "#a0522d", icon: "🏹" },
    bomb:      { damage: 50, range: 120, fireRate: 90, cost: 80,  upgradeCost: 80,  color: "#555",    icon: "💣" },
    ice:       { damage: 10, range: 140, fireRate: 30, cost: 70,  upgradeCost: 70,  color: "#00bfff", icon: "❄️" },
    lightning: { damage: 30, range: 200, fireRate: 60, cost: 100, upgradeCost: 100, color: "#ffd700", icon: "⚡" },
    poison:    { damage: 5,  range: 130, fireRate: 20, cost: 60,  upgradeCost: 60,  color: "#32cd32", icon: "🧪" },
    magic:     { damage: 40, range: 160, fireRate: 50, cost: 90,  upgradeCost: 90,  color: "#9370db", icon: "🔮" }
};

// 5. Data Gelombang Musuh (Waves)
window.WAVES = {
    easy: [
        { type: "skeleton", count: 5, delay: 60 },
        { type: "troll", count: 3, delay: 80 },
        { type: "goblin", count: 6, delay: 50 },
        { type: "wolf", count: 5, delay: 40 },
        { type: "mage", count: 3, delay: 90 },
        { type: "boss", count: 1, delay: 120 },
        { type: "dragon", count: 1, delay: 150 }
    ],

    normal: [
        { type: "skeleton", count: 8, delay: 50 },
        { type: "troll", count: 5, delay: 70 },
        { type: "goblin", count: 10, delay: 40 },
        { type: "wolf", count: 8, delay: 30 },
        { type: "mage", count: 5, delay: 70 },
        { type: "boss", count: 2, delay: 100 },
        { type: "dragon", count: 2, delay: 120 }
    ],

    hard: [
        { type: "skeleton", count: 12, delay: 40 },
        { type: "troll", count: 8, delay: 60 },
        { type: "goblin", count: 15, delay: 30 },
        { type: "wolf", count: 12, delay: 25 },
        { type: "mage", count: 8, delay: 60 },
        { type: "boss", count: 3, delay: 90 },
        { type: "dragon", count: 3, delay: 100 }
    ]
};
