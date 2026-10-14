// ── Timer length setting ──────────────────────────────────────────────────────
// Change this number to set how long the timer runs.
// 15 = 15-second test mode. Use 25 * 60 = 1500 for the real 25-minute timer.
const TIMER_SECONDS = 15;
// ─────────────────────────────────────────────────────────────────────────────

const display   = document.getElementById('display');
const btnStart  = document.getElementById('btn-start');
const btnPause  = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');
const btnReset  = document.getElementById('btn-reset');
const doneMsg   = document.getElementById('done-msg');

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

  if (left <= 0 && running) {
    finish();
  }
}

function finish() {
  clearInterval(tickInterval);
  running = false;
  display.textContent = formatTime(0);
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
