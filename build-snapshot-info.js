const { execSync } = require('child_process')

const { version } = require('./package.json')

function run(command) {
    try {
        return execSync(command, {
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim()
    } catch {
        return ''
    }
}

function normalizeBranch(branch, fallback) {
    if (!branch || branch === 'HEAD') {
        return fallback
    }
    return branch.replace(/^origin\//, '')
}

function getSnapshotDate() {
    const commitDate = run('git show -s --format=%cI HEAD')
    const date = commitDate ? new Date(commitDate) : new Date()

    return date.toISOString().slice(0, 10).replace(/-/g, '')
}

function getSnapshotInfo() {
    const uiBranch = normalizeBranch(
        process.env.UI_BRANCH ||
            process.env.GITHUB_REF_NAME ||
            run('git rev-parse --abbrev-ref HEAD'),
        'develop'
    )
    const engineBranch = normalizeBranch(
        process.env.ENGINE_BRANCH ||
            run('git -C engine rev-parse --abbrev-ref HEAD'),
        'develop'
    )
    const uiHash = run('git rev-parse --short HEAD') || 'unknown'
    const engineHash =
        run('git -C engine rev-parse --short HEAD') ||
        run('git rev-parse --short HEAD:engine') ||
        'unknown'
    const snapshotDate = getSnapshotDate()
    const releaseName = `${version}-snapshot-${snapshotDate}`
    const releaseDescription = `ui ${uiBranch}@${uiHash}, engine ${engineBranch}@${engineHash}`

    return {
        releaseDescription,
        releaseName,
        snapshotDate,
        version,
    }
}

function getExperimentalReleaseInfo() {
    return {
        releaseName: `${version}-experimental`,
        version,
    }
}

module.exports = { getExperimentalReleaseInfo, getSnapshotInfo }
