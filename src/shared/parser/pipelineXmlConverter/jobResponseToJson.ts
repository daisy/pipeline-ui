// a job response could be <job...> or <error... >
// find out which one

import { JobData, JobRequestError } from 'shared/types'
import { errorXmlToJson } from './errorToJson'
import { jobXmlToJson } from './jobToJson'
import { sniffRoot } from './parser'

function jobResponseXmlToJson(xmlString: string): JobData | JobRequestError {
    let rootElm = sniffRoot(xmlString)
    if (rootElm == 'error') {
        return errorXmlToJson(xmlString)
    } else if (rootElm == 'job') {
        return jobXmlToJson(xmlString)
    } else {
        return {
            type: 'JobUnknownResponse',
            description: 'Unrecognized response',
        } as JobRequestError
    }
}

export { jobResponseXmlToJson }
