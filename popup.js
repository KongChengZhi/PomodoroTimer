document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer');
    const startStopButton = document.getElementById('startStop');
    const resetButton = document.getElementById('reset');
    const modeSelect = document.getElementById('timerMode');
    
    let isPaused = false;
    let hasStarted = false; // 添加标记是否已经开始过
    
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

    // 更新计时器显示
    function updateDisplay(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 更新按钮状态
    function updateButtonState(isRunning) {
        if (isRunning) {
            startStopButton.textContent = '暂停';
            startStopButton.style.backgroundColor = '#ff9800';
            isPaused = false;
            hasStarted = true;
        } else {
            chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
                if (response) {
                    const totalTime = response.currentMode * 60;
                    // 如果从未开始过或时间是满的，显示"开始"
                    if (!hasStarted || response.timeLeft === totalTime) {
                        startStopButton.textContent = '开始';
                        isPaused = false;
                    } 
                    // 如果有剩余时间且不是满的，说明是暂停状态
                    else if (response.timeLeft > 0 && response.timeLeft < totalTime) {
                        startStopButton.textContent = '继续';
                        isPaused = true;
                    }
                    // 如果时间用完，显示"开始"
                    else {
                        startStopButton.textContent = '开始';
                        isPaused = false;
                        hasStarted = false;
                    }
                }
            });
            startStopButton.style.backgroundColor = '#4CAF50';
        }
    }

    // 从background获取初始状态
    chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
        if (response) {
            updateDisplay(response.timeLeft);
            updateButtonState(response.isRunning);
            modeSelect.value = response.currentMode;
            // 如果有剩余时间且不是满的，说明之前开始过
            const totalTime = response.currentMode * 60;
            if (response.timeLeft > 0 && response.timeLeft < totalTime) {
                hasStarted = true;
            }
        }
    });

    // 监听来自background的状态更新
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'STATE_UPDATE') {
            updateDisplay(request.state.timeLeft);
            updateButtonState(request.state.isRunning);
        }
        return true;
    });

    // 开始/暂停按钮事件
    startStopButton.addEventListener('click', () => {
        const buttonText = startStopButton.textContent;
        if (buttonText === '暂停') {
            chrome.runtime.sendMessage({ action: 'PAUSE' });
        } else {
            // 无论是"开始"还是"继续"，都发送START命令
            chrome.runtime.sendMessage({ 
                action: 'START',
                mode: parseInt(modeSelect.value)
            });
        }
    });

    // 重置按钮事件
    resetButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ 
            action: 'RESET',
            mode: parseInt(modeSelect.value)
        });
        isPaused = false;
        hasStarted = false;
    });

    // 模式选择事件
    modeSelect.addEventListener('change', () => {
        chrome.runtime.sendMessage({ 
            action: 'RESET',
            mode: parseInt(modeSelect.value)
        });
        isPaused = false;
        hasStarted = false;
    });
});
