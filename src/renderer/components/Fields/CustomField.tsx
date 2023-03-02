import { useWindowStore } from 'renderer/store'
import { CustomFieldDocumentation } from './CustomFieldDocumentation'
import { Datatype } from 'shared/types'
import { useState } from 'react'

export function CustomField({ item, onChange, initialValue, controlId }) {
    const { pipeline } = useWindowStore()
    const [initial, setInitial] = useState(true) // false if the user started typing

    // find the datatype in the pipeline.datatypes store
    let datatype = pipeline.datatypes.find((dt) => dt.id == item.type)

    if (datatype) {
        // if there are value choices, make a dropdown select
        let valueChoices = datatype.choices.filter((item) =>
            item.hasOwnProperty('value')
        )
        let typeChoices = datatype.choices.filter(
            (item) => !item.hasOwnProperty('value')
        )

        // if different datatypes are supported
        if (typeChoices.length) {
            return makeCustomDatatypeInput(
                typeChoices,
                item,
                onChange,
                initialValue,
                controlId,
                datatype
            )
        } else {
            // if our choices are just a list of string values
            if (valueChoices.length) {
                return makeSelect(
                    valueChoices,
                    onChange,
                    initialValue,
                    controlId
                )
            }
        }
    }

    let onChangeValue = (e) => {
        setInitial(false)
        onChange(e)
    }

    // catch-all return value
    return (
        <>
            <input
                type="text"
                required={item.required}
                // @ts-ignore
                value={initialValue ?? null}
                id={controlId}
                onChange={onChangeValue}
                pattern={item.pattern ?? null}
                className={initial ? 'initial' : null}
            ></input>
            <span className="field-errors" aria-live="polite"></span>
        </>
    )
}

function makeCustomDatatypeInput(
    options,
    item,
    onChange,
    initialValue,
    controlId,
    datatype: Datatype
) {

    const [initial, setInitial] = useState(true)

    let onChangeValue = (e) => {
        setInitial(false)
        onChange(e)
    }
    return (
        <div className="customDatatypeField">
            <CustomFieldDocumentation datatypes={options} />

            <input
                type="text"
                required={item.required}
                // @ts-ignore
                value={initialValue ?? ''}
                id={controlId}
                onChange={onChangeValue}
                className={initial ? 'initial' : null}
                pattern={
                    datatype.choices.length == 1
                        ? // @ts-ignore
                          datatype.choices[0]?.pattern ?? ''
                        : ''
                }
            ></input>
            <span className="field-errors" aria-live="polite"></span>
        </div>
    )
}

function makeSelect(options, onChange, initialValue, controlId) {
    return (
        <select id={controlId} onChange={onChange} value={initialValue ?? ''}>
            {options.map((option, idx) => {
                let displayString = option.documentation ?? option.value
                // documentation strings can be split into short and long descriptions, one per line
                if (displayString.split('\n').length > 1) {
                    displayString = displayString.split('\n')[0]
                }
                return (
                    <option key={idx} value={option.value}>
                        {option.documentation
                            ? option.documentation.split('\n')[0]
                            : option.value}
                    </option>
                )
            })}
        </select>
    )
}
