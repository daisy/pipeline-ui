import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { Blob, FormData } from 'node-fetch'
import { zipSync, type Zippable } from 'fflate'
import { jobRequestToXml } from 'shared/parser/pipelineXmlConverter'
import type { Job, NameValue } from 'shared/types'

const localUriTypes = new Set(['anyURI', 'anyFileURI', 'anyDirURI'])

function isHttpUrl(value: string) {
    return /^https?:\/\//i.test(value)
}

function hasNonFileUrlScheme(value: string) {
    if (/^[a-zA-Z]:[\\/]/.test(value)) return false
    return /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(value)
}

function localPathFromUriValue(value: string) {
    const trimmed = value.trim()
    if (trimmed.length === 0 || isHttpUrl(trimmed)) return null
    if (trimmed.startsWith('file:')) return fileURLToPath(trimmed)
    if (hasNonFileUrlScheme(trimmed)) return null
    return trimmed
}

function sanitizeZipSegment(segment: string, fallback: string) {
    const sanitized = segment
        .replace(/[<>:"\\|?*\x00-\x1f&]/g, '_')
        .replace(/\.\./g, '_')
        .replace(/^\/+|\/+$/g, '')
        .trim()

    return sanitized.length > 0 ? sanitized : fallback
}

function zipPath(...segments: string[]) {
    return segments
        .filter((segment) => segment.length > 0)
        .map((segment, index) => sanitizeZipSegment(segment, `item-${index}`))
        .join('/')
}

async function addFileToZip(
    entries: Zippable,
    sourcePath: string,
    targetPath: string
) {
    entries[targetPath] = await fs.readFile(sourcePath)
}

async function addDirectoryToZip(
    entries: Zippable,
    sourcePath: string,
    targetRoot: string
) {
    const children = await fs.readdir(sourcePath, { withFileTypes: true })

    for (const child of children) {
        const childSourcePath = path.join(sourcePath, child.name)
        const childTargetPath = `${targetRoot}/${sanitizeZipSegment(
            child.name,
            'item'
        )}`

        if (child.isDirectory()) {
            await addDirectoryToZip(entries, childSourcePath, childTargetPath)
        } else if (child.isFile()) {
            await addFileToZip(entries, childSourcePath, childTargetPath)
        }
    }
}

function mappingKey(item: NameValue, value: string) {
    return `${item.name}\0${item.type}\0${value.trim()}`
}

async function addLocalValueToZip(
    entries: Zippable,
    pathMappings: Map<string, string>,
    localPathMappings: Map<string, string>,
    item: NameValue,
    section: 'inputs' | 'options',
    itemIndex: number,
    valueIndex: number,
    value: string
) {
    const localPath = localPathFromUriValue(value)
    if (!localPath) return

    const sourcePath = path.resolve(localPath)
    const sourceStats = await fs.stat(sourcePath)
    const existingTargetPath = localPathMappings.get(sourcePath)
    const key = mappingKey(item, value)

    if (existingTargetPath) {
        pathMappings.set(key, existingTargetPath)
        return
    }

    const itemRoot = zipPath(section, item.name, itemIndex.toString())
    const sourceName = sanitizeZipSegment(
        path.basename(sourcePath),
        sourceStats.isDirectory() ? 'directory' : 'file'
    )
    const targetPath = `${itemRoot}/${valueIndex}-${sourceName}`

    if (sourceStats.isDirectory()) {
        await addDirectoryToZip(entries, sourcePath, targetPath)
    } else if (sourceStats.isFile()) {
        await addFileToZip(entries, sourcePath, targetPath)
    } else {
        throw new Error(`${sourcePath} is not a file or directory.`)
    }

    localPathMappings.set(sourcePath, targetPath)
    pathMappings.set(key, targetPath)
}

async function addItemValuesToZip(
    entries: Zippable,
    pathMappings: Map<string, string>,
    localPathMappings: Map<string, string>,
    item: NameValue,
    section: 'inputs' | 'options',
    itemIndex: number
) {
    if (!localUriTypes.has(item.type) || item.value == null) return

    const values = Array.isArray(item.value) ? item.value : [item.value]
    for (const [valueIndex, rawValue] of values.entries()) {
        await addLocalValueToZip(
            entries,
            pathMappings,
            localPathMappings,
            item,
            section,
            itemIndex,
            valueIndex,
            rawValue.toString()
        )
    }
}

export async function buildExternalJobRequestBody(job: Job) {
    const entries: Zippable = {}
    const pathMappings = new Map<string, string>()
    const localPathMappings = new Map<string, string>()

    for (const [index, input] of (job.jobRequest.inputs ?? []).entries()) {
        await addItemValuesToZip(
            entries,
            pathMappings,
            localPathMappings,
            input,
            'inputs',
            index
        )
    }

    for (const [index, option] of (job.jobRequest.options ?? []).entries()) {
        await addItemValuesToZip(
            entries,
            pathMappings,
            localPathMappings,
            option,
            'options',
            index
        )
    }

    if (Object.keys(entries).length === 0) return null

    const jobRequestXml = jobRequestToXml(
        {
            ...job.jobRequest,
            nicename: job.jobRequest.nicename || job.jobData?.nicename || 'Job',
        },
        {
            pathMapper: (value, item) =>
                pathMappings.get(mappingKey(item, value)),
        }
    )
    const zippedData = zipSync(entries)
    const zippedDataBuffer = zippedData.buffer.slice(
        zippedData.byteOffset,
        zippedData.byteOffset + zippedData.byteLength
    ) as ArrayBuffer
    const body = new FormData()

    body.append(
        'job-request',
        new Blob([jobRequestXml], { type: 'application/xml' }),
        'job-request.xml'
    )
    body.append(
        'job-data',
        new Blob([zippedDataBuffer], { type: 'application/zip' }),
        'job-data.zip'
    )

    return body
}
