// make.fun frontend - router, state, service worker registration

import { getBounties, getBounty, getLeaderboard, getProfile, clearCache } from './api.js';
import { renderBoard, attachVirtualList } from './views/board.js';
import { renderBounty } from './views/bounty.js';
import { renderLeaderboard, initLeaderboard } from './views/leaderboard.js';
import { renderProfile } from './views/profile.js';

const app = document.getElementById('app');
const offlineBanner = document.getElementById('offline-banner');
let currentView = null;
let virtualListCleanup = null;
let leaderboardVirtualizer = null;
let countdownInterval = null;

// Shared "now" reference for all live countdowns
let nowRef = Date.now();

/** Start the live countdown ticker */
function startCountdownTicker() {
  if (countdownInterval) return;
  countdownInterval = setInterval(() => {
    nowRef = Date.now();
    updateAllCountdowns();
  }, 30000); // Update every 30 seconds
}

/** Stop the countdown ticker */
function stopCountdownTicker() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

/** Update all countdown elements on the page */
function updateAllCountdowns() {
  document.querySelectorAll('.countdown[data-deadline]').forEach(el => {
    const deadline = el.dataset.deadline;
    const ms = new Date(deadline).getTime() - nowRef;
    if (ms <= 0) {
      el.textContent = 'ended';
      el.classList.remove('live');
      el.classList.add('ended');
      el.closest('.board-row-deadline, .meta-item')?.classList.remove('live');
      el.closest('.board-row-deadline, .meta-item')?.classList.add('ended');
    } else {
      const days = Math.floor(ms / 86400000);
      const hours = Math.floor((ms % 86400000) / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      let text;
      if (days > 0) text = `${days}d ${hours}h`;
      else if (hours > 0) text = `${hours}h ${minutes}m`;
      else text = `${minutes}m`;
      el.textContent = text;
      el.classList.add('live');
      el.classList.remove('ended');
      el.closest('.board-row-deadline, .meta-item')?.classList.add('live');
      el.closest('.board-row-deadline, .meta-item')?.classList.remove('ended');
    }
  });
}

/** Show loading state */
function showLoading() {
  app.innerHTML = `
    <div class="loading" role="status" aria-live="polite">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p>Loading…</p>
    </div>
  `;
}

/** Show error state */
function showError(message, retryAction) {
  app.innerHTML = `
    <div class="error" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
      <p>${message}</p>
      ${retryAction ? `<button class="btn btn-primary" onclick="${retryAction}">Try again</button>` : ''}
    </div>
  `;
}

/** Show offline banner */
function setOffline(online) {
  offlineBanner.hidden = online;
  if (!online) {
    offlineBanner.setAttribute('aria-live', 'polite');
  }
}

/** Handle online/offline events */
window.addEventListener('online', () => setOffline(true));
window.addEventListener('offline', () => setOffline(false));
setOffline(navigator.onLine);

/** Main render function */
async function render() {
  // Clean up previous view
  if (virtualListCleanup) {
    virtualListCleanup();
    virtualListCleanup = null;
  }
  if (leaderboardVirtualizer) {
    leaderboardVirtualizer.destroy();
    leaderboardVirtualizer = null;
  }

  window.__shotReady = false;
  showLoading();

  try {
    // Profile route
    let match = location.hash.match(/^#\/profile\/([^/]+)/);
    if (match) {
      const handle = decodeURIComponent(match[1]);
      const isMe = handle === 'me';
      const profile = await getProfile(isMe ? 'kokonutscereal-dotcom' : handle); // fallback for demo
      document.title = `@${profile.handle} | make.fun bounties`;
      app.innerHTML = renderProfile(profile);
      window.scrollTo(0, 0);
      window.__shotReady = true;
      return;
    }

    // Leaderboard route
    match = location.hash.match(/^#\/bounty\/([^/]+)\/leaderboard/);
    if (match) {
      const slug = decodeURIComponent(match[1]);
      const data = await getLeaderboard(slug);
      document.title = `Leaderboard: ${data.competition.title} | make.fun bounties`;
      app.innerHTML = renderLeaderboard(data);
      leaderboardVirtualizer = initLeaderboard(data, app);
      window.scrollTo(0, 0);
      window.__shotReady = true;
      return;
    }

    // Entries route (not implemented - redirect to leaderboard for now)
    match = location.hash.match(/^#\/bounty\/([^/]+)\/entries/);
    if (match) {
      const slug = decodeURIComponent(match[1]);
      location.hash = `/bounty/${slug}/leaderboard`;
      return;
    }

    // Bounty page route
    match = location.hash.match(/^#\/bounty\/([^/]+)/);
    if (match) {
      const slug = decodeURIComponent(match[1]);
      const bounty = await getBounty(slug);
      document.title = `${bounty.title} | make.fun bounties`;
      app.innerHTML = renderBounty(bounty);
      window.scrollTo(0, 0);
      window.__shotReady = true;
      return;
    }

    // Board route (default)
    document.title = 'make.fun bounties';
    const data = await getBounties();
    app.innerHTML = renderBoard(data);
    const listContainer = app.querySelector('.virtual-list');
    if (listContainer) {
      virtualListCleanup = attachVirtualList(data, listContainer);
    }
    window.scrollTo(0, 0);
    window.__shotReady = true;

  } catch (err) {
    console.error('Render error:', err);
    const isOffline = !navigator.onLine;
    showError(
      isOffline ? 'You appear to be offline. Showing cached data if available.' : 'Failed to load data. Please try again.',
      'render()'
    );
  }
}

/** Initialize countdowns on page */
function initCountdowns() {
  // Add data-deadline attributes to countdown elements for the ticker
  document.querySelectorAll('.countdown').forEach(el => {
    const text = el.textContent.trim();
    // Find the parent row/item to get the deadline
    const row = el.closest('.board-row, .meta-item');
    if (row) {
      // We'd need to store the deadline ISO string - for now skip
    }
  });
  startCountdownTicker();
}

/** Hash change handler */
window.addEventListener('hashchange', render);

/** Service Worker Registration */
async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });
      console.log('SW registered:', reg.scope);

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available - could show update banner
            console.log('New version available');
          }
        });
      });
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  }
}

/** Search form handler */
document.addEventListener('submit', (e) => {
  if (e.target.matches('.search-form')) {
    e.preventDefault();
    const query = e.target.querySelector('input').value.trim().toLowerCase();
    if (query) {
      // Filter current board view or navigate to search
      filterBoard(query);
    }
  }
});

/** Simple client-side filter for board */
function filterBoard(query) {
  const rows = document.querySelectorAll('.board-row:not(.skeleton)');
  rows.forEach(row => {
    const title = row.querySelector('.board-row-title a')?.textContent?.toLowerCase() || '';
    const category = row.querySelector('.category')?.textContent?.toLowerCase() || '';
    const matches = title.includes(query) || category.includes(query);
    row.style.display = matches ? 'grid' : 'none';
  });
}

/** Keyboard shortcuts */
document.addEventListener('keydown', (e) => {
  // "/" to focus search
  if (e.key === '/' && !e.target.matches('input, textarea')) {
    e.preventDefault();
    document.querySelector('.search-form input')?.focus();
  }
  // "Escape" to clear search
  if (e.key === 'Escape') {
    const search = document.querySelector('.search-form input');
    if (search === document.activeElement) {
      search.value = '';
      search.blur();
      filterBoard('');
    }
  }
});

/** Initialize app */
async function init() {
  await registerSW();
  startCountdownTicker();
  render();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for debugging
window.__makefun = { render, clearCache, getBounties, getBounty, getLeaderboard, getProfile };