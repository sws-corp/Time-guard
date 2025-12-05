chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showTimeWarning') {
    showWarningOverlay(request.site, request.limit, request.spent);
  }
});

function showWarningOverlay(site, limit, spent) {
  if (document.getElementById('timeguard-overlay')) return;
  
  const container = document.createElement('div');
  container.id = 'timeguard-overlay';
  
  const shadowRoot = container.attachShadow({ mode: 'open' });
  
  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
    }
    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      pointer-events: auto;
    }
    .modal {
      background: white;
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      max-width: 450px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .title {
      color: #ff4444;
      margin: 0 0 20px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .message {
      font-size: 18px;
      margin-bottom: 10px;
      color: #333;
    }
    .limit {
      margin-bottom: 30px;
      color: #666;
      font-size: 16px;
    }
    .buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    button {
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 600;
    }
    .btn-close {
      background: #2196F3;
    }
    .btn-continue {
      background: #71B778;
    }
    button:hover {
      opacity: 0.9;
    }
    strong {
      color: #ff4444;
    }
  `;
  
  const content = document.createElement('div');
  content.className = 'overlay';
  
  const imageUrl = chrome.runtime.getURL('assets/swsane.png');
  
  content.innerHTML = `
    <div class="modal">
      <img src='${imageUrl}' alt="Stop image sws mascotte" style="max-width: 150px; margin-bottom: 20px;"/>
      <h1 class="title">Limite de temps atteinte !</h1>
      <p class="message">
        Vous avez passé <strong>${spent} minutes</strong> sur <strong style="color: #333;">${site}</strong>
      </p>
      <p class="limit">
        Limite configurée : ${limit} minutes par jour
      </p>
      <div class="buttons">
        <button id="timeguard-continue" class="btn-continue">
          Continuer quand même
        </button>
      </div>
    </div>
  `;
  
  shadowRoot.appendChild(style);
  shadowRoot.appendChild(content);
  
  (document.body || document.documentElement).appendChild(container);
  
  shadowRoot.getElementById('timeguard-continue').addEventListener('click', () => {
    container.remove();
    chrome.runtime.sendMessage({
      action: 'warningDismissed',
      domain: site
    });
  });
  
  shadowRoot.getElementById('timeguard-close').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'closeTab'
    });
  });
}