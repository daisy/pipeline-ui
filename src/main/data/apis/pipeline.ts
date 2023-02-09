import {
    datatypesXmlToJson,
    datatypeXmlToJson,
    jobRequestToXml,
    jobsXmlToJson,
    jobXmlToJson,
    scriptsXmlToJson,
    scriptXmlToJson,
} from 'shared/parser/pipelineXmlConverter'
import {
    Datatype,
    baseurl,
    Job,
    ResultFile,
    Script,
    Webservice,
} from 'shared/types'

import fetch, { Response, RequestInit } from 'node-fetch'

import { info, error } from 'electron-log'

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
    return (ws?: Webservice) => {
        info('fetching ', webserviceUrlBuilder(ws))
        return fetch(webserviceUrlBuilder(ws), options)
            .then((response: Response) => {
                return response.text()
            })
            .then((text) => {
                const parsed = parser(text)
                return parsed
            })
    }
}

export const pipelineAPI = {
    fetchScriptDetails: (s: Script) =>
        createPipelineFetchFunction(
            () => s.href,
            (text) => scriptXmlToJson(text)
        ),
    fetchScripts: () =>
        createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/scripts`,
            (text) => scriptsXmlToJson(text)
        ),
    fetchJobs: () =>
        createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/jobs`,
            (text) => jobsXmlToJson(text)
        ),
    fetchJobData: (j: Job) =>
        createPipelineFetchFunction(
            () => j.jobData.href,
            (text) => {
                return jobXmlToJson(text)
            }
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
    fetchFile: (r: ResultFile) => () =>
        fetch(r.href)
            .then((response) => response.blob())
            .then((blob) => blob.arrayBuffer()),
    fetchDatatypeDetails: (d: Datatype) =>
        createPipelineFetchFunction(
            () => d.href,
            (text) => datatypeXmlToJson(d.href, d.id, text)
        ),
    fetchDatatypes: () =>
        createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/datatypes`,
            (text) => datatypesXmlToJson(text)
        ),
}
