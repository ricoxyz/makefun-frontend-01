// The two pages, each a function from API data to HTML.

import { date, esc, money, timeLeft, rank } from './format.js';

/** The reward as it stands now: the prize plus any entry fees paid into it. */
const pot = (b) => money(b.potUsd ?? b.rewardAmount);

/** The entry fee, when the bounty charges one. */
const fee = (b) => (b.entryFeeUsd ? `${money(b.entryFeeUsd)} entry fee` : '');

export function board(data) {
  const rows = data.items
    .map(
      (b) => `
      <li>
        <a href="#/bounty/${encodeURIComponent(b.slug)}">${esc(b.title)}</a>
        <span>${pot(b)}</span>
        <span>${fee(b)}</span>
        <span>${timeLeft(b.deadline)}</span>
        <span>${b.submissionCount} ${b.submissionCount === 1 ? 'entry' : 'entries'}</span>
      </li>`,
    )
    .join('');
  return `<h1>Open bounties</h1><ul class="board">${rows}</ul>`;
}

export function bounty(b) {
  return `
    <p><a href="#/">All bounties</a></p>
    <h1>${esc(b.title)}</h1>
    <p>${esc(b.summary)}</p>
    <dl>
      <dt>Reward</dt><dd>${pot(b)}</dd>
      ${b.entryFeeUsd ? `<dt>Entry fee</dt><dd>${money(b.entryFeeUsd)}</dd>` : ''}
      <dt>Deadline</dt><dd>${date(b.deadline)} (${timeLeft(b.deadline)})</dd>
      <dt>Entries</dt><dd>${b.submissionCount}</dd>
    </dl>
    <p><a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard</a> | <a href="#/bounty/${encodeURIComponent(b.slug)}/entries">All entries</a></p>
    <h2>Description</h2>
    <div class="description">${esc(b.description)}</div>`;
}

export function leaderboard(data) {
  const { competition, entries } = data;
  const rows = entries
    .map(
      (e) => {
        const rate = e.values?.judge != null ? (e.values.judge / 1e6).toFixed(6) : '—';
        const prize = e.prize_rank ? `#${e.prize_rank}` : '—';
        return `
      <tr>
        <td>${e.rank}</td>
        <td><a href="#/profile/${encodeURIComponent(e.handle)}">@${esc(e.handle)}</a></td>
        <td>${rate}</td>
        <td>${prize}</td>
      </tr>`;
      }
    )
    .join('');
  return `
    <p><a href="#/bounty/${encodeURIComponent(competition.slug)}">${esc(competition.title)}</a></p>
    <h1>Leaderboard</h1>
    <table class="leaderboard">
      <thead><tr><th>#</th><th>Entrant</th><th>Judge Rate</th><th>Prize</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

export function profile(data) {
  const { handle, display_name, bio, image, record, solutions } = data;
  const rows = (solutions || [])
    .filter(s => s.placement || s.prize_usd)
    .map(
      (s) => `
      <tr>
        <td><a href="#/bounty/${encodeURIComponent(s.competition.slug)}">${esc(s.competition.title)}</a></td>
        <td>${s.placement ? `#${s.placement}` : '—'}</td>
        <td>${s.prize_usd ? money(s.prize_usd) : ''}</td>
      </tr>`,
    )
    .join('');
  return `
    <p><a href="#/">All bounties</a></p>
    <h1>@${esc(handle)}${display_name ? ` — ${esc(display_name)}` : ''}</h1>
    ${bio ? `<p>${esc(bio)}</p>` : ''}
    <dl>
      <dt>Wins</dt><dd>${record?.competitions_won ?? 0}</dd>
      <dt>Podiums</dt><dd>${record?.podium_finishes ?? 0}</dd>
      <dt>Total prizes</dt><dd>${record?.prize_usd ? money(record.prize_usd) : '$0'}</dd>
      <dt>Competitions entered</dt><dd>${record?.competitions_entered ?? 0}</dd>
      <dt>Best placement</dt><dd>${record?.best_placement ? `#${record.best_placement}` : '—'}</dd>
      <dt>Joined</dt><dd>${date(data.joined_at)}</dd>
    </dl>
    <h2>Placed Entries</h2>
    <table class="profile-table">
      <thead><tr><th>Bounty</th><th>Place</th><th>Prize</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3">No placed entries yet</td></tr>'}</tbody>
    </table>`;
}
