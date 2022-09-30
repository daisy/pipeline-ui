import { Script, ScriptInput, ScriptOption } from 'shared/types/pipeline'
import { parseXml } from './parser'

function scriptXmlToJson(xmlString: string): Script {
  let scriptElm = parseXml(xmlString, 'script')
  return scriptElementToJson(scriptElm)
}

function scriptElementToJson(scriptElm: Element): Script {
  let nicenameElm = scriptElm.getElementsByTagName('nicename')
  let descriptionElm = scriptElm.getElementsByTagName('description')
  let versionElm = scriptElm.getElementsByTagName('version')

  let script: Script = {
    id: scriptElm.getAttribute('id'),
    href: scriptElm.getAttribute('href'),
    nicename: (nicenameElm[0] as Element).textContent,
    description: (descriptionElm[0] as Element).textContent,
    version: (versionElm[0] as Element).textContent,
  }

  script.inputs = Array.from(scriptElm.getElementsByTagName('input')).map(
    (inputElm): ScriptInput => {
      return {
        desc: inputElm.getAttribute('desc'),
        mediaType: inputElm.getAttribute('mediaType'),
        name: inputElm.getAttribute('name'),
        sequence: inputElm.getAttribute('sequence') == 'true',
        required: inputElm.getAttribute('required') == 'true',
        nicename: inputElm.getAttribute('nicename'),
      }
    }
  )

  script.options = Array.from(scriptElm.getElementsByTagName('option')).map(
    (optionElm): ScriptOption => {
      return {
        desc: optionElm.getAttribute('desc'),
        mediaType: optionElm.getAttribute('mediaType'),
        name: optionElm.getAttribute('name'),
        sequence: optionElm.getAttribute('sequence') == 'true',
        required: optionElm.getAttribute('required') == 'true',
        nicename: optionElm.getAttribute('nicename'),
        ordered: optionElm.getAttribute('ordered') == 'true',
        type: optionElm.getAttribute('type'),
      }
    }
  )

  return script
}

export { scriptXmlToJson, scriptElementToJson }