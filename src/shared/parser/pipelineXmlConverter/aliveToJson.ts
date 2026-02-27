import { Alive } from 'shared/types'
import { parseXml } from './parser'

function aliveXmlToJson(xmlString: string): Alive {
    try {
        let aliveElm = parseXml(xmlString, 'alive')
        return {
            alive: true,
            localfs: aliveElm.getAttribute('localfs') == 'true',
            authentication: aliveElm.getAttribute('authentication') == 'true',
            version: aliveElm.getAttribute('version'),
        }
    } catch (err) {
        return {
            alive: false,
        }
    }
}

export { aliveXmlToJson }
