document.addEventListener("DOMContentLoaded", () => {

    // ============================
    // AMBIL ELEMEN DARI HTML
    // ============================
    const mainMenu = document.getElementById("mainMenu"); 
    const modeMenu = document.getElementById("modeMenu");

    const playBtn = document.getElementById("playBtn");
    const settingBtn = document.getElementById("settingBtn");
    const aboutBtn = document.getElementById("aboutBtn");
    const backBtn = document.getElementById("backBtn");

    const difficultyButtons = document.querySelectorAll(".difficulty-btn");

    // ============================
    // NAVIGASI MENU (PLAY & BACK)
    // ============================
    
    // Saat tombol PLAY diklik, mainkan suara, sembunyikan Menu Utama, tampilkan Pilih Mode
    if (playBtn && mainMenu && modeMenu) {
        playBtn.addEventListener("click", () => {
            
            // Tambahan pemanggilan suara diletakkan langsung di sini
            if (typeof playSound === 'function') {
                playSound('start');
            }
            
            mainMenu.classList.add("hide");
            modeMenu.classList.remove("hide");
        });
    }

    // Saat tombol BACK diklik, sembunyikan Pilih Mode, tampilkan Menu Utama
    if (backBtn && mainMenu && modeMenu) {
        backBtn.addEventListener("click", () => {
            modeMenu.classList.add("hide");
            mainMenu.classList.remove("hide");
        });
    }

    // ============================
    // FUNGSI PILIH TINGKAT KESULITAN
    // ============================
    if (difficultyButtons.length > 0) {
        difficultyButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                const mode = e.currentTarget.dataset.mode;
                startGame(mode);
            });
        });
    }

    // ============================
    // NAVIGASI SETTING & ABOUT
    // ============================
    if (settingBtn) {
        settingBtn.addEventListener("click", () => {
            window.location.href = "settings.html";
        });
    }

    if (aboutBtn) {
        aboutBtn.addEventListener("click", () => {
            window.location.href = "about.html";
        });
    }

    // ============================
    // FUNGSI UTAMA MEMULAI GAME
    // ============================
    function startGame(mode) {
        localStorage.setItem("gameMode", mode);
        console.log("Menyiapkan game dengan mode: " + mode);

        try {
            const mulai = new Audio("mulai.wav");
            mulai.volume = 0.6;
            
            const playPromise = mulai.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Audio tidak diputar (mungkin diblokir browser):", error);
                });
            }
        } catch (e) {
            console.log("File audio tidak tersedia");
        }

        setTimeout(() => {
            window.location.href = "loading.html";
        }, 300);
    }

});
