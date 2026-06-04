const TOTAL_TIME = 105;
const findings = {
  bronchitis: "慢性支氣管炎：長期吸入菸霧會刺激支氣管，使咳嗽、痰液與呼吸不順反覆發生。",
  bone: "齒槽骨萎縮：吸菸會影響牙周血流與修復力，增加牙齒鬆動與掉牙風險。",
  brain: "腦部血管阻塞或破裂：菸品會傷害血管，提高中風與腦血管事件風險。",
  periodontal: "牙周病：菸霧會讓牙齦發炎惡化，也讓治療與癒合變慢。",
  emphysema: "肺氣腫：肺泡受損後換氣能力下降，容易喘、缺氧，且傷害難以回復。"
};

const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");
const loseScreen = document.getElementById("loseScreen");
const startBtn = document.getElementById("startBtn");
const hintBtn = document.getElementById("hintBtn");
const oxygenFill = document.getElementById("oxygenFill");
const timerText = document.getElementById("timerText");
const foundText = document.getElementById("foundText");
const toast = document.getElementById("toast");
const damagedZone = document.getElementById("damagedZone");

let secondsLeft = TOTAL_TIME;
let timerId = null;
let active = false;
let found = new Set();
let toastTimer = null;
let radarEl = null;

// RWD 高度動態計算修正
function setAppHeight() {
  document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`);
}

setAppHeight();
window.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", () => setTimeout(setAppHeight, 250));
document.addEventListener("touchmove", event => event.preventDefault(), { passive: false });

function formatTime(value) {
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const seconds = String(value % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateStatus() {
  timerText.textContent = formatTime(secondsLeft);
  foundText.textContent = String(found.size);
  const percent = Math.max(0, (secondsLeft / TOTAL_TIME) * 100);
  oxygenFill.style.width = `${percent}%`;
  oxygenFill.style.background = percent < 28
    ? "linear-gradient(90deg, #ff4966, #ffd45a)"
    : "linear-gradient(90deg, #20f4ff, #a8ff68)";
}

function resetGame() {
  clearInterval(timerId);
  active = false;
  secondsLeft = TOTAL_TIME;
  found = new Set();
  document.querySelectorAll(".hotspot").forEach(button => button.classList.remove("found"));
  clearRadar();
  updateStatus();
  hintBtn.disabled = false;
  winScreen.classList.remove("show");
  loseScreen.classList.remove("show");
  startScreen.classList.add("show");
  hideToast();
}

function beginTimerAfterRender() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      active = true;
      timerId = setInterval(() => {
        if (!active) return;
        secondsLeft--;
        updateStatus();
        if (secondsLeft <= 0) finish(false);
      }, 1000);
    });
  });
}

function startGame() {
  resetGame();
  startScreen.classList.remove("show");
  showToast("O2 掃描啟動：點擊下方病變圖的異狀。");
  beginTimerAfterRender();
}

function handleFind(button) {
  if (!active) return;
  const id = button.dataset.id;
  if (!id || found.has(id)) return;
  found.add(id);
  button.classList.add("found");
  clearRadar();
  showToast(findings[id]);
  updateStatus();
  if (found.size >= 5) finish(true);
}

function finish(win) {
  active = false;
  clearInterval(timerId);
  clearRadar();
  setTimeout(() => {
    if (win) winScreen.classList.add("show");
    else loseScreen.classList.add("show");
  }, win ? 360 : 0);
}

function showHint() {
  if (!active) return;
  const remaining = [...document.querySelectorAll(".hotspot")]
    .filter(button => !found.has(button.dataset.id));
  if (!remaining.length) return;
  const target = remaining[0];
  clearRadar();
  radarEl = document.createElement("div");
  radarEl.className = "radar";
  radarEl.style.left = target.style.left;
  radarEl.style.top = target.style.top;
  damagedZone.appendChild(radarEl);
  showToast("O2 雷達已圈出一個可疑異狀。");
}

function clearRadar() {
  if (radarEl) {
    radarEl.remove();
    radarEl = null;
  }
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 2600);
}

function hideToast() {
  toast.classList.remove("show");
}

function downloadTruth() {
  const content = [
    "關卡 2：器官損害紀錄 - 數據真相",
    "",
    "吸菸與電子煙可能造成或提高以下健康風險：",
    "1. 慢性支氣管炎：支氣管長期受刺激，咳嗽、痰液與呼吸不順反覆出現。",
    "2. 齒槽骨萎縮：牙周組織修復變差，增加牙齒鬆動與掉牙風險。",
    "3. 腦部血管阻塞或破裂：血管受損，提高中風與腦血管事件風險。",
    "4. 牙周病：牙齦發炎惡化，治療與癒合變慢。",
    "5. 肺氣腫：肺泡受損，換氣能力下降，缺氧與喘的症狀變嚴重。"
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "stage2-organ-damage-truth.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// 綁定觸控事件，防止移動端延遲與雙擊縮放
function bindPress(element, action) {
  let touchedAt = 0;
  element.addEventListener("pointerdown", event => {
    event.preventDefault();
    touchedAt = Date.now();
    action();
  });
  element.addEventListener("click", event => {
    event.preventDefault();
    if (Date.now() - touchedAt < 350) return;
    action();
  });
}

// 初始化綁定
bindPress(startBtn, startGame);
bindPress(hintBtn, showHint);

document.querySelectorAll(".hotspot").forEach(button => {
  bindPress(button, () => handleFind(button));
});

document.querySelectorAll("[data-retry]").forEach(button => {
  bindPress(button, resetGame);
});

bindPress(document.getElementById("downloadBtn"), downloadTruth);

// 初始化狀態顯示
updateStatus();