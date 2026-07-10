// ==========================================================================
// MAIN.JS - GAME LOOP & RENDER ORDER (VERSI ANTI-CRASH & ERROR SCANNER)
// ==========================================================================

// 1. MENGGUNAKAN CANVAS DARI GLOBALS.JS (Mencegah deklarasi ganda/konflik)
var gameCvs = window.canvas;
var gameCtx = window.ctx;

// ==========================================
// SISTEM WAVE & SPAWN MUSUH
// ==========================================
let waveIndex = 0;
let spawnIndex = 0;
let spawnTimer = 0;
let waveDelay = 180; // Jeda waktu antar wave (dalam frame)
let isWaveActive = true;

// Mencegah crash jika CONFIG.JS atau objek Game telat dimuat
const currentMode = (typeof Game !== 'undefined' && Game.mode) ? Game.mode : "normal";
const currentWaves = (typeof WAVES !== 'undefined') ? WAVES[currentMode] : [];

function spawnEnemyByType(type) {
    if (typeof enemies === 'undefined') return;
    
    switch(type) {
        case "skeleton":
            if (typeof SkeletonEnemy !== "undefined") enemies.push(new SkeletonEnemy());
            break;
        case "troll":
            if (typeof TrollEnemy !== "undefined") enemies.push(new TrollEnemy());
            break;
        case "goblin":
            if (typeof GoblinEnemy !== "undefined") enemies.push(new GoblinEnemy());
            break;
        case "wolf":
            if (typeof WolfEnemy !== "undefined") enemies.push(new WolfEnemy());
            break;
        case "mage":
            if (typeof MageEnemy !== "undefined") enemies.push(new MageEnemy());
            break;
        case "boss":
            if (typeof BossEnemy !== "undefined") enemies.push(new BossEnemy());
            break;
        case "dragon":
            if (typeof DragonEnemy !== "undefined") enemies.push(new DragonEnemy());
            break;
    }
}

function handleWaveSpawn() {
    // Hentikan fungsi jika data wave belum tersedia atau wave sudah habis
    if (!currentWaves || !currentWaves[waveIndex]) return;

    let wave = currentWaves[waveIndex];

    if (isWaveActive) {
        spawnTimer--;

        if (spawnTimer <= 0 && spawnIndex < wave.count) {
            spawnEnemyByType(wave.type);
            spawnIndex++;
            spawnTimer = wave.delay;
        }

        // Wave selesai (musuh habis ditaruh & semua mati di layar)
        if (spawnIndex >= wave.count && (typeof enemies !== 'undefined' && enemies.length === 0)) {
            isWaveActive = false;
            spawnTimer = waveDelay;
        }

    } else {
        spawnTimer--;

        if (spawnTimer <= 0) {
            waveIndex++;
            spawnIndex = 0;
            isWaveActive = true;

            if (typeof Game !== 'undefined') Game.wave++;
            if (typeof updateHUD === "function") updateHUD();
        }
    }
}

// ==========================================
// 2. FUNGSI GAME LOOP UTAMA
// ==========================================
function gameLoop() {
    try {
        if (!gameCvs || !gameCtx) return;
        
        if (typeof Game !== 'undefined' && !Game.pause) {
            gameCtx.clearRect(0, 0, gameCvs.width, gameCvs.height);

            // --- 1. GAMBAR BACKGROUND MAP ---
            if (typeof images !== 'undefined' && images.map_bg && images.map_bg.complete && images.map_bg.naturalWidth > 0) {
                gameCtx.drawImage(images.map_bg, 0, 0, gameCvs.width, gameCvs.height);
            } else {
                gameCtx.fillStyle = "#e0c9a3"; 
                gameCtx.fillRect(0, 0, gameCvs.width, gameCvs.height);
            }

            // --- 2. TAMPILKAN PREVIEW TOWER ---
            if (typeof updatePreviewPhysics === "function") updatePreviewPhysics();
            if (typeof drawPlacementPreview === "function") drawPlacementPreview();

            // --- 3. LOGIKA SPAWN MUSUH (SISTEM WAVE) ---
            handleWaveSpawn();

            // --- 4. UPDATE & GAMBAR MUSUH ---
            if (typeof enemies !== 'undefined') {
                for (let i = enemies.length - 1; i >= 0; i--) {
                    let enemy = enemies[i];
                    if (typeof enemy.update === "function") enemy.update();
                    
                    if (enemy.reachedBase) {
                        enemies.splice(i, 1);
                        if (typeof Game !== 'undefined') Game.hp -= 1;
                        if (typeof updateHUD === "function") updateHUD();
                        
                        if (typeof Game !== 'undefined' && Game.hp <= 0) {
                            if (typeof showNotification === "function") showNotification("💀 GAME OVER!");
                            if (typeof playSound === 'function') playSound("gameover");
                            Game.pause = true;
                        }
                        continue; 
                    }

                    if (enemy.hp <= 0) {
                        enemies.splice(i, 1);
                        // Gold tambahan juga bisa disesuaikan jika musuh memiliki properti 'reward'
                        if (typeof Game !== 'undefined') Game.gold += (enemy.reward || 15); 
                        if (typeof updateHUD === "function") updateHUD();
                        continue;
                    }
                    if (typeof enemy.draw === "function") enemy.draw();
                }
            }

            // --- 5. UPDATE & GAMBAR TOWER ---
            if (typeof towers !== 'undefined') {
                for (let i = towers.length - 1; i >= 0; i--) {
                    if (towers[i].hp !== undefined && towers[i].hp <= 0) {
                        towers.splice(i, 1);
                    }
                }
                towers.forEach(t => { if(typeof t.update === "function") t.update(); });
                towers.sort((a, b) => a.y - b.y).forEach(t => { if(typeof t.draw === "function") t.draw(); });
            }

            // --- 6. UPDATE & GAMBAR PROYEKTIL ---
            if (typeof projectiles !== 'undefined') {
                for (let i = projectiles.length - 1; i >= 0; i--) {
                    let p = projectiles[i];
                    if(typeof p.update === "function") p.update();
                    if(typeof p.draw === "function") p.draw();
                    if (!p.active) projectiles.splice(i, 1);
                }
            }

            // --- 7. UPDATE & GAMBAR EFEK LEDAKAN ---
            if (typeof explosions !== 'undefined') {
                for (let i = explosions.length - 1; i >= 0; i--) {
                    let e = explosions[i];
                    if(typeof e.update === "function") e.update();
                    if(typeof e.draw === "function") e.draw();
                    if (!e.active) explosions.splice(i, 1);
                }
            }

            if (typeof frameCount !== 'undefined') window.frameCount++;
        }
        
        requestAnimationFrame(gameLoop);
        
    } catch (error) {
        // TAMPILAN RADAR ERROR
        console.error("Game Loop Error:", error);
        if (gameCtx) {
            gameCtx.fillStyle = "red";
            gameCtx.fillRect(0, 0, gameCvs.width, 180);
            gameCtx.fillStyle = "white";
            gameCtx.font = "28px 'Fredoka One', Arial";
            gameCtx.fillText("⚠️ TERJADI ERROR!", 20, 40);
            gameCtx.font = "20px Arial";
            gameCtx.fillText("Penyebab:", 20, 80);
            gameCtx.fillText(error.message, 20, 110);
        }
    }
}

// ==========================================
// INISIALISASI (MENUNGGU ASET SELESAI)
// ==========================================
async function initGame() {
    try {
        console.log("Memuat Aset...");
        
        // --- SINKRONISASI HP & GOLD BERDASARKAN TINGKAT KESULITAN DARI CONFIG.JS ---
        if (typeof window.STARTING_HP !== 'undefined') {
            Game.hp = window.STARTING_HP;
        }
        if (typeof window.STARTING_GOLD !== 'undefined') {
            Game.gold = window.STARTING_GOLD;
        }

        if (typeof preloadImages === "function") await preloadImages(); 
        if (typeof loadSounds === 'function') loadSounds();
        
        console.log("Game Dimulai!");
        if (typeof updateHUD === "function") updateHUD();
        gameLoop();
    } catch (err) {
        console.error("Init Error:", err);
        if (gameCtx) {
            gameCtx.fillStyle = "red";
            gameCtx.fillRect(0, 0, gameCvs.width, 100);
            gameCtx.fillStyle = "white";
            gameCtx.font = "20px Arial";
            gameCtx.fillText("INIT ERROR: " + err.message, 20, 50);
        }
    }
}

// Mulai sistem
if (document.getElementById("gameCanvas")) {
    initGame();
} else {
    alert("Error: Canvas tidak ditemukan di HTML!");
}
