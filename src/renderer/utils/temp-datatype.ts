import { datatypeXmlToJson } from 'shared/parser/pipelineXmlConverter'

import { baseurl } from 'shared/types'
import { useWindowStore } from 'renderer/store'

async function fetchTemporaryDatatype(id) {
    try {
        let href = `${baseurl(
            useWindowStore().pipeline.webservice
        )}/datatypes/${id}`
        // can't use IPC fetch due to async problems matching event send and receive
        // when multiple controls could be sending the same type of event
        // however this browser-based fetch is at risk of CORS issues depending on how the pipeline engine
        // was started
        // the reason we have to do this differently than with standard datatypes is that these temp
        // datatypes aren't at the global /datatypes endpoint
        let data = await fetch(href)
        let txt = await data.text()
        let datatypeAsJson = datatypeXmlToJson(href, id, txt)
        return datatypeAsJson ?? null
    } catch (err) {
        return null
    }
}
export { fetchTemporaryDatatype }
