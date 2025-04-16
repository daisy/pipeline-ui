import { Job, NamedResult, ResultFile } from 'shared/types'
import { pipelineAPI } from '../../apis/pipeline'
import { saveFile, unzipFile } from 'main/ipcs/file'
import { pathToFileURL } from 'url'
import { error } from 'electron-log'

export async function downloadNamedResult(r: NamedResult, targetUrl: string) {
    return pipelineAPI
        .fetchResult(r)()
        .then((buffer) =>
            r.mimeType === 'application/zip'
                ? unzipFile(buffer, targetUrl)
                : saveFile(buffer, targetUrl)
        )
        .then((files) => {
            const filesUrls = files.map((f) => pathToFileURL(f))
            let newResult: NamedResult = Object.assign({}, r)
            newResult.href = targetUrl
            newResult.files = newResult.files.map((res) => {
                let newResultFile: ResultFile = Object.assign({}, res)
                const urlFound = filesUrls.find((furl) =>
                    res.file.endsWith(furl.href.substring(targetUrl.length))
                )
                if (urlFound) {
                    newResultFile.file = urlFound.href
                }
                return newResultFile
            })
            return newResult
        })
        .catch((e) => {
            // if a problem occured, return the original result
            error('Error downloading named result', r, e)
            return r
        })
}

export async function downloadJobLog(j: Job, targetFolder: string) {
    let jobTargetUrl = new URL(`${targetFolder}/job.log`).href
    return pipelineAPI
        .fetchJobLog(j)()
        .then((log) => {
            // @ts-ignore
            saveFile(new TextEncoder().encode(log), jobTargetUrl)
            return {
                ...j,
                jobData: {
                    ...j.jobData,
                    log: jobTargetUrl,
                    results: {
                        ...(j.jobData.results ? j.jobData.results : {}),
                        namedResults: [
                            ...(j.jobData.results?.namedResults
                                ? j.jobData.results.namedResults
                                : []),
                        ],
                    },
                },
            } as Job
        })
        .catch((e) => {
            // Log is not accessible, revert back to default log url
            // and continue the chain of promise
            error('Error downloading job log', e)
            return j
        })
}

export async function downloadJobResults(j: Job, targetFolder: string) {
    // Download log, named results, and unzip named results archives
    return Promise.all(
        j.jobData.results?.namedResults?.map((r) =>
            downloadNamedResult(
                r,
                new URL(`${targetFolder}/${r.nicename ?? r.name}`).href
            )
        ) || []
    )
        .then((downloadedNamedResults: NamedResult[]) => {
            return {
                ...j,
                jobData: {
                    ...j.jobData,
                    downloadedFolder: targetFolder,
                    results: {
                        ...(j.jobData.results ?? {}),
                        namedResults: [...downloadedNamedResults],
                    },
                },
            } as Job
        })
        .then(async (j: Job) => await downloadJobLog(j, targetFolder))
        .catch((e) => {
            error('Error downloading job results', e)
            return j
        })
}
