let timer;
let timeLeft;
let isRunning = false;

const timerDisplay = document.getElementById('timer');
const startStopButton = document.getElementById('startStop');
const resetButton = document.getElementById('reset');
const timerMode = document.getElementById('timerMode');

function updateDisplay(minutes, seconds) {
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimerDisplay(timeLeft) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  updateDisplay(minutes, seconds);
}

function updateButtonState(isRunning) {
  startStopButton.textContent = isRunning ? '暂停' : '开始';
}

// 从background script获取状态并更新UI
function getStateAndUpdateUI() {
  chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
    if (response) {
      updateTimerDisplay(response.timeLeft);
      updateButtonState(response.isRunning);
      timerMode.value = response.currentMode;
    }
  });
}

// 监听来自background的状态更新
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'STATE_UPDATE') {
    updateTimerDisplay(request.state.timeLeft);
    updateButtonState(request.state.isRunning);
  }
});

function startTimer() {
  chrome.runtime.sendMessage({
    action: 'START',
    mode: parseInt(timerMode.value)
  });
}

function pauseTimer() {
  chrome.runtime.sendMessage({ action: 'PAUSE' });
}

function resetTimer() {
  chrome.runtime.sendMessage({
    action: 'RESET',
    mode: parseInt(timerMode.value)
  });
}

function handleStartStop() {
  chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
    if (response.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });
}

// 事件监听器
startStopButton.addEventListener('click', handleStartStop);
resetButton.addEventListener('click', resetTimer);
timerMode.addEventListener('change', resetTimer);

// 初始化时获取状态
getStateAndUpdateUI();
