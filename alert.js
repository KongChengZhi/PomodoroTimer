document.getElementById('startNext').addEventListener('click', () => {
  // 发送消息给background script开始下一个计时
  chrome.runtime.sendMessage({ action: 'START' });
  window.close();
});

document.getElementById('close').addEventListener('click', () => {
  window.close();
});
