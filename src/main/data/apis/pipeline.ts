import {
    aliveXmlToJson,
    datatypesXmlToJson,
    datatypeXmlToJson,
    jobRequestToXml,
    jobsXmlToJson,
    jobXmlToJson,
    scriptsXmlToJson,
    scriptXmlToJson,
    voicesToJson,
} from 'shared/parser/pipelineXmlConverter'
import {
    Datatype,
    baseurl,
    Job,
    ResultFile,
    Script,
    Webservice,
    NamedResult,
} from 'shared/types'

import fetch, { Response, RequestInit } from 'node-fetch'

import { info, error } from 'electron-log'
import { jobResponseXmlToJson } from 'shared/parser/pipelineXmlConverter/jobResponseToJson'

/**
 * Create a fetch function on the pipeline webservice
 * for which the resulting pipeline xml is parsed and converted to a js object
 * @type T return type of the parser
 * @param webserviceUrlBuilder method to build a url,
 * optionnaly using  a webservice (like ``(ws) => `${baseurl(ws)}/scripts` ``)
 * @param parser method to convert pipeline xml to an object object
 * @param options options to be passed to the fetch call
 * (like `{method:'POST', body:whateveryoulike}`)
 * @returns a customized fetch function from the webservice
 * `` (ws:Webservice) => Promise<Awaited<T>> ``
 */
function createPipelineFetchFunction<T>(
    webserviceUrlBuilder: (ws: Webservice) => string,
    parser: (text: string) => T,
    options?: RequestInit
) {
    return (ws?: Webservice) => {
        info('fetching ', webserviceUrlBuilder(ws))
        return fetch(webserviceUrlBuilder(ws), options)
            .then((response: Response) => response.text())
            .then((text: string) => parser(text))
    }
}

/**
 * Create a simple request on the pipeline webservice
 * @param webserviceUrlBuilder method to build a url, optionnaly using  a webservice (like ``(ws) => `${baseurl(ws)}/scripts` ``)
 * @param options options to be passed to the fetch call (like `{method:'POST', body:whateveryoulike}`)
 * @returns a customized fetch function from the webservice `` (ws:Webservice) => Promise<Awaited<T>> ``
 */
function createPipelineRequestFunction(
    webserviceUrlBuilder: (ws: Webservice) => string,
    options?: RequestInit
) {
    return (ws?: Webservice) => {
        info('request', options.method ?? '', webserviceUrlBuilder(ws))
        return fetch(webserviceUrlBuilder(ws), options)
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
            (text) => jobResponseXmlToJson(text),
            {
                method: 'POST',
                body: jobRequestToXml({
                    ...j.jobRequest,
                    nicename:
                        j.jobRequest.nicename || j.jobData.nicename || 'Job',
                }),
            }
        ),
    deleteJob: (j: Job) =>
        createPipelineRequestFunction(() => j.jobData.href, {
            method: 'DELETE',
        }),
    fetchResult: (r: ResultFile | NamedResult) => () =>
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
    fetchAlive: () =>
        createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/alive`,
            (text) => aliveXmlToJson(text)
        ),
    fetchVoices: () =>
        createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/voices`,
            (text) => voicesToJson(text)
        ),
}
