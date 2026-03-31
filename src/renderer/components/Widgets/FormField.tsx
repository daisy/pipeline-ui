// create a form element for the item
// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal

import { Script, ScriptItemBase, ScriptOption, TypeChoice } from 'shared/types'
import { formFieldFactory } from './formFieldFactory'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { externalLinkClick, valueIsNotEmpty } from 'renderer/utils'
import { useWindowStore } from 'renderer/store'
import { CustomFieldDocumentation } from './CustomFieldDocumentation'
import { findInputType, getStoredOptionValue } from 'shared/utils'

const { App } = window

// item.mediaType is a file type e.g. application/x-dtbook+xml
export function FormField({
    item,
    idprefix,
    onChange,
    initialValue,
    script,
    error,
}: {
    item: ScriptItemBase
    idprefix: string
    onChange: (value: any, item: ScriptItemBase) => void // function to set the value in a parent-level collection.
    initialValue: any // the initial value for the field
    script: Script
    error?: string // error message to display
}) {
    const { pipeline, settings } = useWindowStore()
    // create the widget for this item (checkbox, file picker, etc)
    let control = formFieldFactory(
        item,
        idprefix,
        onChange,
        initialValue,
        error
    )
    let typeChoices = []
    let datatype = pipeline.datatypes.find((dt) => dt.id == item.type) ?? null

    let isCustomFieldWithSpecialDocumentation =
        findInputType(item) == 'custom' &&
        datatype != null &&
        datatype.choices != null &&
        datatype.choices.filter((item) => !item.hasOwnProperty('value'))
            .length > 0

    if (isCustomFieldWithSpecialDocumentation) {
        typeChoices = datatype.choices.filter(
            (item) => !item.hasOwnProperty('value')
        )
    }

    let storedOptionValue = null
    if (item.kind == 'option') {
        storedOptionValue = getStoredOptionValue(
            script,
            item as ScriptOption,
            settings
        )
    }
    return (
        <div className="field">
            {item.desc ? (
                <details>
                    <summary id={`${idprefix}-label`}>
                        {item.nicename ?? item.name}
                    </summary>
                    <div className="description">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                a: (props) => {
                                    return (
                                        <a
                                            href={props.href}
                                            onClick={(e) => {
                                                externalLinkClick(e, App)
                                            }}
                                        >
                                            {props.children}
                                        </a>
                                    )
                                },
                            }}
                        >
                            {item.desc}
                        </Markdown>
                    </div>
                    {isCustomFieldWithSpecialDocumentation && (
                        <CustomFieldDocumentation datatypes={typeChoices} />
                    )}
                </details>
            ) : (
                <span id={`${idprefix}-label`}>
                    {item.nicename != ''
                        ? item.nicename
                        : item.name.charAt(0).toUpperCase() +
                          item.name.slice(1)}
                </span>
            )}
            {control}
            {storedOptionValue && (
                <span className="field-value-options">
                    Use the{' '}
                    <button
                        type="button"
                        onClick={(e) =>
                            onChange((item as ScriptOption).default, item)
                        }
                    >
                        default
                    </button>{' '}
                    value or the{' '}
                    <button
                        type="button"
                        onClick={(e) => onChange(storedOptionValue, item)}
                    >
                        last-used
                    </button>{' '}
                    value
                </span>
            )}
            {valueIsNotEmpty(error) && (
                <>
                    <span id={idprefix + '-error'} className="field-errors">
                        {error}
                    </span>
                </>
            )}
        </div>
    )
}
