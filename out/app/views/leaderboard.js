// Leaderboard view - virtualized table

import { esc, rank } from '../format.js';

const ROW_HEIGHT = 44;
const BUFFER = 10;

let virtualizer = null;

/** Medal SVG for top 3 */
function medalSVG(rank) {
  const medals = {
    1: '<svg class="medal gold" viewBox="0 0 24 24" aria-label="1st place"><path fill="#FFD700" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    2: '<svg class="medal silver" viewBox="0 0 24 24" aria-label="2nd place"><path fill="#C0C0C0" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    3: '<svg class="medal bronze" viewBox="0 0 24 24" aria-label="3rd place"><path fill="#CD7F32" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  };
  return medals[rank] || '';
}

/** Create a row element */
function createRowElement(entry, index) {
  const tr = document.createElement('tr');
  tr.dataset.rank = entry.rank;

  const isTop3 = entry.rank <= 3;
  const rankClass = isTop3 ? `top-${entry.rank}` : '';
  const medal = isTop3 ? medalSVG(entry.rank) : '';

  const avatar = entry.image
    ? `<img class="lb-avatar" src="${esc(entry.image)}" alt="" loading="lazy">`
    : `<span class="lb-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:0.75rem;color:var(--muted);">${esc(entry.handle.charAt(0).toUpperCase())}</span>`;

  const prize = entry.prize_rank ? `#${entry.prize_rank}` : '—';

  tr.innerHTML = `
    <td class="lb-rank ${rankClass}" aria-label="Rank ${entry.rank}">${entry.rank}${medal}</td>
    <td class="lb-entrant">
      ${avatar}
      <a href="#/profile/${encodeURIComponent(entry.handle)}">@${esc(entry.handle)}</a>
    </td>
    <td class="lb-score">${entry.values?.judge != null ? (entry.values.judge / 1e6).toFixed(6) : '—'}</td>
    <td class="lb-prize">${esc(prize)}</td>
    <td class="lb-medal" aria-hidden="true">${medal}</td>
  `;

  return tr;
}

/** Virtual table class */
class VirtualTable {
  constructor(container, data, createRow) {
    this.container = container;
    this.data = data;
    this.createRow = createRow;
    this.rows = [];
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.totalItems = data.length;
    this.scrollTop = 0;

    this.init();
  }

  init() {
    // Create all rows upfront (reasonable for < 5000 entries)
    this.rows = this.data.map((entry, i) => this.createRow(entry, i));

    // Build table structure
    this.container.innerHTML = `
      <div class="leaderboard-wrap" role="region" aria-label="Leaderboard" tabindex="0">
        <table class="leaderboard" aria-describedby="lb-desc">
          <thead>
            <tr>
              <th scope="col" aria-sort="none">#</th>
              <th scope="col">Entrant</th>
              <th scope="col">Log Score</th>
              <th scope="col">Prize</th>
              <th scope="col" aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody id="lb-body"></tbody>
        </table>
      </div>
      <p id="lb-desc" class="visually-hidden">${this.totalItems} entries</p>
    `;

    this.wrap = this.container.querySelector('.leaderboard-wrap');
    this.tbody = this.container.querySelector('#lb-body');
    this.table = this.container.querySelector('.leaderboard');

    // Create sentinels
    this.topSpacer = document.createElement('tr');
    this.topSpacer.style.height = '0';
    this.topSpacer.setAttribute('aria-hidden', 'true');

    this.bottomSpacer = document.createElement('tr');
    this.bottomSpacer.style.height = '0';
    this.bottomSpacer.setAttribute('aria-hidden', 'true');

    this.tbody.appendChild(this.topSpacer);
    this.tbody.appendChild(this.bottomSpacer);

    // Initial render
    this.updateVisibleRows();

    // Scroll listener
    this.wrap.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }

  onScroll() {
    this.scrollTop = this.wrap.scrollTop;
    this.updateVisibleRows();
  }

  updateVisibleRows() {
    const clientHeight = this.wrap.clientHeight;
    const newStart = Math.max(0, Math.floor(this.scrollTop / ROW_HEIGHT) - BUFFER);
    const newEnd = Math.min(this.totalItems, Math.ceil((this.scrollTop + clientHeight) / ROW_HEIGHT) + BUFFER);

    if (newStart !== this.visibleStart || newEnd !== this.visibleEnd) {
      this.visibleStart = newStart;
      this.visibleEnd = newEnd;
      this.renderVisibleRows();
    }
  }

  renderVisibleRows() {
    // Update spacers
    this.topSpacer.style.height = `${this.visibleStart * ROW_HEIGHT}px`;
    this.bottomSpacer.style.height = `${(this.totalItems - this.visibleEnd) * ROW_HEIGHT}px`;

    // Clear existing rows (except spacers)
    const existingRows = this.tbody.querySelectorAll('tr:not([aria-hidden])');
    existingRows.forEach(r => r.remove());

    // Insert visible rows before bottom spacer
    const fragment = document.createDocumentFragment();
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      fragment.appendChild(this.rows[i]);
    }
    this.tbody.insertBefore(fragment, this.bottomSpacer);
  }

  destroy() {
    if (this.wrap) {
      this.wrap.removeEventListener('scroll', () => this.onScroll());
    }
    this.rows = [];
    this.container = null;
  }
}

/** Initialize virtual leaderboard */
export function initLeaderboard(data, container) {
  const entries = data.entries || [];
  if (entries.length === 0) {
    container.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p>No entries yet</p></div>';
    return null;
  }

  // For small lists, render all
  if (entries.length < 100) {
    return renderLeaderboardStatic(data);
  }

  // Virtual table for larger lists
  const html = `
    <p><a href="#/bounty/${encodeURIComponent(data.competition.slug)}">${esc(data.competition.title)}</a></p>
    <h1>Leaderboard</h1>
    <div id="leaderboard-table"></div>
  `;
  container.innerHTML = html;
  const tableContainer = container.querySelector('#leaderboard-table');
  virtualizer = new VirtualTable(tableContainer, entries, createRowElement);
  return virtualizer;
}

/** Static render for small lists */
export function renderLeaderboard(data) {
  const entries = data.entries || [];
  if (entries.length === 0) {
    return `<p><a href="#/bounty/${encodeURIComponent(data.competition.slug)}">${esc(data.competition.title)}</a></p><h1>Leaderboard</h1><div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p>No entries yet</p></div>`;
  }

  const rows = entries.map((e, i) => {
    const isTop3 = e.rank <= 3;
    const rankClass = isTop3 ? `top-${e.rank}` : '';
    const medal = isTop3 ? medalSVG(e.rank) : '';
    const rate = e.values?.judge != null ? (e.values.judge / 1e6).toFixed(6) : '—';
    const prize = e.prize_rank ? `#${e.prize_rank}` : '—';
    const avatar = e.image
      ? `<img class="lb-avatar" src="${esc(e.image)}" alt="" loading="lazy">`
      : `<span class="lb-avatar" style="display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:0.75rem;color:var(--muted);">${esc(e.handle.charAt(0).toUpperCase())}</span>`;

    return `
      <tr data-rank="${e.rank}">
        <td class="lb-rank ${rankClass}" aria-label="Rank ${e.rank}">${e.rank}${medal}</td>
        <td class="lb-entrant">${avatar}<a href="#/profile/${encodeURIComponent(e.handle)}">@${esc(e.handle)}</a></td>
        <td class="lb-score">${rate}</td>
        <td class="lb-prize">${esc(prize)}</td>
        <td class="lb-medal" aria-hidden="true">${medal}</td>
      </tr>
    `;
  }).join('');

  return `
    <p><a href="#/bounty/${encodeURIComponent(data.competition.slug)}">${esc(data.competition.title)}</a></p>
    <h1>Leaderboard</h1>
    <div class="leaderboard-wrap">
      <table class="leaderboard">
        <thead>
          <tr>
            <th scope="col" aria-sort="none">#</th>
            <th scope="col">Entrant</th>
            <th scope="col">Log Score</th>
            <th scope="col">Prize</th>
            <th scope="col" aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}