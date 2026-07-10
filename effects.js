// ==========================================================================
// EFFECTS.JS - SISTEM PROYEKTIL DAN VISUAL EFEK
// ==========================================================================

class Projectile {
    constructor(x, y, target, damage, type) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.type = type;
        this.speed = 15; 
        this.active = true;
        this.targetX = target ? target.x : x;
        this.targetY = target ? target.y : y;
    }
    
    update() {
        if (!this.active) return;

        // Mengunci pergerakan ke arah target selama target masih hidup
        if (this.target && this.target.hp > 0) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
        }

        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        let dist = Math.hypot(dx, dy);

        // Jika peluru mengenai target
        if (dist < this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;
            
            if (this.target && this.target.hp > 0) {
                this.target.hp -= this.damage;
            }
            
            // Memicu efek ledakan
            if (typeof window.explosions !== 'undefined') {
                window.explosions.push(new Explosion(this.targetX, this.targetY, this.type));
            }
            this.active = false;
        } else {
            // Bergerak mendekati target
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw() {
        if (!this.active || typeof window.ctx === 'undefined') return;
        window.ctx.save();
        window.ctx.translate(this.x, this.y);
        
        let angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        window.ctx.rotate(angle);
        
        let img = (typeof window.images !== 'undefined') ? ((this.type === "archer") ? window.images.shootpanah : window.images.shootcannon) : null;

        if (img && img.complete && img.naturalWidth > 0) {
            let frameWidth = (this.type === "archer") ? img.width : (img.width / 7); 
            window.ctx.drawImage(img, 0, 0, frameWidth, img.height, -15, -15, 30, 30);
        } else {
            window.ctx.fillStyle = (this.type === "archer") ? "yellow" : "black";
            window.ctx.beginPath();
            window.ctx.arc(0, 0, 5, 0, Math.PI * 2);
            window.ctx.fill();
        }
        window.ctx.restore();
    }
}

class Explosion {
    constructor(x, y, type = "normal") {
        this.x = x;
        this.y = y;
        this.type = type; // "archer", "cannon", "enemy", "boss", atau "fire"
        this.frame = 0;
        this.maxFrame = 20; 
        this.scale = 0.3;   
        this.active = true;
    }

    update() {
        this.frame++;
        this.scale += 0.05; 
        if (this.frame >= this.maxFrame) this.active = false; 
    }

    draw() {
        if (!this.active || typeof window.ctx === 'undefined') return;
        window.ctx.save();
        
        // Fading Effect (Makin lama makin transparan)
        let alpha = Math.max(0, 1 - (this.frame / this.maxFrame));
        window.ctx.globalAlpha = alpha; 
        
        // ----------------------------------------------------
        // LOGIKA BARU: EFEK API (DRAGON FIRE BREATH)
        // ----------------------------------------------------
        if (this.type === "fire") {
            window.ctx.fillStyle = "orange";
            window.ctx.shadowBlur = 15;
            window.ctx.shadowColor = "red";
            
            window.ctx.beginPath();
            // Radius api membesar sesuai frame
            window.ctx.arc(this.x, this.y, this.frame * 3, 0, Math.PI * 2);
            window.ctx.fill();
        } 
        // ----------------------------------------------------
        // LOGIKA LAMA: EFEK LEDAKAN BIASA
        // ----------------------------------------------------
        else {
            window.ctx.translate(this.x, this.y);
            window.ctx.scale(this.scale, this.scale);
            
            let imgEfek = null;
            if (typeof window.images !== 'undefined') {
                if (this.type === "archer") imgEfek = window.images.effect4;
                else if (this.type === "enemy" || this.type === "boss") imgEfek = window.images.effect2; 
                else imgEfek = window.images.effect1;
            }
            
            if (imgEfek && imgEfek.complete && imgEfek.naturalWidth > 0) {
                window.ctx.drawImage(imgEfek, -64, -64, 128, 128); 
            } else {
                window.ctx.fillStyle = (this.type === "enemy" || this.type === "boss") ? "orange" : "red";
                window.ctx.beginPath();
                window.ctx.arc(0, 0, 40, 0, Math.PI * 2);
                window.ctx.fill();
            }
        }
        
        window.ctx.restore();
    }
}

class EnemyProjectile {
    constructor(x, y, target, damage) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;

        this.speed = 5;
        this.active = true;
        
        // Menyimpan posisi terakhir target agar proyektil tidak hilang di tengah jalan
        this.targetX = target ? target.x : x;
        this.targetY = target ? target.y : y;
    }

    update() {
        if (!this.active) return;

        // Kunci koordinat selama tower target masih berdiri
        if (this.target && this.target.hp > 0) {
            this.targetX = this.target.x;
            this.targetY = this.target.y;
        }

        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        let dist = Math.hypot(dx, dy);

        // Jika peluru musuh mengenai tower
        if (dist < this.speed) {
            this.x = this.targetX;
            this.y = this.targetY;

            if (this.target && this.target.hp > 0) {
                this.target.hp -= this.damage;
            }

            // Memanggil efek ledakan
            if (typeof window.explosions !== 'undefined') {
                window.explosions.push(new Explosion(this.targetX, this.targetY, "enemy"));
            }

            this.active = false;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw() {
        if (!this.active || typeof window.ctx === 'undefined') return;

        window.ctx.save();
        
        // WARNA VISUAL DINAMIS
        window.ctx.fillStyle = "purple"; // Warna Default Mage

        if (this.damage > 15) {
            window.ctx.fillStyle = "red";    // Tembakan Boss/Heavy
        } else if (this.damage < 8) {
            window.ctx.fillStyle = "green";  // Tembakan Racun/Ringan
        }

        // Efek Aura Bercahaya Tambahan
        window.ctx.shadowBlur = 8;
        window.ctx.shadowColor = window.ctx.fillStyle; 

        window.ctx.beginPath();
        window.ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        window.ctx.fill();
        
        window.ctx.restore();
    }
}
