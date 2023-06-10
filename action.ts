import { getBooleanInput, getInput, setFailed, setOutput } from '@actions/core'
import { context, getOctokit } from '@actions/github'
import { readFile } from 'fs/promises'

async function fetchChangelog(rest: any) {
  try {
    const { data } = await rest.repos.getContent({
      ...context.repo,
      path: 'changelog.md'
    })

    return [data.sha, await readFile('changelog.md', { encoding: 'utf-8' })]
  } catch (err) {
    return [null, '']
  }
}

async function getLatestRelease(rest: any) {
  try {
    const data = await rest.repos.getLatestRelease({
      ...context.repo
    })
  
    return data
  } catch (err) {
    return {
      status: 404
    }
  }
}

async function action() {
  const { rest } = getOctokit(getInput('token'))

  , tag = context.ref.replace('refs/tags/', '')

  , { data: latestRelease, status } = await getLatestRelease(rest)

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

  const style = getInput('style').split(', ')

  data.sort((a, b) => {
    const x = a.title.toLowerCase()
    const y = b.title.toLowerCase()

    if (x < y)
      return -1
    
    if (x > y)
      return 1

    return 0
  })

  for (const { user, title, number, merged_at, body } of data) {
    if (merged_at === null)
      continue

    if (status === 200 && new Date(latestRelease.created_at).getTime() > new Date(merged_at).getTime())
      continue

    const url = `https://github.com/${context.repo.owner}/${context.repo.repo}/pull/${number}`

    changelogBody += `\n* ${title} `

    releaseBody += `\n* ${title} `

    if (style.includes('author')) {
      changelogBody += `([#${number}](${url}))${
        user?.login ? ` by [@${user?.login}](https://github.com/${user?.login})` : ''
      }`
  
      releaseBody += `(${url})${
        user?.login ? ` by @${user?.login}` : ''
      }`
    } else {
      changelogBody += `([#${number}](${url}))`
  
      releaseBody += `(${url})`
    }

    if (style.includes('description') && body !== null && body.length > 0) {
      changelogBody += `\n\n  ${body}`
      releaseBody += `\n\n  ${body}`
    }
  }

  const { data: release } = await rest.repos.createRelease({
    owner: context.repo.owner,
    repo: context.repo.repo,
    tag_name: tag,
    name: tag,
    body: releaseBody,
    draft: getBooleanInput('draft') ?? false,
    prerelease: tag.includes('canary') || tag.includes('nightly') || tag.includes('rc') || getBooleanInput('prerelease'),
    target_commitish: context.sha
  })

  , [sha, content] = await fetchChangelog(rest)

  await rest.repos.createOrUpdateFileContents({
    ...context.repo,
    path: 'changelog.md',
    content: Buffer.from(`${changelogBody}${content === '' ? '\n' : `\n\n${content}`}`).toString('base64'),
    message: getInput('commit_message').replace('{tag}', tag),
    ...(sha !== null && { sha })
  })

  setOutput('release_id', release.id)
  setOutput('tag_name', tag)
  setOutput('created_at', release.created_at)
  setOutput('release_body', releaseBody)
  setOutput('changelog_body', changelogBody)
}

try {
  action()
} catch (err) {
  setFailed(err instanceof Error ? err.message : 'Something unexpected happened.')
}
