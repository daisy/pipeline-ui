import { Job } from 'shared/types/pipeline'
import { jobElementToJson } from './jobToJson'

function jobsXmlToJson(xmlString: string): Array<Job> {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let jobs = Array.from(doc.getElementsByTagName('job')).map((jobElm) => {
    let job = jobElementToJson(jobElm)
    return job
  })
  return jobs
}

export { jobsXmlToJson }
