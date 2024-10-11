import { datatypeXmlToJson } from 'shared/parser/pipelineXmlConverter'

const { App } = window
// import { baseurl } from 'shared/types'
// import { useWindowStore } from 'renderer/store'

async function fetchTemporaryDatatype(id) {
    try {
        // let href = `${baseurl(
        //     useWindowStore().pipeline.webservice
        // )}/datatypes/${id}`
        // TODO construct URL dynamically; the above was causing react to throw lifecycle error
        let href = `http://localhost:49152/ws/datatypes/${id}`
        // can't use IPC fetch due to async problems matching event send and receive
        // when multiple controls could be sending the same type of event
        // however this browser-based fetch is at risk of CORS issues depending on how the pipeline engine
        // was started
        // the reason we have to do this differently than with standard datatypes is that these temp
        // datatypes aren't at the global /datatypes endpoint
        let data = await fetch(href)
        let txt = await data.text()
        console.log(`data for ${id}: \n`, txt)
        let datatypeAsJson = datatypeXmlToJson(href, id, txt)
        return datatypeAsJson ?? null
    } catch (err) {
        return null
    }
}
export { fetchTemporaryDatatype }
