import core from '@actions/core'
import github, { context } from '@actions/github'

async function action() {
  const { rest } = github.getOctokit(process.env.GITHUB_TOKEN as string)

  , tag = github.context.ref.replace('refs/tags/', '')

  , { data: { created_at } } = await rest.repos.getLatestRelease({
    ...context.repo
  })

  let { data } = await rest.pulls.list({
    ...context.repo,
    per_page: 100,
    sort: 'updated',
    state: 'closed',
    direction: 'desc'
  })

  data = [...data, ...(await rest.pulls.list({
    ...context.repo,
    per_page: 100,
    sort: 'updated',
    state: 'closed',
    direction: 'desc',
    page: 2
  })).data]

  const year = new Date().getUTCFullYear()
  , month = new Date().getUTCMonth() + 1
  , day = new Date().getUTCDate()

  let changelogBody = `## [${tag}](https://github.com/${context.repo.owner}/${context.repo.repo}/releases/tag/${tag})\n`
  , releaseBody = `### ${tag} / ${year}.${month < 10 ? `0${month}` : month}.${day < 10 ? `0${day}` : day}\n`

  for (const { user, title, number, merged_at } of data) {
    if (merged_at === null)
      continue

    if (new Date(created_at).getTime() > new Date(merged_at).getTime())
      continue

    const url = `https://github.com/${context.repo.owner}/${context.repo.repo}/pull/${number}`

    changelogBody += `\n* ${title} ([#${number}](${url})${
      user?.login ? ` by [@${user?.login}](https://github.com/${user?.login})` : ''
    })`

    releaseBody += `\n* ${title} (${url}${
      user?.login ? ` by @${user?.login}` : ''
    })`
  }

  const { data: release } = await rest.repos.createRelease({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    tag_name: tag,
    name: tag,
    body: releaseBody,
    draft: core.getBooleanInput('draft') ?? false,
    prerelease: tag.includes('canary') || tag.includes('nightly') || tag.includes('rc') || core.getBooleanInput('prerelease'),
    target_commitish: github.context.sha
  })

  core.setOutput('release_id', release.id)
  core.setOutput('tag_name', release.tag_name)
  core.setOutput('created_at', release.created_at)
}

try {
  action()
} catch (err) {
  core.setFailed(err instanceof Error ? err.message : 'Something unexpected happened.')
}
