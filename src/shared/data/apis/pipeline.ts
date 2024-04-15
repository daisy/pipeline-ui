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
    ttsConfigToXml,
} from 'shared/parser/pipelineXmlConverter'
import {
    Datatype,
    baseurl,
    Job,
    ResultFile,
    Script,
    Webservice,
    NamedResult,
    TtsConfig,
    EngineProperty,
} from 'shared/types'

import { jobResponseXmlToJson } from 'shared/parser/pipelineXmlConverter/jobResponseToJson'
import { propertiesXmlToJson } from 'shared/parser/pipelineXmlConverter/propertiesXmlToJson'
import { propertyToXml } from 'shared/parser/pipelineXmlConverter/propertyToXml'
import { ttsEnginesToJson } from 'shared/parser/pipelineXmlConverter/ttsEnginesToJson'
import { parametersXmlToJson } from 'shared/parser/pipelineXmlConverter/parametersXmlToJson'
import { jobToStylesheetParametersXml } from 'shared/parser/pipelineXmlConverter/jobToStylesheetParametersXml'

//import fetch, { Response, RequestInit } from 'node-fetch'
//import { info, error } from 'electron-log'

interface Response {
    text: () => Promise<string>
    blob: () => Promise<{
        arrayBuffer: () => Promise<ArrayBuffer>
    }>
    status?: number
    statusText?: string
}

interface RequestInit {
    method?: string
    body?: {}
}
/**
 * PipelineAPI class to fetch data from the webserver.
 *
 * A fetch function is passed in constructor to allow the use in both
 * view and application side
 */
export class PipelineAPI {
    fetchFunc: (url: string, options?: RequestInit) => Promise<Response>
    info: (message?: any, ...optionalParams: any[]) => void
    constructor(fetchFunc, info?) {
        this.fetchFunc = fetchFunc
        this.info = info ?? console.info
    }
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
    createPipelineFetchFunction<T>(
        webserviceUrlBuilder: (ws: Webservice) => string,
        parser: (text: string) => T,
        options?: RequestInit
    ) {
        return (ws?: Webservice) => {
            this.info(
                'fetching ',
                webserviceUrlBuilder(ws),
                JSON.stringify(options)
            )
            return this.fetchFunc(webserviceUrlBuilder(ws), options)
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
    createPipelineRequestFunction(
        webserviceUrlBuilder: (ws: Webservice) => string,
        options?: RequestInit
    ) {
        return (ws?: Webservice) => {
            this.info('request', options.method ?? '', webserviceUrlBuilder(ws))
            return this.fetchFunc(webserviceUrlBuilder(ws), options)
        }
    }

    fetchScriptDetails(s: Script) {
        return this.createPipelineFetchFunction(
            () => s.href,
            (text) => scriptXmlToJson(text)
        )
    }
    fetchScripts() {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/scripts`,
            (text) => scriptsXmlToJson(text)
        )
    }
    fetchJobs() {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/jobs`,
            (text) => jobsXmlToJson(text)
        )
    }
    fetchJobData(j: Job) {
        return this.createPipelineFetchFunction(
            () => j.jobData.href,
            (text) => {
                return jobXmlToJson(text)
            }
        )
    }
    fetchJobLog(j: Job) {
        return this.createPipelineFetchFunction(
            () => j.jobData.log,
            (text) => text
        )
    }
    launchJob(j: Job) {
        return this.createPipelineFetchFunction(
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
        )
    }
    /**
     * Delete a job in the pipeline
     * @param j the job to delete
     * @returns the http response of the webserver. Expected codes are <br/>
     * - 204 on job removal
     * - 404 if the job does not exists (i.e. if it has already been removed)
     */
    deleteJob(j: Job) {
        return this.createPipelineRequestFunction(() => j.jobData.href, {
            method: 'DELETE',
        })
    }
    fetchResult(r: ResultFile | NamedResult): () => Promise<ArrayBuffer> {
        return () =>
            this.fetchFunc(r.href)
                .then((response) => response.blob())
                .then((blob) => blob.arrayBuffer())
    }
    fetchDatatypeDetails(d: Datatype) {
        return this.createPipelineFetchFunction(
            () => d.href,
            (text) => datatypeXmlToJson(d.href, d.id, text)
        )
    }
    fetchDatatypes() {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/datatypes`,
            (text) => datatypesXmlToJson(text)
        )
    }
    fetchAlive() {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/alive`,
            (text) => aliveXmlToJson(text)
        )
    }
    fetchTtsVoices(ttsConfig: TtsConfig) {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/voices`,
            (text) => voicesToJson(text),
            {
                method: 'POST',
                body: ttsConfigToXml(ttsConfig),
            }
        )
    }
    // New /admin/properties endpoint : https://github.com/daisy/pipeline-ui/issues/178
    fetchProperties() {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/admin/properties`,
            (text) => propertiesXmlToJson(text)
        )
    }
    setProperty(prop: EngineProperty) {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/admin/properties/${prop.name}`,
            (text) => console.log(text),
            {
                method: 'PUT',
                body: propertyToXml(prop),
            }
        )
    }

    fetchTtsEnginesFeatures() {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/tts-engines`,
            (text) => ttsEnginesToJson(text)
        )
    }
    // New /stylesheet-parameters endpoint : https://github.com/daisy/pipeline-ui/issues/198
    // and https://github.com/daisy/pipeline/issues/750
    /**
     * Fetch new script options from a braille targeted job with
     * inputs, stylesheet, page-width and page-height parameters set
     * @param j the braille job
     * @returns the script options to use for the job
     */
    fetchStylesheetParameters(j: Job) {
        return this.createPipelineFetchFunction(
            (ws) => `${baseurl(ws)}/stylesheet-parameters`,
            (text) => parametersXmlToJson(text),
            {
                method: 'POST',
                body: jobToStylesheetParametersXml(j),
            }
        )
    }
}
