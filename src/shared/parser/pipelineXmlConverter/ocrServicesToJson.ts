import { OcrServiceState } from 'shared/types'
import { parseXml } from './parser'

/**
 * Parse the /ocr/services response into display-ready states:
 *
 *   <ocr-services>
 *     <ocr-service name="mistral" nicename="Mistral OCR"
 *                  status="available|disabled|error" message="..."/>
 *   </ocr-services>
 *
 * The engine reports "disabled" both when the service is switched off
 * (no API key, or `.enabled=false`) and when it could not reach the
 * service. Only the first case means "disconnected"; the second is an
 * error the user should see.
 *
 * Returns null if the response isn't an <ocr-services> document, e.g. an
 * engine that predates the endpoint.
 */
function ocrServicesToJson(
    xmlString: string
): { [key: string]: OcrServiceState } | null {
    let servicesElm
    try {
        servicesElm = parseXml(xmlString, 'ocr-services')
    } catch (err) {
        return null
    }
    if (!servicesElm) return null
    const states: { [key: string]: OcrServiceState } = {}
    for (const elm of Array.from(
        servicesElm.getElementsByTagName('ocr-service')
    ) as Element[]) {
        const key = elm.getAttribute('name')
        if (!key) continue
        states[key] = normalizeOcrServiceState(
            elm.getAttribute('status') ?? '',
            elm.getAttribute('message') ?? '',
            elm.getAttribute('nicename') || key
        )
    }
    return states
}

function normalizeOcrServiceState(
    status: string,
    message: string,
    name: string
): OcrServiceState {
    if (status == 'available') {
        return { status: 'available', message: 'Connected', name }
    }
    const switchedOff =
        status == 'disabled' &&
        (message == '' ||
            message.startsWith('Property not set') ||
            // "set property 'org.daisy.pipeline.ocr.x.enabled' to 'true'"
            message.includes('.enabled'))
    if (switchedOff) {
        return { status: 'disconnected', message: 'Disconnected', name }
    }
    return {
        status: 'error',
        message: message || 'Could not connect to the service',
        name,
    }
}

export { ocrServicesToJson, normalizeOcrServiceState }
