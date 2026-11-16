// A make.fun frontend: the board of open bounties and a page for each, on hash routes.
//
//   #/                           the board
//   #/bounty/<slug>              one bounty
//   #/bounty/<slug>/leaderboard  leaderboard
//   #/profile/<handle>           account profile
//
// window.__shotReady is false while a page loads and true once its data is on screen, so a
// screenshot script knows when to capture.

import { getBounties, getBounty, getLeaderboard, getProfile } from './api.js';
import { board, bounty, leaderboard, profile } from './views.js';

const app = document.getElementById('app');

async function render() {
  window.__shotReady = false;
  app.innerHTML = '<p>Loading…</p>';
  
  // Profile route
  let match = location.hash.match(/^#\/profile\/([^/]+)/);
  if (match) {
    const p = await getProfile(decodeURIComponent(match[1]));
    document.title = `@${p.handle} | make.fun bounties`;
    app.innerHTML = profile(p);
    window.scrollTo(0, 0);
    window.__shotReady = true;
    return;
  }
  
  // Leaderboard route
  match = location.hash.match(/^#\/bounty\/([^/]+)\/leaderboard/);
  if (match) {
    const data = await getLeaderboard(decodeURIComponent(match[1]));
    document.title = `Leaderboard: ${data.competition.title} | make.fun bounties`;
    app.innerHTML = leaderboard(data);
    window.scrollTo(0, 0);
    window.__shotReady = true;
    return;
  }
  
  // Bounty page route
  match = location.hash.match(/^#\/bounty\/([^/]+)/);
  if (match) {
    const b = await getBounty(decodeURIComponent(match[1]));
    document.title = `${b.title} | make.fun bounties`;
    app.innerHTML = bounty(b);
    window.scrollTo(0, 0);
    window.__shotReady = true;
    return;
  }
  
  // Board route (default)
  document.title = 'make.fun bounties';
  app.innerHTML = board(await getBounties());
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener('hashchange', render);
render();
