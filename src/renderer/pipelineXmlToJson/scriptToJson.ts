import { Script, ScriptInput, ScriptOption } from 'shared/types/pipeline'

function scriptXmlToJson(xmlString: string): Script {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let scriptElms = doc.getElementsByTagName('script')
  if (scriptElms.length > 0) {
    return scriptElementToJson(scriptElms[0])
  } else {
    throw new Error('Could not parse script XML')
  }
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
        desc: inputElm.getAttribute('input'),
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
        desc: optionElm.getAttribute('input'),
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
