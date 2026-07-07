# CI Workflows

## test-build.yml — Test Build

**Triggers:** push or PR to `develop`

Runs on Ubuntu only (no installer, fast). Type-checks with `tsc --noEmit` and compiles with `yarn build`. Used to catch TypeScript errors and broken builds before merging.

No artifacts produced.

---

## package.yml — Package

**Triggers:**
- Manual dispatch (GitHub Actions UI)
- Push to `develop-engine-snapshot` branch (see engine-snapshot below)

Builds unsigned installers on macOS and Windows without signing or notarizing. Uploads `.pkg` and `.exe` as downloadable workflow artifacts. Useful for internal testing or sharing a build without going through a full release.

When triggered by a push to `develop-engine-snapshot`, this workflow also creates or updates the draft `ci-snapshot` GitHub Release. The release description includes links to open issues in the current open milestone with the `ready-for-testing` label.

If the snapshot trigger requested a testing snapshot, this workflow also creates a duplicate draft release with the title `testing-snapshot <milestone>-<index>`. The tag uses a URL-safe form, `testing-snapshot-<milestone-slug>-<index>`, and the index is one higher than the existing testing snapshots for that milestone.

---

## release.yml — Release

**Triggers:** version tags — `v1.2.3` (final) or `v1.2.3-beta.1` (beta/preview)

Builds signed, notarized installers on macOS and Windows and publishes them to a **draft** GitHub Release. The release stays as a draft until manually published.

Mac signing flow:
1. `yarn release` builds and signs the `.app` (Developer ID Application cert via `CSC_LINK`) and notarizes it
2. `sign-installer-mac.sh` signs the `.pkg` with the Developer ID Installer cert, re-notarizes it, and re-uploads it to the draft release

Windows builds are currently unsigned (no cert available).

Required secrets: `GH_PIPELINE_TOKEN`, `APPLE_ID`, `APPLE_ID_PASS`, `APPLE_ID_TEAM`, `CSC_LINK`, `CSC_KEY_PASSWORD`, `INSTALLER_CERT_P12`, `INSTALLER_CERT_PASSWORD`, `DEV_ID_INSTALLER`

---

## snapshot.yml — Engine Snapshot

**Triggers:** Manual dispatch with an optional `engine_sha` input field and an optional testing snapshot checkbox

Creates or force-updates the `develop-engine-snapshot` branch in this repo. That branch is always: **current `develop` UI code + `develop` engine code or a specific engine commit**. The push to `develop-engine-snapshot` then triggers `package.yml` to produce a downloadable artifact.

Engine SHA resolution:
1. `engine_sha` input if provided
2. HEAD of engine `develop` branch if no SHA is given

The `develop-engine-snapshot` branch is a disposable build branch — it is never merged back into `develop` or `main`.
