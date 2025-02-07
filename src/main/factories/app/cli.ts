/**
 * Parsing command line to create jobs
 * @param {Array<string>} commandLineArgs command line arguments
 */

import { store } from 'main/data/store'
import { getPipelineInstance } from 'main/data/middlewares/pipeline'
import path from 'path'
import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { Webservice } from 'shared/types'

/**
 * Run the cli utility from within the app
 * @param args cli arguments
 */
export function runCliTool(ws: Webservice, args: string[]) {
    const cliTool = path.resolve(
        getPipelineInstance(store.getState()).props.pipelineHome,
        'cli',
        'dp2' + (process.platform === 'win32' ? '.exe' : '')
    )
    if (!existsSync(cliTool)) {
        console.error(
            'Pipeline app embedded pipeline is not distributed with the cli tools, aborting launch, please update your pipeline app'
        )
        return
    }
    var childProcess = spawnSync(
        cliTool,
        [
            '--port',
            ws.port.toString(),
            '--host',
            `${ws.ssl ? 'https://' : 'http://'}${ws.host}`,
            '--ws_path',
            `${ws.path.startsWith('/') ? ws.path.slice(1) : ws.path}`,
            ...args,
        ],
        {
            cwd: process.cwd(),
            env: process.env,
            stdio: [null, process.stdout, process.stderr],
            encoding: 'utf-8',
        }
    )
}
