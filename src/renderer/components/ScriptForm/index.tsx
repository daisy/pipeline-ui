import { useQuery, useMutation } from '@tanstack/react-query'
import { scriptXmlToJson, jobRequestToXml } from 'renderer/pipelineXmlConverter'
import { JobRequest } from 'shared/types/pipeline'
import styles from './styles.module.sass'

const { App } = window // The "App" comes from the bridge

export function ScriptForm({ scriptHref }) {
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
  let handleOnSubmit = async (e) => {
    let jobRequest: JobRequest = {
      scriptHref: script.href,
      nicename: script.nicename,
      inputs: [],
      options: []
    }
    
    let scriptFormElm = e.target.parentElement.parentElement;
    if (!scriptFormElm) {
      console.log("Form error")
      return
    }
    let inputs = scriptFormElm.querySelectorAll('input')
    Array.from(inputs).map((input) => {
      let isFile = input.getAttribute('data-is-file') == 'true'
      if (input.getAttribute('data-kind') == 'input') {
        jobRequest.inputs.push({ name: input.id, value: input.value, isFile: false })
      }
      if (input.getAttribute('data-kind') == 'option') {
        jobRequest.options.push({ name: input.id, value: input.value, isFile: false })
      }
    })
    // get the inner span with the value of the selected file or folder
    let fileOrFoldersElms = scriptFormElm.querySelectorAll(".fileOrFolderField")
    Array.from(fileOrFoldersElms).map((elm) => {
      let name = elm.querySelector('button')?.id.replace('button-', '')
      let kind = elm.getAttribute('data-kind')
      let value = elm.querySelector('span')?.textContent ?? ''
      return { name, value, kind }
    }).map(data => {
      let arr = data.kind == 'input' ? jobRequest.inputs : jobRequest.options
      arr.push({ name: data.name, value: data.value, isFile: true})
    })
    let xmlStr = jobRequestToXml(jobRequest)
    
    console.log(xmlStr)

    // test that our XML parses
    // let doc = new DOMParser().parseFromString(xmlStr, 'text/xml')
    // console.log(doc.getElementsByTagName('jobRequest')[0].nodeName)

    const formData  = new FormData();
    formData.set('job-request', `${xmlStr}`);

    // Display the key/value pairs
for (var pair of formData.entries()) {
  console.log(pair[0]+ ', ' + pair[1]); 
}


    let res = await fetch('http://localhost:8181/ws/jobs', 
      { 
        method: 'POST',
        body: xmlStr,
        mode: 'no-cors'
      });
    console.log("MUT", res)
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
    <div className={styles.ScriptForm}>
      <h2>{script.nicename}</h2>
      {allRequired.map((item, idx) => (
        <FormField item={item} key={idx} />
      ))}
      <div className={styles.SubmitCancel}>
        <button>Cancel new job</button>
        <button
          id="run-script"
          type="submit"
          onClick={(e) => handleOnSubmit(e)}
        >Run</button>
      </div>
    </div>
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

  if (inputType == 'file') {
    return <FileOrFolderField item={item} />
  }
  else {
    return (<div>
        <label htmlFor={item.name}>{item.nicename}</label>
        <span className={styles.description}>{item.desc}</span>
        <input
          type={inputType}
          id={item.name}
          required={item.required}
          data-kind={item.kind}
        ></input>
      </div>)
  }
}

// we need a file or folder selector 
// we can't use HTML <input type="file" ...> because even with the folder option enabled by "webkitdirectory"
// it won't let users select an empty folder
// and we can't reuse <input type="file" ...> even as a control to trigger electron's native file picker
// because you can't set the value on the input field programmatically
// so this function provides a button to browse and a text display of the path
function FileOrFolderField({item}) {
  let handleInputClick = async (e, item) => {
    console.log(item)
    e.preventDefault()
    let filename = await App.showOpenFileDialog()
    e.target.nextElementSibling.textContent = filename  
  }
  // all items that make it to this function have type of 'anyFileURI' or 'anyDirURI'`
  return (<div className={styles.FileOrFolderField}>
      <label htmlFor={`button-${item.name}`}>{item.nicename}</label>
      <span className={styles.description}>{item.desc}</span>
      <div className="fileOrFolderField">
        <button 
          type="button"
          id={`button-${item.name}`}
          required={item.required}
          data-kind={item.kind}
          onClick={(e) => handleInputClick(e, item)}>Browse</button>
        <span tabIndex={0} id={`text-${item.name}`}></span>
      </div>
      
    </div>)
}