// ==========================================================================
// ASSETS.JS - KHUSUS UNTUK MEMUAT DAN MENYIMPAN GAMBAR (AUTO MATCH TOWER)
// ==========================================================================

// 1. Memaksa objek images terdaftar secara global absolut agar tidak undefined
window.images = window.images || {}; 
var images = window.images;

function preloadImages() {
    // 2. Daftar Aset Dasar (selain tower)
    const assetList = [
        { name: "map_bg", src: "Asset/Maps5musim/maps_desert.png" },
        { name: "skeleton_walk1", src: "Asset/Enemy_skeleton/skeleton_walk1.png" },
        { name: "skeleton_walk2", src: "Asset/Enemy_skeleton/skeleton_walk2.png" },
        { name: "skeleton_attack", src: "Asset/Enemy_skeleton/skeleton_attack.png" },
        { name: "shootcannon", src: "Asset/Projectile/shootcannon.png" },
        { name: "shootpanah", src: "Asset/Projectile/shootpanah.png" },
        { name: "effect1", src: "Asset/Effect/effect1.png" },   
        { name: "effect4", src: "Asset/Effect/effect4.png" }, // <-- DITAMBAHKAN KOMA DI SINI
        
        // WOLF
        { name: "wolf_walk1", src: "Asset/Enemy_wolf/wolf_walk1.png" },
        { name: "wolf_walk3", src: "Asset/Enemy_wolf/wolf_walk3.png" },
        { name: "wolf_attack", src: "Asset/Enemy_wolf/wolf_attack.png" },

        // TROLL
        { name: "troll_walk1", src: "Asset/Enemy_troll/troll_walk1.png" },
        { name: "troll_walk2", src: "Asset/Enemy_troll/troll_walk2.png" },
        { name: "troll_attack", src: "Asset/Enemy_troll/troll_attack.png" },

        // MAGE
        { name: "mage_walk1", src: "Asset/Enemy_mage/mage_walk1.png" },
        { name: "mage_walk2", src: "Asset/Enemy_mage/mage_walk2.png" },
        { name: "mage_attack", src: "Asset/Enemy_mage/mage_attack.png" },

        // GOBLIN
        { name: "goblin_walk1", src: "Asset/Enemy_goblin/goblin_walk1.png" },
        { name: "goblin_walk2", src: "Asset/Enemy_goblin/goblin_walk2.png" },
        { name: "goblin_attack", src: "Asset/Enemy_goblin/goblin_attack.png" },

        // BOSS
        { name: "boss_walk1", src: "Asset/Enemy_boss/boss_walk1.png" },
        { name: "boss_walk2", src: "Asset/Enemy_boss/boss_walk2.png" },
        { name: "boss_attack", src: "Asset/Enemy_boss/boss_attack.png" },

        // DRAGON
        { name: "dragon_walk1", src: "Asset/Enemy_dragon/dragon_walk1.png" },
        { name: "dragon_walk2", src: "Asset/Enemy_dragon/dragon_walk2.png" },
        { name: "dragon_attack", src: "Asset/Enemy_dragon/dragon_attack.png" }
    ];

    // 3. AUTO MATCH SYSTEM: Register Gambar Tower Otomatis
    const towerTypes = ["panah", "bomb", "ice", "lightning", "poison", "magic"];
    
    towerTypes.forEach(type => {
        for (let i = 1; i <= 3; i++) {
            // Logika Penamaan: Jika level 1, nama file asli tidak pakai angka (contoh: tower_bomb.png)
            // Jika level > 1, pakai angka (contoh: tower_bomb2.png)
            let fileName = i === 1 ? `tower_${type}.png` : `tower_${type}${i}.png`;
            
            assetList.push({
                name: `tower_${type}${i}`, // Key "name" tetap konsisten menggunakan angka (cth: tower_bomb1)
                src: `Asset/Tower_${type}/${fileName}`
            });
        }
    });

    // 4. Proses Loading Gambar (Promises)
    const promises = assetList.map(asset => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = asset.src;
            
            img.onload = () => {
                images[asset.name] = img;
                resolve(); 
            };
            
            img.onerror = () => {
                console.warn(`⚠️ Gagal memuat: ${asset.src}. Cek nama folder atau ekstensi (.png/.jpg)`);
                
                // SISTEM ANTI-CRASH: Mengubah gambar rusak menjadi transparan agar game tidak terhenti
                const dummyImg = new Image();
                dummyImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
                images[asset.name] = dummyImg; 
                resolve(); 
            };
        });
    });

    // 5. Resolusi Keseluruhan
    return Promise.all(promises).then(() => {
        console.log("✅ Semua aset berhasil dimuat:", images);
    });
}
