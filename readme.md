## log

If you use log, you should have a `changelog.md` file (if you don't, it will be generated).

All your changes should be made through pull requests. log collects the titles of the last merged pull requests and creates a changelog and a release when you push a new tag to the origin.

`.github/workflows/publish.yml`

```yml
name: 'publish'

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: 'ubuntu-latest'

    permissions:
      contents: 'write'
      pull-requests: 'read'

    steps:
      - uses: 'actions/checkout@v3'

      - name: 'Publish Release'
        uses: 'azurystudio/log@v1'
```

### Action Inputs

| Name | Description | Default |
| --- | --- | --- |
| `draft` | `false` |
| `prerelease` | Create the release as a prerelease. | `false` |
| `style` | Set the style of the changelog. This is a combination of the following options separated by a comma and space, e.g. `author, description`: `description`, `author` | |
| `commit_message` | Set a custom commit message. If your message contains `{tag}`, it'll be automatically replaced with the tag name of the release. | `package: publish {tag}` |
| `token` | `GITHUB_TOKEN` (permissions `contents: write` and `pull-requests: read`) or a `repo` scoped [Personal Access Token (PAT)](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). | `GITHUB_TOKEN` |

### Action Outputs

| Name | Example |
| --- | --- |
| `release_id` | `1` |
| `tag_name` | `v1.0.0` |
| `created_at` | `2023-06-10T16:29:08.625Z` |
| `release_body` | |
| `changelog_body` | |
