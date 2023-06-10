## log

If you use log, you should have a `changelog.md` file (if you don`t, it will be generated). All your changes should be made through pull requests. log collects the titles of the last merged pull requests and creates a changelog and a release when you push a new tag to the origin.

`.github/workflows/update.yml`

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
      pull-requests: 'read'
      contents: 'write'

    steps:
      - uses: 'actions/checkout@v3'

      - name: 'Grab Tag'
        run: echo "TAG=${GITHUB_REF#refs/*/}" >> $GITHUB_ENV

      - name: 'Create Release'
        uses: 'azurystudio/log@v1'
        env:
          token: '${{ secrets.GITHUB_TOKEN }}'

      - name: 'Commit Changelog'
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email '41898282+github-actions[bot]@users.noreply.github.com'
          git pull origin dev
          git add -A
          git commit -am "package: publish ${{ env.TAG }}"
          git push origin HEAD:dev
```

### Action Inputs

| Name | Description | Default |
| --- | --- | --- |
| `draft` | Create the release as a draft. | `false` |
| `prerelease` | Create the release as a prerelease. | `false` |
| `style` | Set the style of the changelog. This is a combination of the following options separated by a space: `description`, `author` | `description` |
| `token` | `GITHUB_TOKEN` (permissions `contents: write` and `pull-requests: read`) or a `repo` scoped [Personal Access Token (PAT)](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token). | `GITHUB_TOKEN` |

### Action Outputs

- `release_id`
- `tag_name`
- `created_at`
