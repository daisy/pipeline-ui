/*
Build a `dp2` command line equivalent to a job submitted from the app (issue #418).

Flag names follow the dp2 CLI rules (engine/cli/cli/scripts.go, getFlagName):
inputs are added first, then options, each named after the script item.
If a name collides with one of dp2's own flags or an already-added flag, it
gets an `i-` (input) or `x-` (option) prefix. Sequence values are joined
with commas, which is how dp2 splits them.

Stylesheet parameters: when dp2 supports it, each parameter becomes its own
flag (e.g. `--page-width 40`), named after the options, and dp2 rebuilds the
`stylesheet-parameters` option from them. Otherwise the combined string the
app submitted is passed as-is.
*/
import {
    JobRequest,
    NameValue,
    Script,
    ScriptItemBase,
    ScriptOption,
    Webservice,
} from 'shared/types'

const DP2_COMMON_FLAGS = [
    'output',
    'zip',
    'nicename',
    'priority',
    'quiet',
    'persistent',
    'background',
]

// dp2 only offers one flag per stylesheet parameter for scripts that have a
// `stylesheet-parameters` option and are listed here
// (engine/cli/cli/scripts.go, mediumForScript)
const DP2_STYLESHEET_PARAMETER_SCRIPTS = [
    'dtbook-to-daisy3',
    'dtbook-to-epub3',
    'dtbook-to-pef',
    'epub-to-daisy',
    'epub3-to-epub3',
    'epub3-to-pef',
    'html-to-pef',
    'zedai-to-epub3',
]
const STYLESHEET_PARAMETERS_OPTION = 'stylesheet-parameters'

const FILE_TYPES = ['anyFileURI', 'anyDirURI', 'anyURI']

export type CliCommandParams = {
    script: Script
    jobRequest: JobRequest
    // stylesheet parameter definitions for the job (job.stylesheetParameters),
    // used for their defaults
    stylesheetParameters?: Array<ScriptOption>
    // engine endpoint the job was sent to
    webservice?: Webservice
    // results folder, as a file URL or path
    outputFolder?: string
    // convert a file:// URL to a local path
    toPath: (fileUrl: string) => Promise<string>
    windows?: boolean
}

function quoteArg(arg: string, windows: boolean) {
    if (arg !== '' && /^[A-Za-z0-9_\-+=.,:/@%]+$/.test(arg)) {
        return arg
    }
    if (windows) {
        if (arg !== '' && /^[A-Za-z0-9_\-+=.,:/@%\\]+$/.test(arg)) {
            return arg
        }
        // double quotes, with embedded quotes escaped the way Go's
        // Windows argument parser expects
        return `"${arg.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1')}"`
    }
    return `'${arg.replace(/'/g, `'\\''`)}'`
}

async function toCliValue(
    item: ScriptItemBase,
    value: any,
    toPath: (fileUrl: string) => Promise<string>
): Promise<string> {
    const convert = async (v: any) => {
        let str = v === true ? 'true' : v === false ? 'false' : `${v ?? ''}`
        if (
            (item.kind == 'input' || FILE_TYPES.includes(item.type)) &&
            str.startsWith('file:')
        ) {
            try {
                str = await toPath(str)
            } catch (e) {
                // keep the URL, dp2 accepts it too
            }
        }
        return str
    }
    if (Array.isArray(value)) {
        const values = []
        for (const v of value) {
            const converted = await convert(v)
            if (converted !== '') values.push(converted)
        }
        return values.join(',')
    }
    return convert(value)
}

function findRequestValue(
    arr: Array<NameValue> | undefined,
    name: string
): any | undefined {
    return arr?.find((i) => i.name == name && !i.isStylesheetParameter)?.value
}

export async function buildCliCommand({
    script,
    jobRequest,
    stylesheetParameters,
    webservice,
    outputFolder,
    toPath,
    windows = false,
}: CliCommandParams): Promise<string> {
    const usedFlags = [...DP2_COMMON_FLAGS]
    const flagName = (name: string, prefix: string) => {
        const flag = usedFlags.includes(name) ? prefix + name : name
        usedFlags.push(flag)
        return flag
    }
    const args: string[] = ['dp2']
    // same global flags as runCliTool (src/main/factories/app/cli.ts)
    if (webservice?.host) {
        if (webservice.port) {
            args.push('--port', `${webservice.port}`)
        }
        args.push(
            '--host',
            quoteArg(
                `${webservice.ssl ? 'https://' : 'http://'}${webservice.host}`,
                windows
            )
        )
        if (webservice.path) {
            args.push(
                '--ws_path',
                quoteArg(
                    webservice.path.startsWith('/')
                        ? webservice.path.slice(1)
                        : webservice.path,
                    windows
                )
            )
        }
    }
    args.push(script.id)

    for (const input of script.inputs ?? []) {
        const flag = flagName(input.name, 'i-')
        const value = await toCliValue(
            input,
            findRequestValue(jobRequest.inputs, input.name),
            toPath
        )
        if (value !== '') {
            args.push(`--${flag}`, quoteArg(value, windows))
        }
    }

    const params = (jobRequest.stylesheetParameterOptions ?? []).filter(
        (p) => p.isStylesheetParameter
    )
    const useParamFlags =
        params.length > 0 &&
        DP2_STYLESHEET_PARAMETER_SCRIPTS.includes(script.id) &&
        (script.options ?? []).some(
            (o) =>
                o.name == STYLESHEET_PARAMETERS_OPTION &&
                !o.isStylesheetParameter
        )

    for (const option of script.options ?? []) {
        if (option.isStylesheetParameter) continue
        if (useParamFlags && option.name == STYLESHEET_PARAMETERS_OPTION) {
            // the flag still exists in dp2, but its value comes from the
            // individual parameter flags below
            flagName(option.name, 'x-')
            continue
        }
        const flag = flagName(option.name, 'x-')
        const value = await toCliValue(
            option,
            findRequestValue(jobRequest.options, option.name),
            toPath
        )
        // omit empty values and values that match the script default,
        // dp2 will use the same default
        if (value === '' || value === `${option.default ?? ''}`) continue
        args.push(`--${flag}`, quoteArg(value, windows))
    }

    if (useParamFlags) {
        for (const param of params) {
            const flag = flagName(param.name, 'x-')
            const value =
                param.value === true
                    ? 'true'
                    : param.value === false
                      ? 'false'
                      : `${param.value ?? ''}`
            const def = stylesheetParameters?.find(
                (p) => p.name == param.name
            )?.default
            // dp2 uses the stylesheet default for any parameter left out
            if (value === '' || (def !== undefined && value === `${def}`))
                continue
            args.push(`--${flag}`, quoteArg(value, windows))
        }
    }

    if (jobRequest.nicename) {
        args.push('--nicename', quoteArg(jobRequest.nicename, windows))
    }

    if (outputFolder) {
        let folder = outputFolder
        if (folder.startsWith('file:')) {
            try {
                folder = await toPath(folder)
            } catch (e) {}
        }
        args.push('--output', quoteArg(folder, windows))
    }

    return args.join(' ')
}
