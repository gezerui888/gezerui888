import assert from 'node:assert/strict';
import test from 'node:test';
import { buildModel } from '../scripts/profile-model.mjs';

function fixture() {
  const repo = (name, owner, isPrivate, language, stars) => ({
    nameWithOwner: name, owner, ownerIsOrg: owner === 'piplabs', isPrivate,
    isFork: false, stars, languages: [{ name: language, color: '#abcdef', size: 100 }],
  });
  const totals = { commits: 14, pullRequests: 2, reviews: 1, issues: 1 };
  const window = {
    totals, restricted: 0,
    byRepo: {
      'gezerui888/private-example': { commits: 9, pullRequests: 0, reviews: 0, issues: 0 },
      'piplabs/story': { commits: 5, pullRequests: 2, reviews: 1, issues: 1 },
    },
  };
  return {
    version: 5,
    user: { login: 'gezerui888' },
    orgs: ['piplabs'],
    repos: {
      'gezerui888/private-example': repo('gezerui888/private-example', 'gezerui888', true, 'JavaScript', 50),
      'piplabs/story': repo('piplabs/story', 'piplabs', false, 'Python', 75),
      'gezerui888/public-example': repo('gezerui888/public-example', 'gezerui888', false, 'Go', 8),
      'apify/crawlee': repo('apify/crawlee', 'apify', false, 'TypeScript', 26000),
    },
    ownedRepos: ['gezerui888/private-example', 'gezerui888/public-example'],
    recentStars: { 'gezerui888/private-example': 5, 'gezerui888/public-example': 1 },
    allTime: [window], last12Months: window,
    calendar: [{ date: '2026-11-08', count: 3 }, { date: '2026-11-09', count: 4 }],
    avatars: {},
    pullRequests: [
      { repo: 'piplabs/story', state: 'MERGED', createdAt: '2026-10-01', mergedAt: '2026-10-02' },
      { repo: 'apify/crawlee', state: 'MERGED', createdAt: '2026-10-01', mergedAt: '2026-10-03' },
      { repo: 'gezerui888/private-example', state: 'MERGED', createdAt: '2026-10-01', mergedAt: '2026-10-03' },
    ],
  };
}

test('language exclusions preserve summary counts and organization work', () => {
  const model = buildModel(fixture(), ['gezerui888/private-example']);
  assert.deepEqual(model.languages.map(({ name, percent }) => ({ name, percent })), [{ name: 'Python', percent: 100 }]);
  assert.equal(model.summary.rows.find(row => row.key === 'commits').allTime, 14);
  assert.deepEqual(model.summary.stars, { last12Months: 1, allTime: 8 });
});

test('contribution cards include organization membership work, omit private repositories, and sort by stars', () => {
  const model = buildModel(fixture(), []);
  assert.deepEqual(model.contributions.map(item => item.repo), ['apify/crawlee', 'piplabs/story']);
  assert.ok(!JSON.stringify(model.contributions).includes('private-example'));
});

test('the website exclusion applies even when it has attributed commits', () => {
  const snapshot = fixture();
  const key = 'gezerui888/ezreal1997.github.io';
  snapshot.repos[key] = { ...snapshot.repos['gezerui888/public-example'], nameWithOwner: key, languages: [{ name: 'HTML', color: '#e34c26', size: 100 }] };
  snapshot.allTime[0].byRepo[key] = { commits: 100, pullRequests: 0, reviews: 0, issues: 0 };
  const model = buildModel(snapshot, ['gezerui888/private-example']);
  assert.ok(!model.languages.some(item => item.name === 'HTML'));
  assert.equal(model.languages.reduce((sum, item) => sum + item.percent, 0), 100);
});
