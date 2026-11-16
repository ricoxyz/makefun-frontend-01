// Profile view

import { esc, money, date, formatNumber } from '../format.js';

export function renderProfile(data) {
  const { handle, display_name, bio, image, record, solutions, joined_at } = data;
  const avatarSrc = image || `https://github.com/${esc(handle)}.png`;

  const wins = record?.competitions_won ?? 0;
  const podiums = record?.podium_finishes ?? 0;
  const totalPrizes = record?.prize_usd ? money(record.prize_usd) : '$0';
  const entered = record?.competitions_entered ?? 0;
  const best = record?.best_placement ? `#${record.best_placement}` : '—';

  const placedEntries = (solutions || [])
    .filter(s => s.placement || s.prize_usd)
    .map(s => `
      <tr>
        <td><a href="#/bounty/${encodeURIComponent(s.competition.slug)}">${esc(s.competition.title)}</a></td>
        <td>${s.placement ? `#${s.placement}` : '—'}</td>
        <td class="prize">${s.prize_usd ? money(s.prize_usd) : ''}</td>
      </tr>
    `).join('');

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="#/">All bounties</a>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18l6-6-6-6"/></svg>
      <span aria-current="page">@${esc(handle)}</span>
    </nav>

    <header class="profile-header">
      <img class="profile-avatar" src="${esc(avatarSrc)}" alt="" loading="lazy">
      <div class="profile-info">
        <h1 class="profile-handle">@${esc(handle)}${display_name ? ` — ${esc(display_name)}` : ''}</h1>
        ${bio ? `<p class="profile-display">${esc(bio)}</p>` : ''}
        <div class="profile-stats">
          <div class="stat">
            <span class="stat-label">Wins</span>
            <span class="stat-value">${wins}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Podiums</span>
            <span class="stat-value">${podiums}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Total Prizes</span>
            <span class="stat-value money">${totalPrizes}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Entered</span>
            <span class="stat-value">${entered}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Best</span>
            <span class="stat-value">${best}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Joined</span>
            <span class="stat-value">${date(joined_at)}</span>
          </div>
        </div>
      </div>
    </header>

    <section class="profile-entries" aria-labelledby="entries-heading">
      <h2 id="entries-heading">Placed Entries</h2>
      ${placedEntries ? `
        <table class="profile-table">
          <thead>
            <tr>
              <th scope="col">Bounty</th>
              <th scope="col">Place</th>
              <th scope="col" class="prize">Prize</th>
            </tr>
          </thead>
          <tbody>${placedEntries}</tbody>
        </table>
      ` : `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6M12 9v6M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"/></svg>
          <p>No placed entries yet</p>
        </div>
      `}
    </section>
  `;
}