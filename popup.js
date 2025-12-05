setAndResetStat();
printIntoHtml();

async function printIntoHtml(num = 5) {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  const activeUrl = tabs[0]?.url;
  
  let currentDomain = null;
  let currentSessionTime = 0;
  
  if (activeUrl) {
    currentDomain = getWebsiteHostname(activeUrl);
    try {
      const response = await chrome.runtime.sendMessage({action: 'getCurrentSessionTime'});
      if (response && response.domain === currentDomain) {
        currentSessionTime = response.time;
      }
    } catch (e) {
      console.error('Error getting session time:', e);
    }
  }
  
  const limitsData = await chrome.storage.local.get(['time_limits']);
  const limits = limitsData.time_limits || {};
  
  chrome.storage.local.get(null, (data) => {
    const siteEntries = Object.entries(data)
      .filter(([key, value]) => typeof value === "number")
      .map(([site, ms]) => {
        const totalMs = site === currentDomain ? ms + currentSessionTime : ms;
        return [site, totalMs];
      })
      .sort((a, b) => b[1] - a[1]);

    const siteContainer = document.createElement("div");
    siteContainer.classList.add("gap-medium", "col", "pt", "pb");
    
    for (let i = 0; i < num && i < siteEntries.length; i++) {
      const [site, ms] = siteEntries[i];
      const minutes = (ms / 1000 / 60).toFixed(1);

      const container = document.createElement("div");
      container.classList.add("row", "gap-tiny", "pr", "pl");
      
      const fav = document.createElement("img");
      fav.src = "https://www.google.com/s2/favicons?sz=128&domain_url=" + site;
      fav.classList.add("icon");
      
      const p = document.createElement("p");
      p.textContent = `${site} : ${minutes} min`;
      
      const isOverLimit = limits[site] && (ms / 1000 / 60) >= limits[site];
      
      if (site === currentDomain) {
        p.style.fontWeight = 'bold';
        p.style.color = isOverLimit ? '#ff4444' : '#71B778';
      } else if (isOverLimit) {
        p.style.color = '#ff4444';
      }
      
      container.appendChild(fav);
      container.appendChild(p);
      siteContainer.appendChild(container);
    }
    
    document.body.appendChild(siteContainer);
  });
}

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
    return null;
  }
}

async function setAndResetStat() {
  const all = await chrome.storage.local.get(null);
  const today = new Date().toDateString();

  if (!all.init_date || all.init_date !== today) {
    const resetObj = { init_date: today };

    for (const [key, value] of Object.entries(all)) {
      if (key === "init_date" || key === "time_limits") continue;
      if (typeof value === "number") {
        resetObj[key] = 0;
      }
    }

    await chrome.storage.local.set(resetObj);
  }
}

document.getElementById('settingsLink').addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = 'settings.html';
});