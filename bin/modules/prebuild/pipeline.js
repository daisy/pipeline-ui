/**
 * Build script for the DAISY Pipeline 2 'engine' submodule
 */
const { execSync, spawnSync } = require('child_process')
const path = require('path')
const process = require('process')
const fs = require('fs')
const os = require('os')
const decompress = require('decompress')
const { stdout, stderr } = require('process')

/**
 * recursive listing of files in a folder with filtering
 * @param {string} dir the directory to list files from
 * @param {function(string)} filter filter callback, that should return true if a file is matching it
 * @param {boolean} includeDir (default to false) if true, also includes the foldes in the results list with filter applied
 * @returns {string[]} the list of file path matching the filter
 */
function walk(
    dir /*: string*/,
    filter /*?: (name: string) => boolean*/,
    includeDir = false
) /*: string[]*/ {
    let results /*: string[]*/ = []
    let list = fs.readdirSync(dir)
    list.forEach(function (file) {
        file = path.resolve(dir, file)
        let stat = fs.statSync(file)
        /* Is a file */
        if (stat && stat.isDirectory()) {
            if (includeDir) {
                ;(!filter || filter(file)) && results.push(file)
            }
            /* Recurse into a subdirectory */
            results = results.concat(walk(file, filter, includeDir))
        } else {
            ;(!filter || filter(file)) && results.push(file)
        }
    })
    return results
}

const deployFolder = path.resolve('src', 'resources', 'daisy-pipeline')

const refresh =
    process.argv.indexOf('--refresh') > -1 || !fs.existsSync(deployFolder)
const update =
    process.argv.indexOf('--update') > -1 ||
    !fs.existsSync('engine') ||
    fs.readdirSync('engine').length == 0

const withCli = process.argv.indexOf('--with-cli') > -1

const fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args))

const getJDKPlatform = (platform) =>
    platform === 'win32' ? 'windows' : platform === 'darwin' ? 'mac' : 'linux'

const getJDKArch = (arch) =>
    arch === 'x64' ? 'x64' : arch === 'arm64' ? 'aarch64' : 'x86-32'

const execOpts = (java_home, maven_home = '') => ({
    //cwd: path.resolve('engine'),
    env: {
        JAVA_HOME: java_home,
        PATH: [
            ...process.env.PATH.split(path.delimiter),
            path.join(java_home, 'bin'),
            ...(maven_home != '' ? [path.join(maven_home, 'bin')] : []),
        ].join(path.delimiter), // Required on MacOS : path is not forwarded as on windows
    },
    stderr: 'inherit',
    stdio: 'inherit',
})

/**
 * Get a maven command.
 * if `useOwnMvn` is true, the code first tries if it can call the `mvn` command directly
 * (if maven bin folder is registered in PATH)
 * If no maven command is found, it will download maven 3.8.6, put it in engine/src/main/maven,
 * and return the path to the maven executable file (bash or cmd file)
 * @param {boolean} useOwnMvn (defaults to true) if true, the program will try to use the system `mvn` command
 * @returns {string} a maven command string to be used in spawn or exec as first argument.
 */
async function getMaven(useOwnMvn = true) {
    let mavenCmd = 'mvn' + (os.platform() === 'win32' ? '.cmd' : '')
    // Check if you have maven and download it if not
    let mvnAvailabe = useOwnMvn
    if (mvnAvailabe) {
        try {
            let stdout = execSync(mavenCmd + ' --version').toString()
            const versionSearch = /Apache Maven (\d+\.\d+\.\d+)/
            try {
                const [major, minor, patch] = stdout
                    .match(versionSearch)[1]
                    .split('.')
                // Now can do version check if needed
            } catch (err) {
                mvnAvailabe = false
            }
        } catch (error) {
            console.error(
                `An error occured while trying to run system wide maven.\n
-- I will download maven for you. --`
            )
            mvnAvailabe = false
        }
    }

    if (!mvnAvailabe) {
        const targetPath = path.join('engine', 'src', 'main', 'maven')
        if (fs.existsSync(targetPath)) {
            mavenCmd = walk(targetPath, (file) =>
                file.endsWith(
                    'bin' +
                        path.sep +
                        'mvn' +
                        (os.platform() === 'win32' ? '.cmd' : '')
                )
            )[0]
        }
        if (!mavenCmd) {
            if (fs.existsSync(targetPath)) {
                // Probleme occured with a maven unzipping, remove the folder to recreate it
                fs.rmSync(targetPath, { recursive: true })
            }
            fs.mkdirSync(targetPath, { recursive: true })
            let mavenToolchainURL = new URL(
                'https://dlcdn.apache.org/maven/maven-3/3.8.6/binaries/apache-maven-3.8.6-bin.zip'
            )
            let mavenFiles = await fetch(mavenToolchainURL)
                .then((response) => response.blob())
                .then((blob) => blob.arrayBuffer()) // TODO : add sha521 checksum verification to ensure valid download
                .then((buffer) => decompress(Buffer.from(buffer), targetPath))
                .then((files) =>
                    files.map((file) => path.resolve(targetPath, file.path))
                )
                .catch((err) => {
                    console.error(
                        `Sorry, I could not download and unzip maven 3.8.6 on your system.\n
Please install one manually and retry`,
                        err
                    )
                    throw err
                })
            mavenCmd = mavenFiles.filter((file) =>
                file.endsWith(
                    'bin' +
                        path.sep +
                        'mvn' +
                        (os.platform() === 'win32' ? '.cmd' : '')
                )
            )[0]
        }
    }
    return { cmd: mavenCmd, home: !mvnAvailabe ? path.dirname(mavenCmd) : '' }
}

/**
 * Get the path to a valid JAVA_HOME.
 * If no platform and arch parameters are provided, it will look for a system-wide JAVA_HOME with a jlink program inside.
 * If platform or arch is provided, it will download and put a valid jdk under the engine/src/main/jre folder
 * and return a valid JAVA_HOME path for it.
 * @param {'aix'|'darwin'|'freebsd'|'linux'|'openbsd'|'sunos'|'win32'} platform Operating system identifier, @see process.platform
 * @param {'arm'|'arm64'|'ia32'|'mips'|'mipsel'|'ppc'|'ppc64'|'s390'|'s390x'|'x64'} arch system architecture, @see process.arch
 * @returns a path to a javahome
 */
async function getJDK(platform = null, arch = null) {
    let java_home = process.env.JAVA_HOME
    let jlinkCmd = path.join(java_home, 'bin', 'jlink')

    const jdkVersion = os.platform() === 'darwin' ? '17.0.5+8' : '11.0.17+8'
    const jdkSystem = getJDKPlatform(platform ?? os.platform())
    const jdkArch = getJDKArch(arch ?? os.arch())
    const jdkMajor = jdkVersion.split('.')[0]

    // Note : check if the specific jdk arch provided is valid
    let requestedJDKIsInstalled =
        platform == null && arch == null && java_home !== undefined
    if (requestedJDKIsInstalled) {
        // Check if the current java_home points to a valid jdk
        try {
            let stdout = execSync(jlinkCmd + ' --version').toString()
            const versionSearch = /(\d+\.\d+\.\d+)(\.\d+)?/
            try {
                const [major, minor, patch] = stdout
                    .match(versionSearch)[1]
                    .split('.')
                // Check if the jdk major version matches the target
                requestedJDKIsInstalled = major == jdkMajor
            } catch (err) {
                console.error('Version not found')
                requestedJDKIsInstalled = false
            }
        } catch (error) {
            console.error(
                'No jlink found in JAVA_HOME folder, downloading a jdk'
            )
            requestedJDKIsInstalled = false
        }
    }
    if (!requestedJDKIsInstalled) {
        // No valid JDK installed for the requested settings
        // Download a valid one
        const archiveName =
            `OpenJDK${jdkMajor}U-jdk_${jdkArch}_${jdkSystem}` +
            `_hotspot_${jdkVersion.replace('+', '_')}`
        const extension = os.platform() === 'win32' ? 'zip' : 'tar.gz'
        // Download the jdk and unzip it in the engine/src/main/jre/archive_name folder
        const url = new URL(
            `https://github.com/adoptium/temurin${jdkMajor}-binaries/releases/download` +
                `/jdk-${encodeURIComponent(jdkVersion)}` +
                `/${archiveName}.${extension}`
        )
        const targetPath = path.join(
            'engine',
            'src',
            'main',
            'jre',
            archiveName
        )
        try {
            java_home = fs.existsSync(targetPath)
                ? path.dirname(
                      walk(
                          path.resolve(targetPath),
                          (file) => file.endsWith('bin'),
                          true
                      )[0]
                  )
                : null
        } catch (err) {
            java_home = null
        }
        if (!java_home) {
            if (fs.existsSync(targetPath)) {
                // Probleme occured with a maven unzipping, remove the folder to recreate it
                fs.rmSync(targetPath, { recursive: true })
            }
            fs.mkdirSync(targetPath, { recursive: true })
            const jdkFiles = await fetch(url)
                .then((response) => {
                    console.info(
                        'Downloading',
                        `${archiveName}.${extension}`,
                        '...'
                    )
                    return response.blob()
                })
                .then((blob) => blob.arrayBuffer())
                .then((buffer) => {
                    console.info(
                        'Decompressing',
                        `${archiveName}.${extension}`,
                        '...'
                    )
                    return decompress(Buffer.from(buffer), targetPath)
                })
                .then((files) =>
                    files.map((file) => path.resolve(targetPath, file.path))
                )
                .catch((err) => {
                    console.error(
                        'Could not download and decompress OpenJDK',
                        err
                    )
                    throw err
                })
            java_home = path.dirname(
                jdkFiles.filter((file) => file.endsWith('bin'))[0]
            )
        }
    }
    return java_home
}

/**
 * Download requirements if necessary and build the pipeline for the ui project.
 * If `platform` and `arch` are null, the build will try to use system jdk first.
 * @param {boolean} refresh if true, the pipeline should be completely rebuild
 * @param {string|null} platform nodejs platform selector (as returned by os.platform()) for jdk version targetting.
 * @param {string|null} arch nodejs architecture selector (as returned by os.arch()) for jdk version targetting.
 */
async function buildPipeline(platform = null) {
    // Check if 'engine' repository is not empty to ensure pipeline can be build
    if (update) {
        try {
            console.info('Checking engine submodule updates')
            execSync('git submodule update --init')
        } catch (err) {
            console.error(
                'Could not init DAISY Pipeline submodule, bypassing the build stage',
                err
            )
            return
        }
    }
    const { cmd: mvn, home: mvnHome } = await getMaven()
    console.info(' > Using maven command : ', mvn)
    let java_home = await getJDK()
    console.info(' > Using java home : ', java_home)
    const targetedPlatform = getJDKPlatform(platform ?? os.platform())
    let makeCmd = 'make'
    if (targetedPlatform == 'windows') {
        makeCmd = path.resolve('make.exe')
    }
    try {
        console.debug(`launching command : ${makeCmd} clean`)
        console.debug('with execution options :', execOpts(java_home))
        const makeCall = spawnSync(
            makeCmd,
            ['clean'],
            execOpts(java_home, mvnHome)
        )
        if (makeCall.error) throw makeCall.error
    } catch (err) {
        console.error(err)
        throw err
    }
    try {
        console.debug(
            `launching command : ${makeCmd} src/resources/daisy-pipeline`
        )
        console.debug('with execution options :', execOpts(java_home))
        const makeCall = spawnSync(
            makeCmd,
            ['src/resources/daisy-pipeline'],
            execOpts(java_home, mvnHome)
        )
        if (makeCall.error) throw makeCall.error
    } catch (err) {
        console.error(err)
        throw err
    }
}

//// MAIN PROCESS ////

// TODO : replace the refresh arg by a version check to verify if a newer version has been pulled from the submodule
// and trigger the update if so
if (refresh) {
    let platform = process.argv.filter(
        (arg) =>
            [
                'aix',
                'darwin',
                'freebsd',
                'linux',
                'openbsd',
                'sunos',
                'win32',
            ].indexOf(arg) >= 0
    )[0]

    buildPipeline(platform ?? os.platform())
}
