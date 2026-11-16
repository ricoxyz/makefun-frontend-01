// Bounty detail view

import { esc, money, date, countdownInfo } from '../format.js';

export function renderBounty(bounty) {
  const { text: deadlineText, state } = countdownInfo(bounty.deadline);
  const deadlineFull = date(bounty.deadline);
  const entryFee = bounty.entryFeeUsd ? `<dt>Entry fee</dt><dd class="money">${money(bounty.entryFeeUsd)}</dd>` : '';
  const category = bounty.category ? esc(bounty.category) : '—';
  const skills = bounty.skills && bounty.skills.length ? bounty.skills.map(esc).join(', ') : '—';

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#/">All bounties</a>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg>
      <span aria-current="page">${esc(bounty.title)}</span>
    </nav>

    <header class="bounty-header">
      <h1 class="bounty-title">${esc(bounty.title)}</h1>
      <p class="bounty-summary">${esc(bounty.summary)}</p>
    </header>

    <div class="bounty-meta">
      <div class="meta-item">
        <dt>Reward</dt>
        <dd class="pot money">${money(bounty.potUsd ?? bounty.rewardAmount)}</dd>
      </div>
      ${bounty.entryFeeUsd ? `
      <div class="meta-item">
        <dt>Entry fee</dt>
        <dd class="money">${money(bounty.entryFeeUsd)}</dd>
      </div>` : ''}
      <div class="meta-item">
        <dt>Deadline</dt>
        <dd>${esc(deadlineFull)} <span class="countdown ${state}">${esc(deadlineText)}</span></dd>
      </div>
      <div class="meta-item">
        <dt>Entries</dt>
        <dd>${formatNumber(bounty.submissionCount)}</dd>
      </div>
      <div class="meta-item">
        <dt>Category</dt>
        <dd>${category}</dd>
      </div>
      <div class="meta-item">
        <dt>Skills</dt>
        <dd>${esc(skills)}</dd>
      </div>
      ${bounty.sponsor ? `
      <div class="meta-item">
        <dt>Sponsor</dt>
        <dd>${esc(bounty.sponsor.name)}</dd>
      </div>` : ''}
    </div>

    <div class="bounty-actions" role="group" aria-label="Bounty actions">
      <a href="#/bounty/${encodeURIComponent(bounty.slug)}/leaderboard" class="btn btn-secondary">Leaderboard</a>
      <a href="#/bounty/${encodeURIComponent(bounty.slug)}/entries" class="btn btn-secondary">All Entries</a>
      <a href="https://make.fun/bounty/${encodeURIComponent(bounty.slug)}" target="_blank" rel="noopener" class="btn btn-primary">Enter on make.fun</a>
    </div>

    <section class="bounty-description" aria-labelledby="desc-heading">
      <h2 id="desc-heading">Description</h2>
      <div class="description">${esc(bounty.description)}</div>
    </section>
  `;
}

function formatNumber(n) {
  return Number(n).toLocaleString('en-US');
}