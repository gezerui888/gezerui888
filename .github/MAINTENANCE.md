# Profile updates

The Update profile workflow runs daily at 01:17 UTC (09:17 Asia/Shanghai). GitHub can delay scheduled runs. Run it manually from Actions when needed.

The workflow refreshes the eight SVG assets and README image versions. It preserves the introduction, two-row layout, featured repositories, and descending star order.

## Credentials

Set these repository Actions secrets:

- `PROFILE_TOKEN`: a dedicated classic personal access token owned by the profile owner. It requires `repo`, `read:org`, and `read:user` to include accessible private and organization contributions. Authorize it for organizations that require SSO. The classic `repo` scope also grants repository write access, although this script only reads data with this token.
- `PROFILE_LANGUAGE_EXCLUSIONS`: a JSON array of private repository names to omit from language statistics. Keep these names out of tracked files.

The workflow uses its separate `GITHUB_TOKEN` to commit profile updates. Replace `PROFILE_TOKEN` before it expires. GitHub may disable schedules in public repositories after extended inactivity. Check the workflow status if daily updates stop.

## Statistics

The summary includes accessible private and organization contributions. Year covers the rolling contribution-calendar window. All time covers annual windows since account creation.

Language scores multiply each repository's language proportions by attributed all-time commits. They estimate activity rather than authored lines. The public website and the private exclusions do not affect summary or streak totals.

The contribution card lists merged PRs in public projects, including membership organizations. The six featured repositories remain pinned and sort by stars. Stars earned counts owned public repositories, excluding forks.

Raw API responses stay in memory. Published files contain aggregate statistics and public repository names. Restricted contributions have no repository details and cannot enter the language calculation.

## Verification

The renderer and workflow actions use fixed commit references. Tests check language exclusions, organization contributions, private repository filtering, and public star totals. Generation stops when the API reports incomplete commit or language coverage. Failed runs preserve the published profile.
