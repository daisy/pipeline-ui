import {
    jobRequestToXml,
    jobsXmlToJson,
    jobXmlToJson,
    scriptsXmlToJson,
    scriptXmlToJson,
} from 'shared/parser/pipelineXmlConverter'
import { baseurl, Job, Webservice } from 'shared/types'

import fetch, { Response, RequestInit } from 'node-fetch'

/**
 * @type T return type of the parser
 * @param webserviceUrlBuilder method to build a url, optionnaly using  a webservice (like ``(ws) => `${baseurl(ws)}/scripts` ``)
 * @param parser method to convert pipeline xml to an object object
 * @param options options to be passed to the fetch call (like `{method:'POST', body:whateveryoulike}`)
 * @returns a customized fetch function from the webservice `` (ws:Webservice) => Promise<Awaited<T>> ``
 */
function createPipelineFetchFunction<T>(
    webserviceUrlBuilder: (ws: Webservice) => string,
    parser: (text: string) => T,
    options?: RequestInit
) {
    return (ws: Webservice) => {
        return fetch(webserviceUrlBuilder(ws), options)
            .then((response: Response) => response.text())
            .then((text) => Promise.resolve(parser(text)))
    }
}

export const pipelineAPI = {
    fetchScripts: () =>
        createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/scripts`,
            (text) => {
                return Promise.all(
                    scriptsXmlToJson(text).map(async (scriptData) => {
                        return fetch(scriptData.href)
                            .then((value) => value.text())
                            .then((text) => scriptXmlToJson(text))
                    })
                )
            }
        ),
    fetchJobs: () =>
        createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/jobs`,
            (text) => jobsXmlToJson(text)
        ),
    fetchJobData: (j: Job) =>
        createPipelineFetchFunction(
            () => j.jobData.href,
            (text) => jobXmlToJson(text)
        ),
    launchJob: (j: Job) =>
        createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/jobs`,
            (text) => jobXmlToJson(text),
            {
                method: 'POST',
                body: jobRequestToXml(j.jobRequest),
            }
        ),
}
