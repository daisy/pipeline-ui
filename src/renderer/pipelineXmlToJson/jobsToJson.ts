import { jobElementToJson } from './jobToJson'

function jobsXmlToJson(xmlString: string) {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let jobs = Array.from(doc.getElementsByTagName('job')).map((jobElm) => {
    let job = jobElementToJson(jobElm)
    return job
  })

  console.log(jobs)
  return jobs
}

export { jobsXmlToJson }
