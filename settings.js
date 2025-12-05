async function loadLimits() {
  const data = await chrome.storage.local.get(['time_limits']);
  const limits = data.time_limits || {};
  
  const container = document.getElementById('limitsList');
  container.innerHTML = '';
  
  for (const [site, minutes] of Object.entries(limits)) {
    const item = document.createElement('div');
    item.className = 'limit-item';
    item.innerHTML = `
      <button class="delete-btn" data-site="${site}">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      <span>${site}</span>
      <input type="number" value="${minutes}" min="1" data-site="${site}" class="minsize">
      <span>minutes</span>
    `;
    container.appendChild(item);
  }
  
  container.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('change', async (e) => {
      const site = e.target.dataset.site;
      const newLimit = parseInt(e.target.value);
      const data = await chrome.storage.local.get(['time_limits']);
      const limits = data.time_limits || {};
      limits[site] = newLimit;
      await chrome.storage.local.set({ time_limits: limits });
    });
  });
  
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const site = e.target.dataset.site;
      const data = await chrome.storage.local.get(['time_limits']);
      const limits = data.time_limits || {};
      delete limits[site];
      await chrome.storage.local.set({ time_limits: limits });
      loadLimits();
    });
  });
}

document.getElementById('addBtn').addEventListener('click', async () => {
  const site = document.getElementById('siteInput').value.trim();
  const limit = parseInt(document.getElementById('limitInput').value);
  
  if (!site || !limit || limit < 1) {
    alert('Veuillez remplir tous les champs correctement');
    return;
  }
  
  const data = await chrome.storage.local.get(['time_limits']);
  const limits = data.time_limits || {};
  limits[site] = limit;
  await chrome.storage.local.set({ time_limits: limits });
  
  document.getElementById('siteInput').value = '';
  document.getElementById('limitInput').value = '';
  loadLimits();
});

loadLimits();