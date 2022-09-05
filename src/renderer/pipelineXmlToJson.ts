// WIP 

function pipelineXmlToJson(xmlString) {
  let doc = new DOMParser().parseFromString(xmlString, 'text/xml')

  let rootNodeName = doc.getRootNode().nodeName
  if (rootNodeName == 'jobs') {
    return pipelineJobsXmlToJson(doc)
  } else if (rootNodeName == 'job') {
  } else if (rootNodeName == 'scripts') {
  } else if (rootNodeName == 'script') {
  }

  return {}
}
// TODO: Jobs, Job, Scripts, Script
function pipelineJobsXmlToJson(jobsXmlElement) {
  let jobXmlElements = jobsXmlElement.get
  let jobsAsJson = Array.from(jobsXmlElement).map((job) => {
    let jobAsJson = {
      //@ts-ignore
      href: job.getAttribute('href'),
      //@ts-ignore
      id: job.getAttribute('id'),
      //@ts-ignore
      priority: job.getAttribute('priority'),
      //@ts-ignore
      status: job.getAttribute('status'),
    }
  })

  return jobsAsJson
}

export { pipelineXmlToJson }
