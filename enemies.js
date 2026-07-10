// ==========================================================================
// ENEMIES.JS - SISTEM KECERDASAN (AI), GERAKAN MUSUH, & EFEK STATUS
// ==========================================================================

class Enemy {
    constructor(hp, speed, type = "normal", radius = 25, spriteSize = 80) {
        // Ambil posisi awal dari window.PATH (Sesuai config.js)
        this.x = (typeof window.PATH !== 'undefined' && window.PATH.length > 0) ? window.PATH[0].x : 0;
        this.y = (typeof window.PATH !== 'undefined' && window.PATH.length > 0) ? window.PATH[0].y : 300;
        this.waypointIndex = 1;
        
        // Pengali kesulitan (Wave)
        let waveMultiplier = (typeof window.Game !== 'undefined') ? window.Game.wave * 0.1 : 0;
        let hpMultiplier = (typeof window.Game !== 'undefined') ? window.Game.wave * 10 : 0;

        // Stats utama (Movement & HP)
        this.baseSpeed = speed + waveMultiplier;
        this.maxHp = hp + hpMultiplier;
        this.hp = this.maxHp;
        
        this.type = type;
        this.radius = radius;
        this.spriteSize = spriteSize;
        
        // Stats Penyerangan (Attack) - Nilai Default
        this.attackType = "melee"; 
        this.damage = 5;
        this.attackRange = 80;
        this.attackCooldown = 60;
        this.cooldown = 0;
        this.targetTower = null;
        
        // Variabel Animasi & Pergerakan
        this.walkCycle = 0;
        this.bounceOffset = 0;
        this.spriteOffsetY = 15;
        this.state = "walk"; 
        this.facingLeft = false;
        this.active = true;
        this.reachedBase = false;
        this.progress = 0;

        // Status Efek (Buff/Debuff)
        this.slowFactor = 1;
        this.slowTimer = 0;
        this.poisonDamage = 0;
        this.poisonTimer = 0;

        // Properti gambar default
        this.imgWalk1 = null;
        this.imgWalk2 = null;
        this.imgAttack = null;
    }

    applySlow(factor, duration) {
        if (factor < this.slowFactor || this.slowTimer <= 0) {
            this.slowFactor = factor;
            this.slowTimer = duration;
        }
    }

    applyPoison(dmg, duration) {
        this.poisonDamage = dmg;
        this.poisonTimer = duration;
    }

    update() {
        if (!this.active) return;

        // 1. LOGIKA POISON
        if (this.poisonTimer > 0) {
            this.hp -= this.poisonDamage * 0.05;
            this.poisonTimer--;
            if (this.hp <= 0) {
                this.active = false;
                return;
            }
        }

        // 2. LOGIKA KECEPATAN
        let currentSpeed = this.baseSpeed;
        if (this.slowTimer > 0) {
            currentSpeed *= this.slowFactor;
            this.slowTimer--;
        } else {
            this.slowFactor = 1;
        }

        // 3. LOGIKA TARGET TOWER TERDEKAT
        let nearest = null;
        let minDist = this.attackRange;

        if (typeof window.towers !== 'undefined') {
            for (let t of window.towers) {
                if (t.hp <= 0) continue; 
                let dist = Math.hypot(t.x - this.x, t.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = t;
                }
            }
        }

        if (nearest) {
            this.state = "attack";
            this.targetTower = nearest;
            this.facingLeft = (nearest.x - this.x < 0); 
        } else {
            this.state = "walk";
            this.targetTower = null;
        }

        // 4. AKSI BERDASARKAN STATE
        if (this.state === "attack") {
            if (this.cooldown > 0) this.cooldown -= this.slowFactor;

            if (this.cooldown <= 0 && this.targetTower) {
                if (this.attackType === "melee") {
                    this.targetTower.hp -= this.damage;
                    if (typeof window.explosions !== 'undefined') {
                        window.explosions.push({
                            x: this.targetTower.x,
                            y: this.targetTower.y,
                            life: 10,
                            active: true,
                            update() { 
                                this.life--; 
                                if(this.life <= 0) this.active = false;
                            },
                            draw() {
                                if(typeof window.ctx === 'undefined') return;
                                window.ctx.fillStyle = "red";
                                window.ctx.beginPath();
                                window.ctx.arc(this.x, this.y, 10, 0, Math.PI*2);
                                window.ctx.fill();
                            }
                        });
                    }
                } else {
                    if (typeof window.projectiles !== 'undefined') {
                        window.projectiles.push(
                            new EnemyProjectile(this.x, this.y - 20, this.targetTower, this.damage)
                        );
                    }
                }
                this.cooldown = this.attackCooldown;
            }
            this.walkCycle += 0.1 * this.slowFactor;

        } else if (this.state === "walk") {
            if (typeof window.PATH !== 'undefined' && this.waypointIndex < window.PATH.length) {
                let target = window.PATH[this.waypointIndex];
                let dx = target.x - this.x;
                let dy = target.y - this.y;
                let dist = Math.hypot(dx, dy);

                if (dist < currentSpeed) {
                    this.x = target.x;
                    this.y = target.y;
                    this.waypointIndex++;
                    if (this.waypointIndex >= window.PATH.length) {
                        this.reachedBase = true;
                        this.active = false;
                    }
                } else {
                    this.x += (dx / dist) * currentSpeed;
                    this.y += (dy / dist) * currentSpeed;
                    this.facingLeft = dx < 0; 
                }
                this.progress += currentSpeed;
            } else {
                this.x += currentSpeed;
                this.progress += currentSpeed;
            }
            this.walkCycle += 0.1 * (currentSpeed / this.baseSpeed);
            this.bounceOffset = Math.sin(this.walkCycle * 2) * 2;
        }
    }

    draw() {
        if (!this.active || typeof window.ctx === 'undefined') return;
        
        window.ctx.save(); 
        window.ctx.translate(this.x, this.y + (this.state === "walk" ? this.bounceOffset : 0) + this.spriteOffsetY); 
        
        if (this.state === "walk") {
            window.ctx.rotate(Math.sin(this.walkCycle * 0.5) * 0.1);
        }

        if (this.facingLeft) window.ctx.scale(-1, 1);

        let currentImage;
        if (this.state === "attack" && this.imgAttack && this.imgAttack.complete) {
            currentImage = this.imgAttack;
        } else {
            currentImage = (Math.floor(this.walkCycle * 1.5) % 2 === 0) ? this.imgWalk1 : this.imgWalk2;
        }

        let halfSize = this.spriteSize / 2;

        if (currentImage && currentImage.complete) {
            window.ctx.drawImage(currentImage, -halfSize, -this.spriteSize + 10, this.spriteSize, this.spriteSize);
        } else {
            window.ctx.fillStyle = "#ff4d4d";
            window.ctx.beginPath(); 
            window.ctx.arc(0, -this.spriteOffsetY, this.radius, 0, Math.PI * 2); 
            window.ctx.fill();
        }
        window.ctx.restore(); 

        this.drawHpBar();
    }

    drawHpBar() {
        if (typeof window.ctx === 'undefined') return;
        window.ctx.fillStyle = "black";
        window.ctx.fillRect(this.x - 20, this.y - 45, 40, 5);
        
        if (this.poisonTimer > 0) window.ctx.fillStyle = "#8a2be2"; 
        else if (this.slowTimer > 0) window.ctx.fillStyle = "#00ffff"; 
        else window.ctx.fillStyle = "lime"; 

        let hpPercent = Math.max(0, this.hp) / this.maxHp;
        window.ctx.fillRect(this.x - 20, this.y - 45, 40 * hpPercent, 5);
    }
}

// ==========================================================================
// SUB-CLASS JENIS MUSUH NORMAL
// ==========================================================================

class SkeletonEnemy extends Enemy {
    constructor() {
        super(75, 1.2, "skeleton", 25, 90);
        this.attackType = "melee";
        if (typeof window.images !== 'undefined') {
            this.imgWalk1 = window.images.skeleton_walk1;
            this.imgWalk2 = window.images.skeleton_walk2;
            this.imgAttack = window.images.skeleton_attack;
        }
    }
}

class WolfEnemy extends Enemy {
    constructor() {
        super(80, 2.5, "wolf", 20, 70);
        this.attackType = "melee";
        this.damage = 4;
        this.attackRange = 60;
        if (typeof window.images !== 'undefined') {
            this.imgWalk1 = window.images.wolf_walk1;
            this.imgWalk2 = window.images.wolf_walk3;
            this.imgAttack = window.images.wolf_attack; 
        }
    }
}

class TrollEnemy extends Enemy {
    constructor() {
        super(300, 0.8, "troll", 35, 110);
        this.attackType = "melee";
        this.damage = 10;
        this.attackRange = 90;
        this.attackCooldown = 90;
        if (typeof window.images !== 'undefined') {
            this.imgWalk1 = window.images.troll_walk1;
            this.imgWalk2 = window.images.troll_walk2;
            this.imgAttack = window.images.troll_attack;
        }
    }
}

class MageEnemy extends Enemy {
    constructor() {
        super(120, 1.5, "mage", 25, 80);
        this.attackType = "range";
        this.attackRange = 180;
        this.damage = 8;
        this.attackCooldown = 50;
        if (typeof window.images !== 'undefined') {
            this.imgWalk1 = window.images.mage_walk1;
            this.imgWalk2 = window.images.mage_walk2;
            this.imgAttack = window.images.mage_attack;
        }
    }
}

class GoblinEnemy extends Enemy {
    constructor() {
        super(140, 1.7, "goblin", 25, 80);
        this.attackType = "melee";
        this.damage = 6;
        if (typeof window.images !== 'undefined') {
            this.imgWalk1 = window.images.goblin_walk1;
            this.imgWalk2 = window.images.goblin_walk2;
            this.imgAttack = window.images.goblin_attack;
        }
    }
}

class BossEnemy extends Enemy {
    constructor() {
        super(1000, 0.6, "boss", 50, 150);
        this.attackType = "melee";
        this.damage = 20;
        this.attackRange = 150;
        this.attackCooldown = 50;
        if (typeof window.images !== 'undefined') {
            this.imgWalk1 = window.images.boss_walk1;
            this.imgWalk2 = window.images.boss_walk2;
            this.imgAttack = window.images.boss_attack;
        }
    }
}

// ==========================================================================
// KELAS KHUSUS: DRAGON (TERBANG & FIRE BREATH)
// ==========================================================================

class DragonEnemy extends Enemy {
    constructor() {
        super(400, 3.5, "dragon", 50, 160);
        
        // Mode Terbang
        this.isFlying = false;
        this.flyTarget = null;
        
        // Attack Setup
        this.fireCooldown = 0;
        this.fireRate = 180; 
        this.fireRange = 200;
        this.angle = 0; // Untuk visual rotasi & Cone Damage
        
        if (typeof window.images !== 'undefined') {
            this.imgWalk1 = window.images.dragon_walk1;
            this.imgWalk2 = window.images.dragon_walk2;
            this.imgAttack = window.images.dragon_attack;
        }
    }

    update() {
        if (!this.active) return;

        // 1. UPDATE EFEK STATUS (Poison, Slow)
        if (this.poisonTimer > 0) {
            this.hp -= this.poisonDamage * 0.05;
            this.poisonTimer--;
            if (this.hp <= 0) { this.active = false; return; }
        }

        let currentSpeed = this.baseSpeed;
        if (this.slowTimer > 0) {
            currentSpeed *= this.slowFactor;
            this.slowTimer--;
        } else {
            this.slowFactor = 1;
        }

        // 2. TRIGGER TERBANG (Setelah waypoint ke-5)
        if (!this.isFlying && this.waypointIndex > 5) {
            this.startFlying();
        }

        // 3. LOGIKA GERAKAN (Terbang vs Jalan Normal)
        if (this.isFlying) {
            this.flyMove(currentSpeed);
        } else {
            this.followPath(currentSpeed);
        }

        // 4. LOGIKA FIRE BREATH
        if (this.fireCooldown > 0) this.fireCooldown--;

        if (this.fireCooldown <= 0) {
            let targetTower = this.findTowerTarget();
            if (targetTower) {
                this.fireBreath(targetTower);
                this.fireCooldown = this.fireRate;
            }
        }
    }

    followPath(currentSpeed) {
        if (typeof window.PATH === 'undefined') return;
        
        let target = window.PATH[this.waypointIndex];
        if (!target) {
            this.reachedBase = true;
            this.active = false;
            return;
        }

        let dx = target.x - this.x;
        let dy = target.y - this.y;
        let dist = Math.hypot(dx, dy);
        
        // Simpan rotasi untuk visual dan hitungan AoE Cone
        this.angle = Math.atan2(dy, dx);

        if (dist < currentSpeed) {
            this.waypointIndex++;
        } else {
            this.x += (dx / dist) * currentSpeed;
            this.y += (dy / dist) * currentSpeed;
        }
    }

    startFlying() {
        this.isFlying = true;
        // Target terbang melompat sejauh 5 node ke depan
        let skipIndex = this.waypointIndex + 5;

        if (typeof window.PATH !== 'undefined') {
            if (skipIndex >= window.PATH.length) {
                this.flyTarget = window.PATH[window.PATH.length - 1];
            } else {
                this.flyTarget = window.PATH[skipIndex];
            }
        }
    }

    flyMove(currentSpeed) {
        if (!this.flyTarget) return;

        let dx = this.flyTarget.x - this.x;
        let dy = this.flyTarget.y - this.y;
        let dist = Math.hypot(dx, dy);
        
        this.angle = Math.atan2(dy, dx);

        if (dist < currentSpeed * 2) {
            // Landing, buat ledakan
            if (typeof window.explosions !== 'undefined') {
                window.explosions.push(new Explosion(this.x, this.y, "boss"));
            }
            this.isFlying = false;
            this.waypointIndex += 5; 
            return;
        }

        // Gerak terbang (lebih cepat)
        this.x += (dx / dist) * currentSpeed * 1.8;
        this.y += (dy / dist) * currentSpeed * 1.8;
    }

    findTowerTarget() {
        let closest = null;
        let minDist = this.fireRange;

        if (typeof window.towers !== 'undefined') {
            for (let t of window.towers) {
                let dist = Math.hypot(t.x - this.x, t.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = t;
                }
            }
        }
        return closest;
    }

    // PERBAIKAN: Fungsi fireBreath yang terpotong dan menggantung di bawah,
    // sekarang dimasukkan secara utuh ke dalam class DragonEnemy di sini.
    fireBreath(target) {
        // 1. Efek Visual Semburan Api (Explosion bertipe "fire")
        if (typeof window.explosions !== 'undefined') {
            window.explosions.push(new Explosion(this.x, this.y, "fire"));
        }

        // 2. Damage Area & Efek Burn
        if (typeof window.towers !== 'undefined') {
            for (let t of window.towers) {
                // Lewati tower yang sudah hancur
                if (t.hp <= 0) continue;

                let dist = Math.hypot(t.x - this.x, t.y - this.y);
                let angleToTower = Math.atan2(t.y - this.y, t.x - this.x);
                let diff = Math.abs(angleToTower - this.angle);

                // Normalisasi perbedaan sudut agar selalu berada di rentang 0 - PI
                if (diff > Math.PI) diff = 2 * Math.PI - diff;

                // Cek apakah target masuk ke dalam cone semburan api (sudut 0.5 rad ≈ 30 derajat)
                if (diff < 0.5 && dist < this.fireRange) {
                    // Berikan damage instan 25
                    t.hp -= 25; 
                    
                    // Berikan efek status Burn (durasi 120 tick, damage 3 per tick)
                    if (typeof t.applyBurn === 'function') {
                        t.applyBurn(120, 3);
                    }
                    
                    // Cek jika tower hancur setelah damage instan
                    if (t.hp <= 0) {
                        t.active = false;
                        if (typeof window.explosions !== 'undefined') {
                            window.explosions.push(new Explosion(t.x, t.y, "fire"));
                        }
                    }
                }
            }
        }

        // 3. SFX
        if (typeof window.playSound === "function") {
            window.playSound("dragon_fire");
        }
    }

    draw() {
        if (!this.active || typeof window.ctx === 'undefined') return;

        window.ctx.save();
        window.ctx.translate(this.x, this.y);

        // Jika terbang, aplikasikan rotasi, jika jalan, rotasi dibatasi/tidak ada
        if (this.isFlying) {
            window.ctx.rotate(this.angle);
            // Tambahkan bayangan untuk ilusi tinggi
            window.ctx.shadowColor = "rgba(0,0,0,0.5)";
            window.ctx.shadowBlur = 20;
            window.ctx.shadowOffsetY = 30;
        } else {
            // Efek memantul saat jalan
            this.walkCycle += 0.1;
            let bounce = Math.sin(this.walkCycle * 2) * 2;
            window.ctx.translate(0, bounce);
            
            // Perbaiki arah hadap jika jalan biasa (menyesuaikan kode lama)
            if (Math.cos(this.angle) < 0) window.ctx.scale(-1, 1);
        }

        let img = (Math.floor(this.walkCycle * 1.5) % 2 === 0) ? this.imgWalk1 : this.imgWalk2;

        if (img && img.complete) {
            window.ctx.drawImage(img, -this.spriteSize/2, -this.spriteSize/2, this.spriteSize, this.spriteSize);
        } else {
            window.ctx.fillStyle = "darkred";
            window.ctx.beginPath();
            window.ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            window.ctx.fill();
        }

        window.ctx.restore();
        
        // Panggil fungsi gambar HP Bar dari parent Enemy
        this.drawHpBar();
    }
}
