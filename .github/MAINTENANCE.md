# Profile updates

The Update profile workflow runs daily at 01:17 UTC (09:17 Asia/Shanghai). GitHub can delay scheduled runs. Run it manually from Actions when needed.

The workflow refreshes the eight SVG assets and README image versions. It preserves the introduction and two-row layout. Each refresh uses a timestamp in image URLs, including manual runs on the same day.

## Credentials

Set these repository Actions secrets:

- `PROFILE_TOKEN`: a dedicated classic personal access token owned by the profile owner. It requires `repo`, `read:org`, and `read:user` to include accessible private and organization contributions. Authorize it for organizations that require SSO. The classic `repo` scope also grants repository write access, although this script only reads data with this token.
- `PROFILE_LANGUAGE_EXCLUSIONS`: a JSON array of private repository names to omit from language statistics. Keep these names out of tracked files.

The workflow uses its separate `GITHUB_TOKEN` to commit profile updates. The configured token has no expiration. Replace `PROFILE_TOKEN` if you revoke or rotate the credential. GitHub may disable schedules in public repositories after extended inactivity. Check the workflow status if daily updates stop.

## Statistics

Every run fetches fresh GitHub data. The PR collector reads every page of the account’s PR history, then filters merged PRs. It does not use search results or a previous snapshot.

The summary includes accessible private and organization contributions. Year covers the rolling contribution-calendar window. All time covers annual windows since account creation.

Language scores multiply each repository's language proportions by attributed all-time commits. They estimate activity rather than authored lines. The public website and the private exclusions do not affect summary or streak totals.

The contribution card selects the fifteen most starred public repositories with merged PRs by the profile owner. It includes membership organizations and excludes personal repositories. No repositories are pinned. New eligible repositories enter the card when their stars place them in the top fifteen. The card groups PRs by repository and sorts repositories by descending stars. It scrolls through five groups of three repositories when fifteen qualify. Stars earned counts owned public repositories, excluding forks.

Streaks, active days, and best-day and best-month values use the latest rolling 365-day contribution calendar. The longest streak covers that window.

Raw API responses stay in memory. Published files contain aggregate statistics and public repository names. Restricted contributions have no repository details and cannot enter the language calculation.

## Verification

The renderer and workflow actions use fixed commit references. Tests check automatic top-fifteen selection, language exclusions, organization contributions, private repository filtering, and updates to every statistical card. Generation stops when the API reports incomplete commit or language coverage. Failed runs preserve the published profile.
