// create a form element for the item
// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal

import { ScriptItemBase, TypeChoice } from 'shared/types'
import { formFieldFactory } from './formFieldFactory'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { externalLinkClick, valueIsNotEmpty } from 'renderer/utils'
import { useWindowStore } from 'renderer/store'
import { CustomFieldDocumentation } from './CustomFieldDocumentation'
import { findInputType } from 'shared/utils'
const { App } = window

// item.mediaType is a file type e.g. application/x-dtbook+xml
export function FormField({
    item,
    idprefix,
    onChange,
    initialValue,
    error,
}: {
    item: ScriptItemBase
    idprefix: string
    onChange: (value: any, item: ScriptItemBase) => void // function to set the value in a parent-level collection.
    initialValue: any // the initial value for the field
    error?: string // error message to display
}) {
    const { pipeline } = useWindowStore()
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
    if (error) {
        console.log("Form field", error)
    }

    return (
        <div className="field">
            {item.desc ? (
                <details>
                    <summary>
                        <label htmlFor={idprefix}>
                            {item.nicename ?? item.name}
                        </label>
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
                <label htmlFor={idprefix}>
                    {item.nicename != ''
                        ? item.nicename
                        : item.name.charAt(0).toUpperCase() +
                          item.name.slice(1)}
                </label>
            )}
            {control}
            {valueIsNotEmpty(error) && (
                <span
                    id={idprefix + '-error'}
                    className="field-errors"
                    aria-live="polite"
                >
                    {error}
                </span>
            )}
        </div>
    )
}
