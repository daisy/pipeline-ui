import { Datatype, DatatypeChoice, ValueChoice, TypeChoice } from 'shared/types'
import { parseXml, sniffRoot } from './parser'

/*
returns: 

{
    datas [
        {
            type
            documentation
            param
        }
    ]
    values [
        {
            value
            documentation
        }
    ]
}

supported inputs:
    
    <choice> 
        <value>
        <documentation>
        <data type="anyFileURI | anyURI">
            <documentation>
        </data>
        ...
    </choice>
    
    OR 

    <data type="string">
        <documentation>
        <param>
    </data>
    
*/

function datatypeXmlToJson(href, id, xmlString): Datatype {
    let root = sniffRoot(xmlString)
    let datatype = { id, href }
    if (root == 'choice') {
        let choiceElm = parseXml(xmlString, 'choice')
        return { ...datatype, choices: choiceElementToJson(choiceElm) }
    } else if (root == 'data') {
        let dataElm = parseXml(xmlString, 'data')
        return { ...datatype, choices: [dataElementToJson(dataElm)] }
    } else {
        return null
    }
}

function choiceElementToJson(choiceElm: Element): DatatypeChoice[] {
    //@ts-ignore
    let children = Array.from(choiceElm.childNodes).filter(
        (n) => n.nodeType == n.ELEMENT_NODE
    )
    let choices = []
    for (let i = 0; i < children.length; i++) {
        let c = children[i]
        //@ts-ignore
        if (c.tagName == 'data') {
            choices.push(dataElementToJson(c))
            //@ts-ignore
        } else if (c.tagName == 'value') {
            //@ts-ignore
            let value = c.textContent?.trim()
            let documentation = ''
            // look ahead for a sibling 'documentation' element
            if (i + 1 < children.length) {
                if (
                    //@ts-ignore
                    children[i + 1].tagName == 'documentation' ||
                    //@ts-ignore
                    children[i + 1].tagName == 'a:documentation'
                ) {
                    //@ts-ignore
                    documentation = children[++i].textContent.trim()
                }
            }
            let valueChoice: ValueChoice = { value, documentation }
            choices.push(valueChoice)
        }
    }
    return choices
}

function dataElementToJson(dataElm): TypeChoice {
    let documentationElms = dataElm.getElementsByTagName('documentation')
    let paramElms = dataElm.getElementsByTagName('param')
    let retval: TypeChoice = {
        type: dataElm.getAttribute('type'),
    }
    if (documentationElms.length > 0) {
        retval.documentation = documentationElms[0].textContent.trim()
    }
    if (
        paramElms.length > 0 &&
        paramElms[0].hasAttribute('name') &&
        paramElms[0].getAttribute('name') == 'pattern'
    ) {
        retval.pattern = paramElms[0].textContent.trim()
    }
    return retval
}
export { datatypeXmlToJson, dataElementToJson, choiceElementToJson }
