import { DEFAULT_CONFIG } from '../.renderer/src/config.ts';
import { compute } from '../.renderer/src/compute.ts';

export const configuration = structuredClone(DEFAULT_CONFIG);
configuration.user = 'gezerui888';
configuration.show = ['summary', 'languages', 'contributions', 'streaks'];
configuration.look.color = 'amber';
configuration.cards.summary.ring = 'github';
configuration.cards.languages.count = 5;
configuration.cards.contributions.open = false;
configuration.cards.contributions.pin = [
  'apify/crawlee',
  'Mathics3/mathics-core',
  'microsoft/nvx',
  'JuliaDiff/ChainRules.jl',
  'debugmcp/mcp-debugger',
  'piplabs/story',
];

export function buildModel(snapshot, privateExclusions) {
  const config = structuredClone(configuration);
  config.cards.languages.repos = Object.fromEntries(
    ['gezerui888/ezreal1997.github.io', ...privateExclusions].map(repo => [repo, 0]),
  );
  // Public work in membership organizations belongs on the contribution card.
  const model = compute({ ...snapshot, orgs: [] }, config);
  model.summary.stars = snapshot.ownedRepos
    .filter(key => !snapshot.repos[key].isPrivate && !snapshot.repos[key].isFork)
    .reduce((sum, key) => ({
      last12Months: sum.last12Months + (snapshot.recentStars[key] ?? 0),
      allTime: sum.allTime + snapshot.repos[key].stars,
    }), { last12Months: 0, allTime: 0 });
  return model;
}
