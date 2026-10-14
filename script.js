// ── Timer length setting ──────────────────────────────────────────────────────
// Change this number to set how long the timer runs.
// 15 = 15-second test mode. Use 25 * 60 = 1500 for the real 25-minute timer.
const TIMER_SECONDS = 15;
// ─────────────────────────────────────────────────────────────────────────────

const display        = document.getElementById('display');
const btnStart       = document.getElementById('btn-start');
const btnPause       = document.getElementById('btn-pause');
const btnResume      = document.getElementById('btn-resume');
const btnReset       = document.getElementById('btn-reset');
const doneMsg        = document.getElementById('done-msg');
const painting       = document.getElementById('painting');
const paintingTitle  = document.getElementById('painting-title');
const loadingMsg     = document.getElementById('loading-msg');
const errorMsg       = document.getElementById('error-msg');
const btnTryAgain    = document.getElementById('btn-try-again');

// ── Met Museum painting loader ────────────────────────────────────────────────

// Cached list of highlighted painting IDs so we don't re-fetch on every reset.
let highlightedIDs = null;

async function fetchHighlightedIDs() {
  if (highlightedIDs) return highlightedIDs;
  const url = 'https://collectionapi.metmuseum.org/public/collection/v1/search' +
              '?isHighlight=true&hasImages=true&q=painting';
  const res = await fetch(url);
  const data = await res.json();
  highlightedIDs = data.objectIDs || [];
  return highlightedIDs;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function loadPainting() {
  // Reset to loading state.
  painting.hidden      = true;
  painting.src         = '';
  paintingTitle.textContent = '';
  errorMsg.hidden      = true;
  loadingMsg.hidden    = false;

  let ids;
  try {
    ids = await fetchHighlightedIDs();
  } catch {
    showError();
    return;
  }

  if (!ids.length) { showError(); return; }

  // Try up to 5 random picks.
  const tried = new Set();
  for (let attempt = 0; attempt < 5; attempt++) {
    // Pick an ID we haven't tried yet.
    let id;
    let safety = 0;
    do { id = pickRandom(ids); safety++; } while (tried.has(id) && safety < 20);
    tried.add(id);

    try {
      const res  = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
      const obj  = await res.json();
      if (!obj.isPublicDomain || !obj.primaryImage) continue;

      // Success — show the painting.
      painting.src = obj.primaryImage;
      await new Promise((resolve, reject) => {
        painting.onload  = resolve;
        painting.onerror = reject;
      });
      paintingTitle.textContent = obj.title || 'Untitled';
      loadingMsg.hidden = true;
      painting.hidden   = false;
      return;
    } catch {
      // This pick failed; try the next one.
    }
  }

  showError();
}

function showError() {
  loadingMsg.hidden = true;
  painting.hidden   = true;
  errorMsg.hidden   = false;
}

btnTryAgain.addEventListener('click', loadPainting);

// Load a painting when the page first opens.
loadPainting();

const MAX_BLUR = 20; // pixels of blur at the start

function setBlur(secondsRemaining) {
  // blur shrinks in proportion to how much time is left
  const fraction = secondsRemaining / TIMER_SECONDS; // 1 = full blur, 0 = sharp
  painting.style.filter = `blur(${(MAX_BLUR * fraction).toFixed(2)}px)`;
}

let running       = false;  // is the timer ticking right now?
let startedOnce   = false;  // has it ever been started?
let startedAt     = null;   // real clock time when this run began
let remainingAtPause = TIMER_SECONDS; // seconds left when paused
let tickInterval  = null;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function secondsLeft() {
  if (!running) return remainingAtPause;
  const elapsed = (Date.now() - startedAt) / 1000;
  return Math.max(0, remainingAtPause - elapsed);
}

function updateDisplay() {
  const left = secondsLeft();
  display.textContent = formatTime(Math.ceil(left));
  setBlur(left);

  if (left <= 0 && running) {
    finish();
  }
}

function finish() {
  clearInterval(tickInterval);
  running = false;
  display.textContent = formatTime(0);
  setBlur(0); // fully sharp
  btnPause.hidden  = true;
  btnResume.hidden = true;
  btnReset.hidden  = true;
  doneMsg.hidden   = false;
}

function start() {
  if (running) return; // guard against double-start
  running    = true;
  startedAt  = Date.now();
  startedOnce = true;
  doneMsg.hidden   = true;
  btnStart.hidden  = true;
  btnPause.hidden  = false;
  btnResume.hidden = true;
  btnReset.hidden  = false;
  tickInterval = setInterval(updateDisplay, 500);
  updateDisplay();
}

function pause() {
  if (!running) return;
  remainingAtPause = secondsLeft();
  clearInterval(tickInterval);
  running = false;
  btnPause.hidden  = true;
  btnResume.hidden = false;
}

function resume() {
  if (running) return;
  start();
}

function reset() {
  clearInterval(tickInterval);
  running          = false;
  startedOnce      = false;
  remainingAtPause = TIMER_SECONDS;
  display.textContent = formatTime(TIMER_SECONDS);
  setBlur(TIMER_SECONDS); // back to full blur
  doneMsg.hidden   = true;
  btnStart.hidden  = false;
  btnPause.hidden  = true;
  btnResume.hidden = true;
  btnReset.hidden  = true;
}

// Initialise display
display.textContent = formatTime(TIMER_SECONDS);

btnStart.addEventListener('click', start);
btnPause.addEventListener('click', pause);
btnResume.addEventListener('click', resume);
btnReset.addEventListener('click', reset);
