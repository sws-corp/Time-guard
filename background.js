let currentStartTime = Date.now();
let currentUrl = null;
let checkInterval = null;
let lastWarningShown = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentSessionTime') {
    const domain = currentUrl ? getWebsiteHostname(currentUrl) : null;
    const sessionTime = domain ? Date.now() - currentStartTime : 0;
    sendResponse({
      domain: domain,
      time: sessionTime
    });
    return true;
  }
  
  if (request.action === 'warningDismissed') {
    lastWarningShown[request.domain] = Date.now();
    sendResponse({success: true});
    return true;
  }
  
  if (request.action === 'closeTab') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.remove(tabs[0].id);
      }
    });
    sendResponse({success: true});
    return true;
  }
});

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs && tabs.length > 0) {
    currentUrl = tabs[0].url;
    currentStartTime = Date.now();
    startPeriodicCheck();
  }
});

function getWebsiteHostname(url) {
  try {
    if (!url) return null;
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const parts = hostname.split('.');
    const domain = parts.length >= 2 
      ? parts.slice(-2).join('.') 
      : hostname;
    return domain;
  } catch (e) {
    console.error('Error parsing URL:', e);
    return null;
  }
}

// Vérification périodique toutes les 5 secondes
function startPeriodicCheck() {
  if (checkInterval) clearInterval(checkInterval);
  
  checkInterval = setInterval(async () => {
    if (currentUrl) {
      const domain = getWebsiteHostname(currentUrl);
      if (domain) {
        const time_spend = Date.now() - currentStartTime;
        const data = await chrome.storage.local.get([domain]);
        const totalTime = (data[domain] || 0) + time_spend;
        
        await checkTimeLimitWithTime(domain, totalTime);
      }
    }
  }, 5000);
}

async function UpdateTime() {
  if (!currentUrl) return;

  const domain = getWebsiteHostname(currentUrl);
  if (domain) {
    const time_spend = Date.now() - currentStartTime;
    const data = await chrome.storage.local.get([domain]);
    const newTotal = (data[domain] || 0) + time_spend;
    
    await chrome.storage.local.set({
      [domain]: newTotal
    });
    
    await checkTimeLimit(domain);
  }

  currentStartTime = Date.now();
}

async function checkTimeLimit(domain) {
  const data = await chrome.storage.local.get(['time_limits', domain]);
  const timeSpentMs = data[domain] || 0;
  await checkTimeLimitWithTime(domain, timeSpentMs);
}

async function checkTimeLimitWithTime(domain, timeSpentMs) {
  const data = await chrome.storage.local.get(['time_limits']);
  const limits = data.time_limits || {};
  
  if (limits[domain]) {
    const timeSpentMin = timeSpentMs / 1000 / 60;
    const limitMin = limits[domain];
    
    if (timeSpentMin >= limitMin) {
      const lastWarning = lastWarningShown[domain] || 0;
      const timeSinceLastWarning = Date.now() - lastWarning;
      
      if (timeSinceLastWarning >= 30000) {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs[0]) {
          const tabDomain = getWebsiteHostname(tabs[0].url);
          if (tabDomain === domain) {
            try {
              await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'showTimeWarning',
                site: domain,
                limit: limitMin,
                spent: timeSpentMin.toFixed(1)
              });
              lastWarningShown[domain] = Date.now();
            } catch (err) {
              console.error('Error sending warning:', err);
            }
          }
        }
      }
    }
  }
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await UpdateTime();

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    currentUrl = tab.url;
    currentStartTime = Date.now();
    startPeriodicCheck();
  } catch (e) {
    currentUrl = null;
    console.error('Error getting tab:', e);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    UpdateTime();
    currentUrl = tab.url;
    currentStartTime = Date.now();
    startPeriodicCheck();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await UpdateTime();
    currentUrl = null;
    if (checkInterval) clearInterval(checkInterval);
  } else {
    const tabs = await chrome.tabs.query({active: true, windowId: windowId});
    if (tabs.length > 0) {
      currentStartTime = Date.now();
      currentUrl = tabs[0].url;
      startPeriodicCheck();
    }
  }
});