// Board view - virtualized list of open bounties

import { esc, money, countdownInfo, truncate } from '../format.js';

const ROW_HEIGHT = 110; // approximate row height in px
const BUFFER = 5; // extra rows to render above/below viewport

let observer = null;
let rows = [];
let container = null;
let sentinelTop = null;
let sentinelBottom = null;
let visibleStart = 0;
let visibleEnd = 0;
let totalItems = 0;

/** Create a board row element from bounty data */
function createRowElement(bounty) {
  const li = document.createElement('li');
  li.className = 'board-row';
  li.dataset.slug = bounty.slug;

  const { text: deadlineText, state } = countdownInfo(bounty.deadline);
  const category = bounty.category ? esc(bounty.category) : '—';
  const entryFee = bounty.entryFeeUsd ? `<span class="entry-fee">${money(bounty.entryFeeUsd)} entry fee</span>` : '<span>Free entry</span>';

  li.innerHTML = `
    <div class="board-row-title">
      <a href="#/bounty/${encodeURIComponent(bounty.slug)}">${esc(bounty.title)}</a>
    </div>
    <div class="board-row-pot money">${money(bounty.potUsd ?? bounty.rewardAmount)}</div>
    <div class="board-row-deadline ${state}"><span class="countdown ${state}">${esc(deadlineText)}</span></div>
    <div class="board-row-meta">
      <span class="category">${category}</span>
      <span>${bounty.submissionCount} ${bounty.submissionCount === 1 ? 'entry' : 'entries'}</span>
      ${entryFee}
    </div>
  `;

  return li;
}

/** Create skeleton loading row */
function createSkeleton() {
  const template = document.getElementById('skeleton-row');
  return template.content.firstElementChild.cloneNode(true);
}

/** Update visible rows based on scroll position */
function updateVisibleRows() {
  if (!container || rows.length === 0) return;

  const scrollTop = container.scrollTop;
  const clientHeight = container.clientHeight;
  const newStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const newEnd = Math.min(totalItems, Math.ceil((scrollTop + clientHeight) / ROW_HEIGHT) + BUFFER);

  if (newStart !== visibleStart || newEnd !== visibleEnd) {
    visibleStart = newStart;
    visibleEnd = newEnd;
    renderVisibleRows();
  }
}

/** Render only the visible rows */
function renderVisibleRows() {
  const fragment = document.createDocumentFragment();

  // Add top spacer
  if (visibleStart > 0) {
    const spacer = document.createElement('div');
    spacer.style.height = `${visibleStart * ROW_HEIGHT}px`;
    spacer.setAttribute('aria-hidden', 'true');
    fragment.appendChild(spacer);
  }

  // Add visible rows
  for (let i = visibleStart; i < visibleEnd; i++) {
    fragment.appendChild(rows[i]);
  }

  // Add bottom spacer
  const remaining = totalItems - visibleEnd;
  if (remaining > 0) {
    const spacer = document.createElement('div');
    spacer.style.height = `${remaining * ROW_HEIGHT}px`;
    spacer.setAttribute('aria-hidden', 'true');
    fragment.appendChild(spacer);
  }

  // Replace container contents (keep sentinels)
  const children = Array.from(container.children);
  children.forEach(child => {
    if (child !== sentinelTop && child !== sentinelBottom) {
      child.remove();
    }
  });

  container.insertBefore(fragment, sentinelBottom);
}

/** Initialize the virtual list */
export function initVirtualList(bounties, listContainer) {
  container = listContainer;
  totalItems = bounties.length;

  // Create all row elements upfront (cheap for < 1000 items)
  rows = bounties.map(createRowElement);

  // Create sentinels for IntersectionObserver
  sentinelTop = document.createElement('div');
  sentinelTop.style.height = '1px';
  sentinelTop.style.marginBottom = '-1px';
  sentinelTop.setAttribute('aria-hidden', 'true');

  sentinelBottom = document.createElement('div');
  sentinelBottom.style.height = '1px';
  sentinelBottom.style.marginTop = '-1px';
  sentinelBottom.setAttribute('aria-hidden', 'true');

  container.innerHTML = '';
  container.appendChild(sentinelTop);
  container.appendChild(sentinelBottom);

  // Initial render
  visibleStart = 0;
  visibleEnd = Math.min(totalItems, Math.ceil(container.clientHeight / ROW_HEIGHT) + BUFFER);
  renderVisibleRows();

  // Scroll listener with passive flag
  container.addEventListener('scroll', updateVisibleRows, { passive: true });

  // IntersectionObserver for sentinel-based loading (if we add infinite scroll later)
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target === sentinelBottom) {
          // Could trigger load more here
        }
      });
    }, { root: container, rootMargin: '100px' });
    observer.observe(sentinelBottom);
  }

  return { destroy: () => cleanup() };
}

/** Clean up listeners */
function cleanup() {
  if (container) {
    container.removeEventListener('scroll', updateVisibleRows);
  }
  if (observer) {
    observer.disconnect();
  }
  rows = [];
  container = null;
  sentinelTop = null;
  sentinelBottom = null;
}

/** Render board view (fallback for small lists or no virtualization) */
export function renderBoard(data) {
  const items = data.items || [];
  if (items.length === 0) {
    return `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6M12 9v6M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"/></svg><p>No open bounties right now</p></div>`;
  }

  // For small lists (< 50), just render all - simpler and fast enough
  if (items.length < 50) {
    const rows = items.map(b => {
      const { text: deadlineText, state } = countdownInfo(b.deadline);
      const category = b.category ? esc(b.category) : '—';
      const entryFee = b.entryFeeUsd ? `<span class="entry-fee">${money(b.entryFeeUsd)} entry fee</span>` : '<span>Free entry</span>';
      return `
        <li class="board-row">
          <div class="board-row-title"><a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a></div>
          <div class="board-row-pot money">${money(b.potUsd ?? b.rewardAmount)}</div>
          <div class="board-row-deadline ${state}"><span class="countdown ${state}">${esc(deadlineText)}</span></div>
          <div class="board-row-meta">
            <span class="category">${category}</span>
            <span>${b.submissionCount} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span>
            ${entryFee}
          </div>
        </li>
      `;
    }).join('');
    return `<h1>Open bounties</h1><ul class="board">${rows}</ul>`;
  }

  // For larger lists, use virtual list container
  return `
    <h1>Open bounties</h1>
    <div class="virtual-list" role="list" aria-label="Open bounties"></div>
  `;
}

/** Attach virtual list to rendered container */
export function attachVirtualList(data, container) {
  const items = data.items || [];
  if (items.length >= 50) {
    initVirtualList(items, container);
  }
}

/** Update live countdowns on all visible rows */
export function updateCountdowns() {
  if (!container) return;
  const deadlineEls = container.querySelectorAll('.board-row-deadline .countdown');
  deadlineEls.forEach(el => {
    const row = el.closest('.board-row');
    if (!row) return;
    const slug = row.dataset.slug;
    // We'd need to store the deadline per row or re-fetch
    // For now, this is a placeholder for a more complete implementation
  });
}