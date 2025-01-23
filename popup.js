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

function updateTimer() {
  if (timeLeft <= 0) {
    clearInterval(timer);
    isRunning = false;
    startStopButton.textContent = '开始';
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: '番茄钟',
      message: '时间到！',
      priority: 2
    });
    return;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  updateDisplay(minutes, seconds);
  timeLeft--;
}

function startTimer() {
  if (!isRunning) {
    if (timeLeft <= 0) {
      timeLeft = timerMode.value * 60;
    }
    timer = setInterval(updateTimer, 1000);
    isRunning = true;
    startStopButton.textContent = '暂停';
  } else {
    clearInterval(timer);
    isRunning = false;
    startStopButton.textContent = '开始';
  }
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  timeLeft = timerMode.value * 60;
  const minutes = Math.floor(timeLeft / 60);
  updateDisplay(minutes, 0);
  startStopButton.textContent = '开始';
}

function changeMode() {
  resetTimer();
}

// 初始化
timeLeft = timerMode.value * 60;
startStopButton.addEventListener('click', startTimer);
resetButton.addEventListener('click', resetTimer);
timerMode.addEventListener('change', changeMode);
