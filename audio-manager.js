// ==========================================================================
// AUDIO MANAGER - LUNA-INC TOWER DEFENSE
// ==========================================================================

// 1. GLOBAL STATE & ASSETS CONFIGURATION
const bgMusic = new Audio();
bgMusic.loop = true; // BGM akan otomatis berulang-ulang

const sounds = {};
let soundsLoaded = 0;

// Daftar Efek Suara (SFX) Game - PATH DIUBAH KE DEFAUL/FALLBACK MAGICSHOOT Sesuai Permintaan
const soundList = [
    { name: "shoot_archer", src: "Asset/audio/panah.wav" },
    { name: "shoot_cannon", src: "Asset/audio/bom.wav" },
    { name: "shoot_magic", src: "Asset/audio/magicshoot.wav" }, 
    { name: "shoot_poison", src: "Asset/audio/poison.wav" },
    { name: "shoot_lightning", src: "Asset/audio/magicshoot.wav" }, // Diperbaiki dari lightning.wav
    { name: "shoot_ice", src: "Asset/audio/magicshoot.wav" },       // Diperbaiki dari ice.wav
    { name: "start", src: "Asset/audio/play.wav" },
    { name: "notif", src: "Asset/audio/notif.wav" },
    { name: "gameover", src: "Asset/audio/naga.wav" },
    { name: "dragon_fire", src: "Asset/audio/naga.wav" }             // DITAMBAHKAN: SFX Semburan Api Naga
];

// ==========================================================================
// 2. CORE FUNCTIONS (FUNGSI UTAMA)
// ==========================================================================

/**
 * Memuat semua aset SFX ke dalam memori
 */
function loadSounds() {
    soundList.forEach(snd => {
        const audio = new Audio();
        audio.src = snd.src;
        audio.oncanplaythrough = () => soundsLoaded++;
        audio.onerror = () => {
            console.warn(`Gagal memuat sfx: ${snd.src}`);
            soundsLoaded++; // Tetap ditambah agar tidak membuat game stuck
        };
        sounds[snd.name] = audio;
    });
}

/**
 * Mengambil konfigurasi volume terupdate dari localStorage
 * @returns {object} { isMuted: boolean, volumeRatio: number }
 */
function getVolumeSettings() {
    const isMuted = localStorage.getItem("isMuted") === "true";
    const volumeValue = localStorage.getItem("gameVolume");
    const volume = volumeValue !== null ? parseInt(volumeValue) : 60;
    
    return {
        isMuted: isMuted,
        volumeRatio: isMuted ? 0 : volume / 100
    };
}

/**
 * Menerapkan volume ke Background Music (BGM) secara real-time
 */
function applyVolumeSettings() {
    const settings = getVolumeSettings();
    let finalVolume = settings.volumeRatio;

    // Jika lagu yang diputar adalah warsound.mp3 (dalam game), turunkan volume otomatis menjadi 40%
    if (bgMusic.src && bgMusic.src.includes("warsound.mp3")) {
        finalVolume = finalVolume * 0.4;
    }

    bgMusic.volume = finalVolume;
}

/**
 * Memutar Efek Suara (SFX) dengan klonning agar bisa bertumpuk
 * @param {string} name - Nama sfx sesuai yang didaftarkan
 */
function playSound(name) {
    if (sounds[name]) {
        const settings = getVolumeSettings();
        
        // Jika di-mute, batalkan pemutaran SFX demi performa
        if (settings.isMuted) return;

        // cloneNode() agar suara bisa berbunyi bersamaan tanpa memotong suara sebelumnya
        const soundClone = sounds[name].cloneNode();
        
        // Volume SFX dasar (0.7) dikalikan dengan rasio master volume dari settings
        soundClone.volume = 0.7 * settings.volumeRatio; 
        
        soundClone.play().catch(e => console.warn(`SFX '${name}' terblokir browser:`, e));
    }
}

/**
 * Mengontrol Play/Pause BGM secara manual atau mengganti track lagu
 * @param {boolean} play - True untuk putar, False untuk berhenti
 * @param {string} [trackSrc] - (Opsional) URL/Path lagu baru jika ingin ganti musik
 */
function toggleBGM(play, trackSrc = null) {
    if (trackSrc && !bgMusic.src.includes(trackSrc)) {
        bgMusic.src = trackSrc;
    }
    
    if (play) {
        applyVolumeSettings();
        bgMusic.play().catch(e => console.warn("BGM terblokir autoplay browser:", e));
    } else {
        bgMusic.pause();
    }
}

/**
 * Memutar suara tembakan otomatis berdasarkan tipe tower
 * @param {string} towerType 
 */
function playTowerSound(towerType) {
    // BUG FIX: Menyamakan nama key dengan ID Tower yang ada di TOWER_DATA (panah dan bomb)
    const soundMap = {
        'panah': 'shoot_archer',
        'bomb': 'shoot_cannon',
        'ice': 'shoot_ice',
        'poison': 'shoot_poison',
        'lightning': 'shoot_lightning',
        'magic': 'shoot_magic'
    };

    const soundName = soundMap[towerType.toLowerCase()];
    if (soundName) {
        playSound(soundName);
    }
}

// ==========================================================================
// 3. INITIALIZATION & INITIAL LISTENERS (SAAT HALAMAN DIMUAT)
// ==========================================================================

// Jalankan load sounds langsung agar proses download aset dicicil oleh browser
loadSounds();

document.addEventListener("DOMContentLoaded", () => {
    
    // A. Deteksi otomatis halaman untuk menyetel lagu yang sesuai (Path BGM diperbaiki)
    const currentPath = window.location.pathname.toLowerCase();
    let targetBGM = "Asset/audio/menu.mp3"; 

    if (currentPath.includes("game")) {
        targetBGM = "Asset/audio/warsound.mp3";
    } else if (currentPath.includes("loading")) {
        targetBGM = "Asset/audio/Loading.wav";
    } else {
        targetBGM = "Asset/audio/menu.mp3"; // Berlaku untuk index, about, settings
    }

    // Set src lagu jika berbeda dengan yang berjalan saat ini
    if (!bgMusic.src.includes(targetBGM)) {
        bgMusic.src = targetBGM;
        sessionStorage.setItem("bgmTrack", targetBGM);
        // Reset waktu lagu jika ganti lagu
        sessionStorage.setItem("bgmTime", 0);
    }

    applyVolumeSettings();

    // Pulihkan waktu putar jika lagu masih sama (melanjutkan lagu antar halaman menu)
    const savedTime = sessionStorage.getItem("bgmTime");
    if (savedTime && !currentPath.includes("game") && !currentPath.includes("loading")) {
        bgMusic.currentTime = parseFloat(savedTime);
    }

    // B. Tangani Kebijakan Autoplay Browser
    const startBGM = () => {
        bgMusic.play().catch(() => {
            console.log("Autoplay diblokir. Menunggu interaksi pertama user pada dokumen...");
            // Jika diblokir, tunggu user melakukan klik pertama di area body mana saja
            document.body.addEventListener('click', () => {
                applyVolumeSettings();
                bgMusic.play();
            }, { once: true });
        });
    };

    startBGM();

    // C. Sinkronisasi Memori Detik Lagu & Nama Track secara berkala
    bgMusic.addEventListener("timeupdate", () => {
        sessionStorage.setItem("bgmTime", bgMusic.currentTime);
        sessionStorage.setItem("bgmTrack", bgMusic.src);
    });

    // D. Deteksi Input Halaman Settings untuk Perubahan Volume Real-Time
    const volumeSlider = document.getElementById("volumeSlider");
    const muteBtn = document.getElementById("muteBtn");

    if (volumeSlider) {
        volumeSlider.addEventListener("input", () => {
            applyVolumeSettings();
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener("click", () => {
            // Beri jeda 50ms agar script utama di settings.html selesai menulis ke localStorage
            setTimeout(applyVolumeSettings, 50);
        });
    }
});
