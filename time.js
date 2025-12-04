setAndResetStat();
printIntoHtml();
let currentStartTime = Date.now();
let currentUrl = null;

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  if (tabs && tabs.length > 0) {
    currentUrl = tabs[0].url;
  }
});
function printIntoHtml(num = 5) {
  chrome.storage.local.get(null, (data) => {

    const siteEntries = Object.entries(data)
      .filter(([key, value]) => typeof value === "number")
      .sort((a, b) => b[1] - a[1]);

    for (let i = 0; i < num && i < siteEntries.length; i++) {
      const [site, ms] = siteEntries[i];

      const seconds = (ms / 1000).toFixed(1);
      const minutes = (ms / 1000 / 60).toFixed(2);

      console.log(`🌍 ${site} : ${seconds} s (${minutes} min)`);

      const fav = document.createElement("img");
      fav.src = "https://www.google.com/s2/favicons?sz=64&domain_url=" + site;
      const p = document.createElement("p");
      p.textContent = `${site} : ${seconds}s (${minutes} min)`;

      document.body.appendChild(fav);
      document.body.appendChild(p);
    }
  });
}
async function setAndResetStat() {
  // récupère tout
  const all = await chrome.storage.local.get(null);
  const today = new Date().toDateString();

  if (!all.init_date || all.init_date !== today) {
    const resetObj = { init_date: today };

    for (const [key, value] of Object.entries(all)) {
      if (key === "init_date") continue;
      if (typeof value === "number") {
        resetObj[key] = 0;
      }
    }

    await chrome.storage.local.set(resetObj);
    console.log("Jour changé -> init_date mise à jour et stats numériques reset.");
  }
}
function getWebsiteHostname(url) {
  try {
    if (!url) return null;
    const domain = new URL(url).hostname.split('.').slice(-2).join('.');
    console.log("Domaine détecté : " + domain);
    return domain;
  } catch (e) {
    return null;
  }
}
async function UpdateTime() {
  if (!currentUrl) return;

  const domain = getWebsiteHostname(currentUrl);
  if (domain) {
    const time_spend = Date.now() - currentStartTime;

    const data = await chrome.storage.local.get([domain]);
    await chrome.storage.local.set({
      [domain]: (data[domain] || 0) + time_spend
    });

    console.log(`Sauvegarde : ${time_spend} ms pour ${domain}`);
  }

  currentStartTime = Date.now();
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await UpdateTime();

  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    currentUrl = tab.url;
    currentStartTime = Date.now();
  } catch (e) {
    currentUrl = null;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    UpdateTime();
    currentUrl = tab.url;
    currentStartTime = Date.now();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await UpdateTime();
    currentUrl = null;
  } else {
    const tabs = await chrome.tabs.query({active: true, windowId: windowId});
    if (tabs.length > 0) {
      currentStartTime = Date.now();
      currentUrl = tabs[0].url;
    }
  }
});