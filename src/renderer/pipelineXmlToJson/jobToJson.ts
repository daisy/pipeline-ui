import {
  Job,
  NamedResult,
  Results,
  ResultFile,
  Priority,
  Status,
  MessageLevel,
} from 'shared/types/pipeline'
import { scriptElementToJson } from './scriptToJson'

function jobXmlToJson(xmlString: string): Job {
  console.log(xmlString)
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let jobElms = doc.getElementsByTagName('job')
  if (jobElms.length > 0) {
    return jobElementToJson(jobElms[0])
  } else {
    throw new Error('Could not parse job XML')
  }
}

function jobElementToJson(jobElm: Element): Job {
  let job: Job = {
    id: jobElm.getAttribute('id'),
    href: jobElm.getAttribute('href'),
    priority:
      Priority[jobElm.getAttribute('priority') as keyof typeof Priority],
    status: Status[jobElm.getAttribute('status') as keyof typeof Status],
  }
  let logElm = jobElm.getElementsByTagName('log')
  if (logElm) {
    job.log = logElm[0].getAttribute('href')
  }
  let resultsElm = jobElm.getElementsByTagName('results')
  if (resultsElm) {
    let results: Results = {
      href: resultsElm[0].getAttribute('href'),
      mimeType: resultsElm[0].getAttribute('mime-type'),
      namedResults: [],
    }
    results.namedResults = Array.from(
      resultsElm[0].getElementsByTagName('result')
    )
      // filter out non-direct children
      .filter((resultElm) => resultElm.parentElement == resultsElm[0])
      .map((resultElm): NamedResult => {
        let namedResult: NamedResult = {
          from: resultElm.getAttribute('from'),
          href: resultElm.getAttribute('href'),
          mimeType: resultElm.getAttribute('mime-type'),
          name: resultElm.getAttribute('name'),
          nicename: resultElm.getAttribute('nicename'),
          files: [],
        }
        // the results are structured so that a "result" element is nested inside another "result" element
        // and they have different attributes
        // @ts-ignore
        namedResult.files = Array.from(
          resultElm.getElementsByTagName('result')
        ).map((resultFileElm) => {
          let resultFile: ResultFile = {
            mimeType: resultFileElm.getAttribute('mime-type'),
            size: resultFileElm.getAttribute('size'),
          }
          if (resultFileElm.hasAttribute('file')) {
            // @ts-ignore
            resultFile.file = resultFileElm.getAttribute('file')
          }
          if (resultFileElm.hasAttribute('href')) {
            // @ts-ignore
            resultFile.href = resultFileElm.getAttribute('href')
          }
          return resultFile
        })
        return namedResult
      })
    job.results = results
  }
  let messagesElms = jobElm.getElementsByTagName('messages')
  if (messagesElms.length > 0) {
    job.messages = Array.from(
      messagesElms[0].getElementsByTagName('message')
    ).map((messageElm) => {
      return {
        level:
          MessageLevel[
            messageElm.getAttribute('level') as keyof typeof MessageLevel
          ],
        content: messageElm.getAttribute('content'),
        sequence: parseInt(messageElm.getAttribute('sequence')),
        timestamp: parseInt(messageElm.getAttribute('timestamp')),
      }
    })
    job.progress = parseInt(messagesElms[0].getAttribute('progress'))
  }
  let scriptElms = jobElm.getElementsByTagName('script')
  if (scriptElms.length > 0) {
    job.script = scriptElementToJson(scriptElms[0])
  }
  return job
}

export { jobXmlToJson, jobElementToJson }
