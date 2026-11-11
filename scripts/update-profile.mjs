import { mkdir, writeFile } from 'node:fs/promises';
import { collect } from '../.renderer/src/collect.ts';
import { createClient } from '../.renderer/src/github.ts';
import { renderAll } from '../.renderer/src/render/index.ts';
import { buildModel, configuration } from './profile-model.mjs';

async function update() {
  if (!process.env.PROFILE_TOKEN || !process.env.PROFILE_LANGUAGE_EXCLUSIONS) {
    throw new Error('Set PROFILE_TOKEN and PROFILE_LANGUAGE_EXCLUSIONS in repository Actions secrets.');
  }
  const exclusions = JSON.parse(process.env.PROFILE_LANGUAGE_EXCLUSIONS);
  if (!Array.isArray(exclusions) || !exclusions.length || !exclusions.every(repo => typeof repo === 'string' && /^[\w.-]+\/[\w.-]+$/.test(repo))) {
    throw new Error('PROFILE_LANGUAGE_EXCLUSIONS must be a nonempty JSON array of repository names.');
  }

  const client = createClient(process.env.PROFILE_TOKEN);
  const query = client.query;
  client.query = async (source, variables) => {
    // Fetch every language, rather than the renderer's default first twenty.
    source = source.replace('languages(first: 20,', 'languages(first: 100,');
    source = source.replace('}) { edges { size node { name color } } }', '}) { pageInfo { hasNextPage } edges { size node { name color } } }');
    const data = await query(source, variables);
    if (data.viewer && data.viewer.login.toLowerCase() !== configuration.user) {
      throw new Error('The read credential must belong to the profile owner.');
    }
    const window = data.user?.contributionsCollection;
    if (window) {
      const rows = window.commitContributionsByRepository;
      const count = rows.reduce((sum, row) => sum + row.contributions.totalCount, 0);
      if (rows.length >= 100 || count !== window.totalCommitContributions) {
        throw new Error('The contribution query is incomplete. Published cards were not changed.');
      }
      if (rows.some(row => row.repository?.languages.pageInfo.hasNextPage)) {
        throw new Error('A repository language query is incomplete. Published cards were not changed.');
      }
    }
    return data;
  };

  const snapshot = await collect(client, configuration);
  if (client.warnings.length) {
    throw new Error('GitHub denied part of the requested data. Check repository access and organization SSO authorization.');
  }
  const model = buildModel(snapshot, exclusions);
  const cards = renderAll(model, configuration);
  const privateNames = Object.values(snapshot.repos)
    .filter(repo => repo.isPrivate).map(repo => repo.nameWithOwner.toLowerCase());
  for (const [name, svg] of Object.entries(cards)) {
    if (privateNames.some(repo => svg.toLowerCase().includes(repo))) {
      throw new Error('A card contains a private repository name. Published cards were not changed.');
    }
    if (name.startsWith('contributions-')) {
      cards[name] = svg.replaceAll('<image href=', '<circle cx="15" cy="15" r="15" fill="#ffffff"/><image href=');
    }
  }

  const version = snapshot.generatedAt;
  const cardsInOrder = [
    ['footprint', 'GitHub stats: Year and All time'],
    ['languages', 'Most used languages'],
    ['contributions', 'Notable contributions'],
    ['streaks', 'Streaks'],
  ];
  const pictures = cardsInOrder.map(([name, alt]) => {
    const base = `https://raw.githubusercontent.com/gezerui888/gezerui888/main/assets/${name}`;
    return `<picture>\n  <source media="(prefers-color-scheme: dark)" srcset="${base}-dark.svg?v=${version}">\n  <img src="${base}-light.svg?v=${version}" width="400" alt="${alt}">\n</picture>`;
  });
  const readme = 'AI · Crypto\n\n'
    + 'I contribute to AI tools, agent runtimes, blockchain infrastructure, scientific computing, and more.\n\n'
    + pictures.slice(0, 2).join('\n') + '\n\n' + pictures.slice(2).join('\n') + '\n';

  await mkdir('assets', { recursive: true });
  for (const [name, svg] of Object.entries(cards)) {
    await writeFile(`assets/${name.replace('summary-', 'footprint-')}`, svg);
  }
  await writeFile('README.md', readme);
  console.log(`Updated eight profile cards for ${version}.`);
  console.log(`Restricted contributions without repository details: ${snapshot.allTime.reduce((sum, window) => sum + window.restricted, 0)}.`);
}

update().catch(error => {
  // Upstream API errors can name private repositories. Do not print those details.
  console.error('Profile update failed. Existing published cards remain unchanged.');
  if (error.constructor === Error || error instanceof SyntaxError) console.error(error.message);
  process.exitCode = 1;
});
