import { jobXmlToJson } from 'shared/parser/pipelineXmlConverter'

export type JobDataUpdate = ReturnType<typeof jobXmlToJson>
export type JobMessages = JobDataUpdate['messages']

// Keep progress values usable even if the engine sends odd numbers.
const normalizeProgress = (progress: number | undefined) => {
    if (!Number.isFinite(progress)) return undefined
    return Math.min(Math.max(progress, 0), 1)
}

// Normalize the fields we accept from either REST or websocket XML.
export function normalizeJobData(jobData: JobDataUpdate): JobDataUpdate
export function normalizeJobData(
    jobData: Partial<JobDataUpdate>
): Partial<JobDataUpdate>
export function normalizeJobData(jobData: Partial<JobDataUpdate>) {
    const progress = normalizeProgress(jobData.progress)
    if (progress === jobData.progress) return jobData
    const jobDataWithoutProgress = { ...jobData }
    delete jobDataWithoutProgress.progress
    return {
        ...jobDataWithoutProgress,
        ...(progress === undefined ? {} : { progress }),
    }
}

const decodeXmlAttribute = (value: string | undefined) =>
    value
        ?.replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')

const readXmlAttribute = (tag: string | undefined, name: string) => {
    const value = tag?.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1]
    return decodeXmlAttribute(value)
}

export const jobSummaryXmlToJson = (
    xml: string | { toString(): string }
): Partial<JobDataUpdate> => {
    const xmlString = xml.toString()
    // Intentionally read only opening tags. A full DOM parse or jobXmlToJson()
    // would materialize the potentially huge nested message tree.
    const jobTag = xmlString.match(/<job\b[^>]*>/)?.[0]
    const messagesTag = xmlString.match(/<messages\b[^>]*>/)?.[0]
    const logTag = xmlString.match(/<log\b[^>]*>/)?.[0]
    const jobId = readXmlAttribute(jobTag, 'id')
    const href = readXmlAttribute(jobTag, 'href')
    const status = readXmlAttribute(jobTag, 'status')
    const notificationsUrl = readXmlAttribute(jobTag, 'notifications')
    const log = readXmlAttribute(logTag, 'href')
    const progress = normalizeProgress(
        Number.parseFloat(readXmlAttribute(messagesTag, 'progress'))
    )

    return normalizeJobData({
        ...(jobId ? { jobId } : {}),
        ...(href ? { href } : {}),
        ...(status ? { status: status as JobDataUpdate['status'] } : {}),
        ...(notificationsUrl ? { notificationsUrl } : {}),
        ...(log ? { log } : {}),
        ...(progress === undefined ? {} : { progress }),
    })
}

// Keep terminal fetches useful for result/log download while avoiding recursive
// message parsing in jobXmlToJson().
const stripMessagesXml = (xml: string) =>
    xml
        .replace(/<messages\b[\s\S]*?<\/messages>/g, '')
        .replace(/<messages\b[^>]*\/>/g, '')

export const jobXmlWithoutMessagesToJson = (xml: string): JobDataUpdate =>
    jobXmlToJson(stripMessagesXml(xml))
