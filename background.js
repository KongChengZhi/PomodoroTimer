let timer = null;
let timeLeft = 0;
let isRunning = false;
let currentMode = 25; // 默认25分钟

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'START':
      startTimer(request.mode);
      break;
    case 'PAUSE':
      pauseTimer();
      break;
    case 'RESET':
      resetTimer(request.mode);
      break;
    case 'GET_STATE':
      sendResponse({
        isRunning,
        timeLeft,
        currentMode
      });
      break;
  }
  // 返回true表示会异步发送响应
  return true;
});

function startTimer(mode) {
  if (!isRunning) {
    currentMode = mode || currentMode;
    if (timeLeft === 0) {
      timeLeft = currentMode * 60;
    }
    isRunning = true;
    
    // 使用chrome.alarms API来保持计时器在后台运行
    chrome.alarms.create('pomodoroTimer', {
      periodInMinutes: 1/60 // 每秒触发一次
    });
    
    // 保存状态
    saveState();
    
    // 广播状态更新
    broadcastState();
  }
}

function pauseTimer() {
  if (isRunning) {
    isRunning = false;
    chrome.alarms.clear('pomodoroTimer');
    saveState();
    broadcastState();
  }
}

function resetTimer(mode) {
  isRunning = false;
  currentMode = mode || currentMode;
  timeLeft = currentMode * 60;
  chrome.alarms.clear('pomodoroTimer');
  saveState();
  broadcastState();
}

// 监听alarm事件
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'pomodoroTimer' && isRunning) {
    timeLeft--;
    
    if (timeLeft <= 0) {
      // 时间到，发送通知
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: '番茄钟时间到！',
        message: `${currentMode}分钟时间已到！`,
        priority: 2
      });
      
      // 重置计时器
      pauseTimer();
      timeLeft = 0;
    }
    
    saveState();
    broadcastState();
  }
});

// 广播状态给所有打开的popup
function broadcastState() {
  chrome.runtime.sendMessage({
    action: 'STATE_UPDATE',
    state: {
      isRunning,
      timeLeft,
      currentMode
    }
  });
}

// 保存状态到storage
function saveState() {
  chrome.storage.local.set({
    timerState: {
      isRunning,
      timeLeft,
      currentMode
    }
  });
}

// 从storage恢复状态
chrome.storage.local.get(['timerState'], (result) => {
  if (result.timerState) {
    isRunning = result.timerState.isRunning;
    timeLeft = result.timerState.timeLeft;
    currentMode = result.timerState.currentMode;
    
    if (isRunning) {
      startTimer();
    }
  }
});
