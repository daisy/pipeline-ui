import { scriptElementToJson } from './scriptToJson'
import { Script } from 'shared/types/pipeline'

function scriptsXmlToJson(xmlString: string): Array<Script> {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let scripts = Array.from(doc.getElementsByTagName('script')).map(
    (scriptElm) => {
      return scriptElementToJson(scriptElm)
    }
  )
  return scripts
}

export { scriptsXmlToJson }
