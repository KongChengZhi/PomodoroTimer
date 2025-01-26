document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer');
    const startStopButton = document.getElementById('startStop');
    const resetButton = document.getElementById('reset');
    const modeSelect = document.getElementById('timerMode');
    
    // 初始化主题切换
    const themeToggleObj = document.getElementById('themeToggle');
    themeToggleObj.addEventListener('load', function() {
        const svg = this.contentDocument.querySelector('svg');
        const themeToggle = new ThemeToggle(svg);
        
        // 从storage中恢复主题设置
        chrome.storage.local.get(['theme'], (result) => {
            if (result.theme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                themeToggle.toggle(); // 切换到暗色主题
            }
        });
        
        // 监听主题改变事件
        svg.addEventListener('themeChange', (e) => {
            const theme = e.detail.theme;
            document.body.setAttribute('data-theme', theme);
            // 保存主题设置
            chrome.storage.local.set({ theme: theme });
        });
    });

    let timer;
    let timeLeft;
    let isRunning = false;

    // 更新计时器显示
    function updateDisplay(minutes, seconds) {
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // 更新按钮状态
    function updateButtonState(isRunning) {
        startStopButton.textContent = isRunning ? '暂停' : '开始';
        startStopButton.style.backgroundColor = isRunning ? '#ff9800' : '#4CAF50';
    }

    // 从background获取初始状态
    chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
        if (response) {
            timeLeft = response.timeLeft;
            isRunning = response.isRunning;
            updateDisplay(Math.floor(timeLeft / 60), timeLeft % 60);
            updateButtonState(isRunning);
            modeSelect.value = response.currentMode;
        }
    });

    // 监听来自background的状态更新
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'STATE_UPDATE') {
            timeLeft = request.state.timeLeft;
            isRunning = request.state.isRunning;
            updateDisplay(Math.floor(timeLeft / 60), timeLeft % 60);
            updateButtonState(isRunning);
        }
        return true;
    });

    // 开始/暂停按钮事件
    startStopButton.addEventListener('click', () => {
        if (startStopButton.textContent === '开始') {
            chrome.runtime.sendMessage({ 
                action: 'START',
                mode: parseInt(modeSelect.value)
            });
        } else {
            chrome.runtime.sendMessage({ action: 'PAUSE' });
        }
    });

    // 重置按钮事件
    resetButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ 
            action: 'RESET',
            mode: parseInt(modeSelect.value)
        });
    });

    // 模式选择事件
    modeSelect.addEventListener('change', () => {
        chrome.runtime.sendMessage({ 
            action: 'RESET',
            mode: parseInt(modeSelect.value)
        });
    });
});
