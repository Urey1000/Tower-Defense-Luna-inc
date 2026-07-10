// ==========================================================================
// UI.JS - USER INTERFACE & EVENT LISTENERS
// ==========================================================================

function showNotification(message) {
    let notif = document.createElement("div");
    notif.className = "game-notif";
    notif.innerText = message;
    
    Object.assign(notif.style, {
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        background: '#ff4d4d', color: 'white', padding: '10px 20px',
        borderRadius: '8px', border: '3px solid white', zIndex: 9999, fontWeight: 'bold'
    });
    
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000); 
}

function updateHUD() {
    const goldEl = document.getElementById("gold-display");
    const hpEl = document.getElementById("hp-display");
    const waveEl = document.getElementById("wave-display");
    
    if (goldEl) goldEl.innerText = window.Game.gold;
    if (hpEl) hpEl.innerText = window.Game.hp;
    if (waveEl) waveEl.innerText = window.Game.wave;
}

function getTowerData(type) {
    return window.TOWER_DATA ? window.TOWER_DATA[type] : null;
}

// ==========================================================================
// FUNGSI PEMILIHAN TOWER (Dipanggil via onclick di HTML)
// ==========================================================================
function selectTower(type) {
    let data = window.TOWER_DATA[type];
    if (!data) return;

    // 🔴 CEK GOLD DULU SEBELUM MASUK MODE PLACING
    if (window.Game.gold < data.cost) {
        showNotification("💰 Gold tidak cukup!");
        return; // STOP → Gak masuk mode placing
    }

    // ✅ BARU AKTIFKAN PREVIEW JIKA UANG CUKUP
    window.selectedTower = type;
}

// ==========================================================================
// BATALKAN PILIHAN TOWER JIKA KLIK KANAN
// ==========================================================================
document.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // Mencegah menu konteks browser muncul
    window.selectedTower = null; 
});

// ==========================================================================
// KONTROL CANVAS & INTERAKSI MOUSE
// ==========================================================================
let activeCanvas = window.canvas || document.getElementById("gameCanvas");

if (activeCanvas) {
    activeCanvas.addEventListener("mousemove", (e) => {
        let rect = activeCanvas.getBoundingClientRect();
        window.mouseX = (e.clientX - rect.left) * (activeCanvas.width / rect.width);
        window.mouseY = (e.clientY - rect.top) * (activeCanvas.height / rect.height);
    });

    activeCanvas.addEventListener("click", (e) => {
        const upgradeMenu = document.getElementById("upgrade-menu");
        
        // -----------------------------------------------------------
        // 1. MODE PENEMPATAN TOWER (Menggunakan Logika FIX TOTAL)
        // -----------------------------------------------------------
        if (window.selectedTower) {
            let data = getTowerData(window.selectedTower);
            
            if (!data) {
                window.selectedTower = null;
                return;
            }

            // Validasi Posisi
            if (!isValidPlacement(window.previewX, window.previewY)) {
                showNotification("⚠️ Posisi Tidak Valid!");
                // 🔥 RESET BIAR BALIK NORMAL
                window.selectedTower = null;
                return;
            }

            // Validasi Uang (Gold) - Perlindungan Ganda
            if (window.Game.gold < data.cost) {
                showNotification("💰 Gold tidak cukup!");
                // 🔥 RESET
                window.selectedTower = null;
                return;
            }

            // ✅ PLACE TOWER
            window.Game.gold -= data.cost;
            window.towers.push(new Tower(window.previewX, window.previewY, window.selectedTower));

            // RESET STATE
            window.selectedTower = null;
            updateHUD();
            if (typeof playSound === 'function') playSound("notif");
            
            return; // HENTIKAN EKSEKUSI (Jangan buka menu upgrade)
        }

        // -----------------------------------------------------------
        // 2. MODE UPGRADE (Berjalan jika tidak sedang menempatkan tower)
        // -----------------------------------------------------------
        if (!window.towers) return;

        let clickedTower = window.towers.find(t => Math.hypot(t.x - window.mouseX, t.y - window.mouseY) < t.radius);
        
        if (clickedTower && upgradeMenu) {
            window.selectedPlacedTower = clickedTower;
            upgradeMenu.style.display = "block";
            upgradeMenu.style.left = e.clientX + "px";
            upgradeMenu.style.top = e.clientY + "px";
            if (typeof playSound === 'function') playSound("notif");
            
        } else if (upgradeMenu) {
            upgradeMenu.style.display = "none";
            window.selectedPlacedTower = null;
        }
    });
}

// ==========================================================================
// TOMBOL UPGRADE TOWER
// ==========================================================================
const btnUpgrade = document.getElementById("btn-upgrade");
if (btnUpgrade) {
    btnUpgrade.addEventListener("click", () => {
        if (window.selectedPlacedTower) {
            if (window.selectedPlacedTower.upgrade()) {
                updateHUD();
                document.getElementById("upgrade-menu").style.display = "none";
                window.selectedPlacedTower = null;
                if (typeof playSound === 'function') playSound("notif");
            } else {
                if (window.selectedPlacedTower.level >= 3) {
                    showNotification("⬆️ Tower Max Level!");
                } else {
                    showNotification("💰 Gold tidak cukup!");
                }
            }
        }
    });
}
