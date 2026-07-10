// ==========================================================================
// PLACEMENT.JS - SISTEM TATA LETAK & PREVIEW TOWER (FIXED)
// ==========================================================================

function isValidPlacement(x, y) {
    const towerRadius = 45; 
    
    // 1. Cek tabrakan dengan tower yang sudah ada di array global
    for (let t of window.towers) {
        if (Math.hypot(t.x - x, t.y - y) < (towerRadius + 45)) return false;
    }

    // 2. Cek tabrakan dengan jalur musuh (menggunakan PATH global dari config.js)
    if (typeof window.PATH !== 'undefined') {
        for (let i = 0; i < window.PATH.length - 1; i++) {
            let p1 = window.PATH[i], p2 = window.PATH[i + 1];
            let A = x - p1.x, B = y - p1.y;
            let C = p2.x - p1.x, D = p2.y - p1.y;
            let dot = A * C + B * D, len_sq = C * C + D * D;
            let param = -1, xx, yy;
            
            if (len_sq !== 0) param = dot / len_sq;
            
            if (param < 0) { xx = p1.x; yy = p1.y; }
            else if (param > 1) { xx = p2.x; yy = p2.y; }
            else { xx = p1.x + param * C; yy = p1.y + param * D; }
            
            if (Math.hypot(x - xx, y - yy) < 65) return false; 
        }
    }
    
    return true;
}

function updatePreviewPhysics() {
    // Jika tidak ada tower yang dipilih, jangan kalkulasi physics preview
    if (!window.selectedTower) return;

    let data = window.TOWER_DATA[window.selectedTower];
    if (!data) return;

    // Easing pergerakan preview mengikuti kursor mouse
    window.previewX += (window.mouseX - window.previewX) * 0.18;
    window.previewY += (window.mouseY - window.previewY) * 0.18;

    window.previewRadius = data.range;
}

function drawPlacementPreview() {
    // Cek apakah ada tower yang sedang dipilih
    if (!window.selectedTower) return;

    let data = window.TOWER_DATA[window.selectedTower];
    if (!data) return;

    let imgName = `tower_${window.selectedTower}1`;
    let img = (typeof images !== 'undefined') ? images[imgName] : null;

    // Cek validitas posisi untuk warna lingkaran range
    let canPlace = isValidPlacement(window.previewX, window.previewY);

    window.ctx.save();

    // 1. Gambar Lingkaran Jangkauan (Range)
    window.ctx.beginPath();
    window.ctx.arc(window.previewX, window.previewY, data.range, 0, Math.PI * 2);
    window.ctx.fillStyle = canPlace ? "rgba(116, 195, 101, 0.2)" : "rgba(255, 77, 77, 0.2)";
    window.ctx.fill();
    window.ctx.strokeStyle = canPlace ? "rgba(116, 195, 101, 0.5)" : "rgba(255, 77, 77, 0.5)";
    window.ctx.lineWidth = 3;
    window.ctx.stroke();

    // 2. Gambar Ikon/Aset Tower Mengikuti Mouse
    window.ctx.globalAlpha = 0.8;
    if (img && img.complete) {
        window.ctx.drawImage(img, window.previewX - 50, window.previewY - 50, 100, 100);
    } else {
        // Fallback jika gambar belum loading atau tidak ditemukan
        window.ctx.fillStyle = data.color || "#ccc";
        window.ctx.beginPath();
        window.ctx.arc(window.previewX, window.previewY, 35, 0, Math.PI * 2);
        window.ctx.fill();
        window.ctx.fillStyle = "white";
        window.ctx.font = "30px 'Fredoka One'";
        window.ctx.textAlign = "center";
        window.ctx.textBaseline = "middle";
        window.ctx.fillText(data.icon || "?", window.previewX, window.previewY);
    }

    window.ctx.restore();
}
