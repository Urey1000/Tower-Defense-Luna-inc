// ==========================================================================
// GLOBALS.JS - VARIABEL PUSAT GAME (DIDEKLARASIKAN SECARA GLOBAL ABSOLUT)
// ==========================================================================

// 1. Status Utama Game
window.Game = {
    // Menggunakan currentMode global jika ada, jika tidak fallback ke localStorage
    mode: window.currentMode || localStorage.getItem("gameMode") || "normal",
    hp: 20,    // Nilai default (akan ditimpa oleh config.js saat inisialisasi)
    gold: 150, // Nilai default (akan ditimpa oleh config.js saat inisialisasi)
    wave: 1,
    pause: false
};

// 2. Setup Canvas & Context
window.canvas = document.getElementById("gameCanvas");
window.ctx = window.canvas ? window.canvas.getContext("2d") : null;

if (window.canvas) {
    window.canvas.width = 1080;
    window.canvas.height = 1440;
}

// 3. Interaksi Mouse & Preview Tower
window.mouseX = -100;
window.mouseY = -100;
window.mouse = { x: 0, y: 0 }; 

window.previewX = -100;
window.previewY = -100;
window.previewAlpha = 0;
window.previewType = null;
window.isPlacing = false;
window.canPlace = false;
window.previewRadius = 150;
window.previewAlphaDir = -0.02;

// 4. State Pemilihan Tower
window.selectedTower = null; 
window.selectedPlacedTower = null;

// 5. Array Penyimpanan Objek Entitas Game
window.towers = [];
window.enemies = [];
window.projectiles = [];
window.explosions = [];

// 6. Variabel Waktu/Frame
window.frameCount = 0;
