import { Datatype } from 'shared/types'
import { parseXml } from './parser'

// parses a datatypes xml file
/* e.g. 
<datatypes>
    <datatype id="" href=""/>
    ...
</datatypes>
*/
function datatypesXmlToJson(xmlString): Array<Datatype> {
    let datatypesElm = parseXml(xmlString, 'datatypes')
    let datatypes = Array.from(
        datatypesElm.getElementsByTagName('datatype')
    ).map((datatypeElm) => {
        let datatype = datatypeElementToJson(datatypeElm)
        return datatype
    })
    return datatypes
}

function datatypeElementToJson(datatypeElm): Datatype {
    let datatypeData = {
        href: datatypeElm.getAttribute('href'),
        id: datatypeElm.getAttribute('id'),
    }
    return datatypeData
}

export { datatypesXmlToJson, datatypeElementToJson }
