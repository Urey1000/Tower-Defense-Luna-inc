// ============================
// TIPS LOADING
// ============================

const tips = [
    "🏹 Archer Tower memiliki attack speed tinggi.",
    "❄️ Ice Tower dapat memperlambat musuh.",
    "🔥 Magic Tower memiliki damage besar.",
    "💰 Simpan gold untuk wave berikutnya.",
    "👑 Boss memiliki HP jauh lebih besar."
];

const tipsElement = document.getElementById("tips");
const bar = document.getElementById("progress");
const text = document.getElementById("percent");

let progress = 0;
let tipIndex = Math.floor(Math.random() * tips.length);
let tipsInterval = null;

// Ambil mode yang dipilih
const mode = localStorage.getItem("gameMode") || "easy";

// ============================
// GANTI TIPS
// ============================

function changeTip() {

    if (!tipsElement) return;

    tipsElement.classList.remove("pop-animation");

    void tipsElement.offsetWidth;

    tipsElement.innerHTML = tips[tipIndex];

    tipsElement.classList.add("pop-animation");

    tipIndex++;

    if (tipIndex >= tips.length) {
        tipIndex = 0;
    }

}

// ============================
// SUARA TING
// ============================

function playTingSound() {

    try {

        const AudioContext = window.AudioContext || window.webkitAudioContext;

        const ctx = new AudioContext();

        const osc = ctx.createOscillator();

        const gain = ctx.createGain();

        osc.type = "triangle";

        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);

    } catch (e) {
        console.log("Audio tidak didukung");
    }

}

// ============================
// LOADING
// ============================

function simulateGameLoading() {

    let increment = Math.floor(Math.random() * 4) + 1;

    // Sedikit melambat di akhir
    if (progress >= 75 && progress <= 90) {

        increment = Math.random() < 0.7 ? 0 : 1;

    }

    progress += increment;

    if (progress > 100) progress = 100;

    if (bar) {

        bar.style.width = progress + "%";

    }

    if (text) {

        text.textContent = progress + "%";

    }

    if (progress < 100) {

        setTimeout(simulateGameLoading, 20);

    } else {

        if (tipsInterval) {

            clearInterval(tipsInterval);

        }

        playTingSound();

        // Simpan lagi mode supaya aman
        localStorage.setItem("gameMode", mode);

        setTimeout(() => {

            // ==========================
            // GANTI KE HALAMAN GAME
            // ==========================
            window.location.href = "game.html";

        }, 600);

    }

}

// ============================
// START
// ============================

window.onload = () => {

    if (tipsElement) {

        changeTip();

        tipsInterval = setInterval(changeTip, 2500);

    }

    simulateGameLoading();

};