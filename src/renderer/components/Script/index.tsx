import { useQuery } from '@tanstack/react-query'
import { scriptXmlToJson } from 'renderer/pipelineXmlToJson'
import { JobRequest } from 'shared/types/pipeline'

export function Script({ scriptHref }) {
  const { isLoading, error, data } = useQuery([scriptHref], async () => {
    let res = await fetch(scriptHref)
    let xmlStr = await res.text()
    console.log(xmlStr)
    return xmlStr
  })

  if (isLoading) return <p>Loading...</p>

  if (error instanceof Error)
    return <p>An error has occurred: {error.message}</p>

  let script = scriptXmlToJson(data)
  if (!script) {
    return <p>An error has occurred</p>
  }

  // submit a job
  let handleOnSubmit = (e) => {
    let jobRequest: JobRequest = {
      scriptHref: script.href,
      nicename: script.nicename,
    }
    let inputs = document.getElementsByTagName('input')
    Array.from(inputs).map((input) => {
      if (input.getAttribute('data-kind') == 'input') {
        if (!jobRequest.inputs) {
          jobRequest.inputs = []
        }
        jobRequest.inputs.push({ name: input.id, value: input.value })
      }
      if (input.getAttribute('data-kind') == 'option') {
        if (!jobRequest.options) {
          jobRequest.options = []
        }
        jobRequest.options.push({ name: input.id, value: input.value })
      }
    })
    console.log('REQUEST', jobRequest)
  }

  // keep it simple for now by only showing required inputs and options
  let requiredInputs = script.inputs
    .filter((input) => input.required)
    // inputs are always files
    .map((input) => ({ ...input, type: 'anyFileURI', kind: 'input' }))

  let requiredOptions = script.options
    .filter((option) => option.required)
    .map((option) => ({ ...option, kind: 'option' }))
  let allRequired = [...requiredInputs, ...requiredOptions]
  return (
    <>
      <h2>{script.nicename}</h2>
      {allRequired.map((item, idx) => (
        <FormField item={item} key={idx} />
      ))}
      <input
        id="run-script"
        type="submit"
        onClick={(e) => handleOnSubmit(e)}
        value="Run script"
      ></input>
    </>
  )
}

// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal
// item.mediaType is a file type e.g. application/x-dtbook+xml
function FormField({ item }) {
  let inputType = 'text'

  if (item.type == 'anyFileURI') {
    inputType = 'file'
  } else if (item.type == 'anyDirURI') {
    // not sure what to do with this
    inputType = 'file'
  } else if (item.type == 'xsd:dateTime') {
    inputType = 'datetime-local'
  } else if (item.type == 'xsd:boolean') {
    inputType = 'checkbox'
  } else if (item.type == 'xsd:string') {
    inputType = 'text'
  }
  // catch-all for
  // item.type == xsd:integer, xsd:float, xsd:double, xsd:decimal
  // we can fine tune this later
  else {
    inputType = 'number'
  }

  return (
    <div>
      <label htmlFor={item.name}>{item.nicename}</label>
      <input
        type={inputType}
        id={item.name}
        required={item.required}
        data-kind={item.kind}
      ></input>
      <p>{item.desc}</p>
    </div>
  )
}
