// ==========================================================================
// TOWER.JS - LOGIKA MENARA PERTAHANAN (ANTI CRASH, SPESIAL EFEK & SMART AI)
// ==========================================================================

class Tower {
    constructor(x, y, type) {
        // 1. PROTEKSI UTAMA: Validasi global data sebelum inisialisasi jauh
        const globalDataExists = typeof window.TOWER_DATA !== 'undefined' && window.TOWER_DATA[type];
        
        if (!globalDataExists) {
            console.error("❌ CRASH PREVENTED: Tipe tower tidak valid atau TOWER_DATA rusak:", type);
            
            this.active = false; 
            this.data = { damage: 0, range: 0, fireRate: 999, upgradeCost: 999, color: "#000", icon: "❌" };
            return; 
        }

        this.x = x;
        this.y = y;
        this.type = type;
        this.level = 1;
        this.active = true;

        this.data = { ...window.TOWER_DATA[type] };
        
        this.radius = 35;
        this.scale = 0; 
        this.isSpawning = true;
        this.cooldown = 0;
        
        // Arah hadap awal
        this.angle = 0; 
        
        this.maxHp = 100;
        this.hp = this.maxHp;

        // 🔥 STATUS EFEK: Terbakar (Burn)
        this.burnTime = 0;
        this.burnDamage = 0;

        console.log("🟢 TOWER BERHASIL DIBUAT:", type);
    }

    // Fungsi untuk menerima efek api dari Naga / Musuh
    applyBurn(duration, damagePerTick) {
        // Refresh durasi agar tidak numpuk jadi tak terhingga, tapi ambil yang terlama
        this.burnTime = Math.max(this.burnTime, duration); 
        // 🔥 STACK BURN: Makin sering disembur, makin sakit damagenya
        this.burnDamage += damagePerTick; 
    }

    upgrade() {
        if (typeof window.Game === 'undefined' || !this.active) return false;

        if (this.level < 3 && window.Game.gold >= this.data.upgradeCost) {
            window.Game.gold -= this.data.upgradeCost;
            this.level++;
            this.data.damage += 15;
            this.data.range += 15;
            this.hp = this.maxHp; // Heal penuh saat upgrade
            return true;
        }
        return false;
    }

    update() {
        if (!this.active || typeof window.enemies === 'undefined') return;

        if (this.isSpawning) {
            this.scale += (1.05 - this.scale) * 0.2; 
            if (this.scale >= 1.04) {
                this.scale = 1.0;
                this.isSpawning = false;
            }
        }

        if (this.cooldown > 0) this.cooldown--;

        // ==========================================
        // 🔥 LOGIKA BURN (DAMAGE OVER TIME & SPREAD)
        // ==========================================
        if (this.burnTime > 0) {
            this.burnTime--;

            // Beri damage tiap 20 frame biar tidak instakill
            if (this.burnTime % 20 === 0) {
                this.hp -= this.burnDamage;

                // 🔥 BURN SPREAD: Api nular ke tower terdekat
                // Dicek tiap 60 frame agar penyebaran ada jeda waktu (tidak langsung habis semua)
                if (this.burnTime % 60 === 0 && typeof window.towers !== 'undefined') {
                    for (let t of window.towers) {
                        // Jarak radius penularan: 90
                        if (t !== this && t.active && t.hp > 0 && Math.hypot(t.x - this.x, t.y - this.y) < 90) {
                            // Menular dengan durasi pendek dan damage ringan (bisa numpuk)
                            t.applyBurn(60, 1); 
                        }
                    }
                }

                // 🔥 TOWER MATI JADI ABU
                if (this.hp <= 0) {
                    this.active = false;
                    if (typeof window.explosions !== 'undefined') {
                        window.explosions.push(new Explosion(this.x, this.y, "fire"));
                    }
                    return; // Hentikan eksekusi update karena tower hancur
                }
            }
        }

        // LOGIKA RADAR
        let target = window.enemies
            .filter(e => 
                e && e.active && e.hp > 0 && 
                Math.hypot(e.x - this.x, e.y - this.y) <= this.data.range
            )
            .sort((a, b) => {
                let progressA = a.progress || a.waypointIndex || 0;
                let progressB = b.progress || b.waypointIndex || 0;
                return progressB - progressA;
            })[0] || null;

        // LOGIKA MENEMBAK
        if (target) {
            // Angle tetap dihitung agar peluru (proyektil) tahu arah tembakan
            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            
            if (this.cooldown <= 0) {
                switch (this.type) {
                    case "panah":
                        if (typeof window.projectiles !== 'undefined') window.projectiles.push(new Projectile(this.x, this.y, target, this.data.damage, "arrow"));
                        break;
                    case "bomb":
                        if (typeof window.projectiles !== 'undefined') window.projectiles.push(new Projectile(this.x, this.y, target, this.data.damage, "bomb"));
                        break;
                    case "ice":
                        if (typeof window.projectiles !== 'undefined') window.projectiles.push(new Projectile(this.x, this.y, target, this.data.damage, "ice"));
                        if (target.applySlow) target.applySlow(0.5, 120); 
                        break;
                    case "lightning":
                        this.chainLightning(target);
                        break;
                    case "poison":
                        if (typeof window.projectiles !== 'undefined') window.projectiles.push(new Projectile(this.x, this.y, target, this.data.damage, "poison"));
                        if (target.applyPoison) target.applyPoison(5, 180); 
                        break;
                    case "magic":
                        if (typeof window.projectiles !== 'undefined') window.projectiles.push(new Projectile(this.x, this.y, target, this.data.damage * 1.5, "magic"));
                        break;
                }
                
                if (typeof window.playTowerSound === 'function') window.playTowerSound(this.type);
                
                this.cooldown = this.data.fireRate;
            }
        }
    }

    draw() {
        if (!this.active || typeof window.ctx === 'undefined') return;

        window.ctx.save();
        window.ctx.translate(this.x, this.y);
        window.ctx.scale(this.scale, this.scale);
        
        let imgName = `tower_${this.type}${this.level}`;
        let img = (typeof window.images !== 'undefined') ? window.images[imgName] : null;

        if (img && img.complete && img.naturalWidth > 0) {
            window.ctx.save(); // Simpan state sebelum membalikkan gambar
            
            // Cosinus dari angle bernilai negatif jika musuh berada di kiri
            let isFacingLeft = Math.cos(this.angle) < 0; 
            
            if (isFacingLeft) {
                // Membalikkan gambar secara horizontal
                window.ctx.scale(-1, 1); 
            }

            window.ctx.drawImage(img, -50, -50, 100, 100);
            window.ctx.restore(); 
            
        } else {
            // Fallback UI standar
            let grad = window.ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
            grad.addColorStop(0, this.data.color || "#666");
            grad.addColorStop(1, "#333");
            
            window.ctx.fillStyle = grad;
            window.ctx.beginPath(); 
            window.ctx.arc(0, 0, this.radius, 0, Math.PI * 2); 
            window.ctx.fill();
            window.ctx.lineWidth = 5; 
            window.ctx.strokeStyle = "#140d07"; 
            window.ctx.stroke();
            
            window.ctx.font = "30px 'Fredoka One', Arial"; 
            window.ctx.textAlign = "center"; 
            window.ctx.textBaseline = "middle";
            window.ctx.fillStyle = "white"; 
            window.ctx.fillText(this.data.icon || "T", 0, -5); 
            window.ctx.font = "16px Arial"; 
            window.ctx.fillText(`Lv.${this.level}`, 0, 25);
        }
        
        // ==========================================
        // 🔥 VISUAL EFEK API KETIKA TERBAKAR
        // ==========================================
        if (this.burnTime > 0) {
            window.ctx.fillStyle = "rgba(255, 100, 0, 0.7)";
            window.ctx.shadowBlur = 10;
            window.ctx.shadowColor = "red";
            
            window.ctx.beginPath();
            // Efek api sedikit bergetar/flicker
            let flicker = Math.random() * 5;
            window.ctx.arc(0, -20, 15 + flicker, 0, Math.PI * 2);
            window.ctx.fill();
            
            window.ctx.shadowBlur = 0; // Reset
        }

        window.ctx.restore();
    }

    chainLightning(firstTarget) {
        let hitEnemies = [firstTarget];
        let maxChain = 3;
        let range = 120;
    
        firstTarget.hp -= this.data.damage;
    
        for (let i = 0; i < maxChain; i++) {
            let last = hitEnemies[hitEnemies.length - 1];
    
            let next = (typeof window.enemies !== 'undefined') ? window.enemies.find(e => 
                e && e.active && e.hp > 0 &&
                !hitEnemies.includes(e) &&
                Math.hypot(e.x - last.x, e.y - last.y) < range
            ) : null;
    
            if (!next) break;
    
            next.hp -= this.data.damage * 0.7;
            hitEnemies.push(next);
        }
    
        if (typeof window.createLightningEffect === "function") {
            window.createLightningEffect(hitEnemies);
        }
    }
}

// PERBAIKAN: Menjadikan function ini global agar bisa dipanggil oleh window.createLightningEffect
window.createLightningEffect = function(chain) {
    if (!chain || chain.length < 2 || typeof window.ctx === 'undefined') return;

    window.ctx.save();
    window.ctx.strokeStyle = "#00ffff";
    window.ctx.lineWidth = 3;
    
    window.ctx.shadowBlur = 12;
    window.ctx.shadowColor = "#00ffff";

    window.ctx.beginPath();
    window.ctx.moveTo(chain[0].x, chain[0].y);

    for (let i = 1; i < chain.length; i++) {
        let e = chain[i];
        if (e && e.x && e.y) {
            window.ctx.lineTo(e.x, e.y);
        }
    }

    window.ctx.stroke();
    window.ctx.restore(); 
};
