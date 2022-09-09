function jobXmlToJson(xmlString: string) {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')
  let jobElms = doc.getElementsByTagName('job')
  if (jobElms.length > 0) {
    return jobElementToJson(jobElms[0])
  } else {
    throw new Error('Could not parse job XML')
  }
}

function jobElementToJson(jobElm: Element) {
  let job = {
    id: jobElm.getAttribute('id'),
    href: jobElm.getAttribute('href'),
    priority: jobElm.getAttribute('priority'),
    status: jobElm.getAttribute('status'),
  }
  let logElm = jobElm.getElementsByTagName('log')
  if (logElm) {
    // @ts-ignore
    job.log = { href: logElm[0].getAttribute('href') }
  }
  let resultsElm = jobElm.getElementsByTagName('results')
  if (resultsElm) {
    let results = {
      href: resultsElm[0].getAttribute('href'),
      mimeType: resultsElm[0].getAttribute('mime-type'),
    }
    // @ts-ignore
    results.namedResults = Array.from(
      resultsElm[0].getElementsByTagName('result')
    )
      // filter out non-direct children
      .filter((resultElm) => resultElm.parentElement == resultsElm[0])
      .map((resultElm) => {
        let result = {
          from: resultElm.getAttribute('from'),
          href: resultElm.getAttribute('href'),
          mimeType: resultElm.getAttribute('mime-type'),
          name: resultElm.getAttribute('name'),
          nicename: resultElm.getAttribute('nicename'),
        }
        // the results are structured so that a "result" element is nested inside another "result" element
        // and they have different attributes
        // @ts-ignore
        result.files = Array.from(resultElm.getElementsByTagName('result')).map(
          (resultFileElm) => {
            let resultFile = {
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
          }
        )
        return result
      })
    return results
  }
  let messageElms = jobElm.getElementsByTagName('messages')
  if (messageElms.length > 0) {
    //@ts-ignore
    job.messages = Array.from(
      messageElms[0].getElementsByTagName('message')
    ).map((messageElm) => {
      return {
        level: messageElm.getAttribute('level'),
        content: messageElm.getAttribute('content'),
        sequence: messageElm.getAttribute('sequence'),
        timestamp: messageElm.getAttribute('timestamp'),
      }
    })
    //@ts-ignore
    job.progress = messages.getAttribute('progress')
  }
  return job
}

export { jobXmlToJson, jobElementToJson }
