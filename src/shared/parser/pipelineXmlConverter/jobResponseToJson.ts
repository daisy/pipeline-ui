// a job response could be <job...> or <error... >
// find out which one

import { errorXmlToJson } from './errorToJson'
import { jobXmlToJson } from './jobToJson'
import { sniffRoot } from './parser'

function jobResponseXmlToJson(xmlString: string) {
    let rootElm = sniffRoot(xmlString)
    if (rootElm == 'error') {
        return errorXmlToJson(xmlString)
    } else if (rootElm == 'job') {
        return jobXmlToJson(xmlString)
    } else {
        return { error: true, description: 'Unrecognized response' }
    }
}

export { jobResponseXmlToJson }
