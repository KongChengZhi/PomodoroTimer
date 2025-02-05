document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer');
    const startStopButton = document.getElementById('startStop');
    const resetButton = document.getElementById('reset');
    
    // 自定义选择器相关元素
    const customSelect = document.getElementById('customSelect');
    const selectDropdown = document.getElementById('selectDropdown');
    const selectedText = document.getElementById('selectedText');
    const addNewOption = document.getElementById('addNewOption');
    
    // 配置相关元素
    const configModal = document.getElementById('configModal');
    const closeModal = document.getElementById('closeModal');
    const configName = document.getElementById('configName');
    const configTime = document.getElementById('configTime');
    const timeValue = document.getElementById('timeValue');
    const saveConfig = document.getElementById('saveConfig');
    const cancelConfig = document.getElementById('cancelConfig');
    
    let isPaused = false;
    let hasStarted = false;
    let currentMode = 25; // 当前选中的时间

    // 切换下拉菜单显示状态
    function toggleDropdown() {
        selectDropdown.classList.toggle('show');
    }

    // 关闭下拉菜单
    function closeDropdown() {
        selectDropdown.classList.remove('show');
    }

    // 更新选中的文本
    function updateSelectedText(text, value) {
        selectedText.textContent = text;
        currentMode = parseInt(value);
        closeDropdown();
    }

    // 加载保存的自定义配置
    function loadCustomConfigs() {
        chrome.storage.local.get(['customConfigs'], (result) => {
            const configs = result.customConfigs || [];
            
            // 移除之前的自定义选项
            const options = selectDropdown.querySelectorAll('.custom-option:not(.add-new)');
            options.forEach(option => {
                if (!['25', '5', '15'].includes(option.dataset.value)) {
                    option.remove();
                }
            });
            
            // 添加自定义选项
            configs.forEach(config => {
                const option = document.createElement('div');
                option.className = 'custom-option';
                option.dataset.value = config.time.toString();
                option.innerHTML = `
                    <span>${config.name} (${config.time}分钟)</span>
                    <span class="delete-btn" data-name="${config.name}">×</span>
                `;
                
                // 在"新增安排"选项之前插入
                selectDropdown.insertBefore(option, addNewOption);
                
                // 为删除按钮添加事件监听
                const deleteBtn = option.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    deleteConfig(config.name);
                });
            });
        });
    }

    // 删除配置
    function deleteConfig(name) {
        if (!confirm('确定要删除这个配置吗？')) {
            return;
        }
        
        chrome.storage.local.get(['customConfigs'], (result) => {
            const configs = result.customConfigs || [];
            const newConfigs = configs.filter(config => config.name !== name);
            chrome.storage.local.set({ customConfigs: newConfigs }, () => {
                if (chrome.runtime.lastError) {
                    alert('删除失败：' + chrome.runtime.lastError.message);
                    return;
                }
                loadCustomConfigs();
            });
        });
    }

    // 保存新的自定义配置
    function saveCustomConfig(name, time) {
        // 输入验证
        if (!name.trim()) {
            alert('请输入配置名称');
            return;
        }
        if (time < 1 || time > 90) {
            alert('时间必须在1-90分钟之间');
            return;
        }

        if (time > 30) {
            if (!confirm('注意：超过30分钟的专注时长可能较难持续，建议适当调整。是否继续？')) {
                return;
            }
        }

        chrome.storage.local.get(['customConfigs'], (result) => {
            const configs = result.customConfigs || [];
            // 检查是否存在同名配置
            const existingConfig = configs.find(config => config.name === name);
            if (existingConfig) {
                alert('已存在相同名称的配置');
                return;
            }
            configs.push({ name, time });
            chrome.storage.local.set({ customConfigs: configs }, () => {
                if (chrome.runtime.lastError) {
                    alert('保存失败：' + chrome.runtime.lastError.message);
                    return;
                }
                loadCustomConfigs();
                closeConfigModal();
            });
        });
    }

    // 初始化事件监听
    customSelect.addEventListener('click', toggleDropdown);
    
    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            closeDropdown();
        }
    });

    // 选项点击事件
    selectDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-option');
        if (!option) return;
        
        if (option.classList.contains('add-new')) {
            configModal.style.display = 'block';
        } else {
            const value = option.dataset.value;
            const text = option.querySelector('span').textContent;
            updateSelectedText(text, value);
            
            chrome.runtime.sendMessage({ 
                action: 'RESET',
                mode: parseInt(value)
            });
            isPaused = false;
            hasStarted = false;
        }
    });

    // 初始化滑块事件
    configTime.addEventListener('input', () => {
        const time = parseInt(configTime.value);
        timeValue.textContent = time + ' 分钟';
        
        // 当滑动超过30分钟时显示提示文字
        const warningText = document.getElementById('timeWarning');
        if (time > 30) {
            if (!warningText) {
                const warning = document.createElement('div');
                warning.id = 'timeWarning';
                warning.style.color = '#ff9800';
                warning.style.fontSize = '12px';
                warning.style.marginTop = '5px';
                warning.textContent = '提示：较长的时间可能更难保持专注';
                document.querySelector('.time-warning-container').appendChild(warning);
            }
        } else {
            if (warningText) {
                warningText.remove();
            }
        }
    });

    // 关闭模态框的方法
    function closeConfigModal() {
        configModal.style.display = 'none';
        configName.value = '';
        configTime.value = '25';
        timeValue.textContent = '25 分钟';
    }

    // 配置对话框事件
    closeModal.addEventListener('click', closeConfigModal);
    cancelConfig.addEventListener('click', closeConfigModal);

    saveConfig.addEventListener('click', () => {
        const name = configName.value.trim();
        const time = parseInt(configTime.value);
        
        if (!name) {
            alert('请输入名称');
            return;
        }
        
        saveCustomConfig(name, time);
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === configModal) {
            closeConfigModal();
        }
    });
    
    // 初始化主题切换
    const themeToggleObj = document.getElementById('themeToggle');
    themeToggleObj.addEventListener('load', function() {
        const svg = this.contentDocument.querySelector('svg');
        const themeToggle = new ThemeToggle(svg);
        
        chrome.storage.local.get(['theme'], (result) => {
            if (result.theme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                themeToggle.toggle();
            }
        });
        
        svg.addEventListener('themeChange', (e) => {
            const theme = e.detail.theme;
            document.body.setAttribute('data-theme', theme);
            chrome.storage.local.set({ theme: theme });
        });
    });

    function updateDisplay(timeLeft) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

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
                    if (!hasStarted || response.timeLeft === totalTime) {
                        startStopButton.textContent = '开始';
                        isPaused = false;
                    } else if (response.timeLeft > 0 && response.timeLeft < totalTime) {
                        startStopButton.textContent = '继续';
                        isPaused = true;
                    } else {
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
            currentMode = response.currentMode;
            // 更新选中的文本
            const option = selectDropdown.querySelector(`[data-value="${currentMode}"]`);
            if (option) {
                selectedText.textContent = option.querySelector('span').textContent;
            }
            const totalTime = response.currentMode * 60;
            if (response.timeLeft > 0 && response.timeLeft < totalTime) {
                hasStarted = true;
            }
        }
    });

    // 加载保存的自定义配置
    loadCustomConfigs();

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
            chrome.runtime.sendMessage({ 
                action: 'START',
                mode: currentMode
            });
        }
    });

    // 重置按钮事件
    resetButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ 
            action: 'RESET',
            mode: currentMode
        });
        isPaused = false;
        hasStarted = false;
    });
});
