import { EngineProperty } from 'shared/types'

/**
 * Convert an EngineProperty to a proper xml string that can be used to update
 * a property on the engine.
 * @param {EngineProperty} prop the property to update
 * @returns {string} an xml string that can be sent to a DP2 1.14.17+ engine for property
 * update
 */
function propertyToXml(prop: EngineProperty): string {
    return `<property xmlns="http://www.daisy.org/ns/pipeline/data" name="${
        prop.name
    }" value="${prop.value == null ? '' : prop.value}"/>`
}

export { propertyToXml }
