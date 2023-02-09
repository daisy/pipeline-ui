import { Job, JobData } from 'shared/types'
import { jobElementToJson } from './jobToJson'
import { parseXml } from './parser'

function jobsXmlToJson(xmlString: string): Array<JobData> {
    let jobsElm = parseXml(xmlString, 'jobs')
    let jobs: Array<JobData> = Array.from(
        jobsElm.getElementsByTagName('job')
    ).map((jobElm: Element) => {
        let job: JobData = jobElementToJson(jobElm)
        return job
    })
    return jobs
}

export { jobsXmlToJson }
