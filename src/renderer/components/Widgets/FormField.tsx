// create a form element for the item
// item.type can be:
// anyFileURI, anyDirURI, xsd:string, xsd:dateTime, xsd:boolean, xsd:integer, xsd:float, xsd:double, xsd:decimal

import { ScriptItemBase } from 'shared/types'
import { formFieldFactory } from './formFieldFactory'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { externalLinkClick, findInputType } from 'renderer/utils'
const { App } = window

// item.mediaType is a file type e.g. application/x-dtbook+xml
export function FormField({
    item,
    idprefix,
    onChange,
    initialValue,
    error = undefined,
}: {
    item: ScriptItemBase
    idprefix: string
    onChange: (value: any, item: ScriptItemBase) => void // function to set the value in a parent-level collection.
    initialValue: any // the initial value for the field
    error?: string // error message to display
}) {
    // create the widget for this item (checkbox, file picker, etc)
    let control = formFieldFactory(
        item,
        idprefix,
        onChange,
        initialValue,
        error
    )

    return (
        <div className="field">
            {item.desc ? (
                <details>
                    <summary>
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
            {error && (
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
