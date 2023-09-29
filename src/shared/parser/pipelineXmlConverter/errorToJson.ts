import { JobRequestError } from 'shared/types'
import { parseXml } from './parser'

function errorXmlToJson(xmlString: string): JobRequestError {
    let errorElm = parseXml(xmlString, 'error')
    let descElms = errorElm.getElementsByTagName('description')
    let traceElms = errorElm.getElementsByTagName('trace')

    return {
        type: 'JobRequestError',
        description: descElms.length > 0 ? descElms[0].textContent?.trim() : '',
        trace: traceElms.length > 0 ? traceElms[0].textContent?.trim() : '',
    }
}

export { errorXmlToJson }
