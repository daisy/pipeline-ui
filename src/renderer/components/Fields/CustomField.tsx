import { useWindowStore } from 'renderer/store'
import { CustomFieldDocumentation } from './CustomFieldDocumentation'
import { Datatype } from 'shared/types'
import { useState } from 'react'
import { ControlledInput } from './ControlledInput'

export function CustomField({ item, onChange, initialValue, controlId }) {
    const { pipeline } = useWindowStore()
    const [value, setValue] = useState(initialValue)
    const [userInteracted, setUserInteracted] = useState(false) // false if the user started typing

    // find the datatype in the pipeline.datatypes store
    let datatype = pipeline.datatypes.find((dt) => dt.id == item.type)

    let onChangeValue = (newValue) => {
        setUserInteracted(true)
        setValue(newValue)
        onChange(newValue)
    }

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
            return (
                <div className="custom-field">
                    <CustomFieldDocumentation datatypes={typeChoices} />
                    <ControlledInput
                        type="text"
                        required={item.required}
                        // @ts-ignore
                        value={value ?? ''}
                        id={controlId}
                        onChange={(e) => onChangeValue(e)}
                        className={userInteracted ? 'interacted' : null}
                        pattern={
                            datatype.choices.length == 1
                                ? // @ts-ignore
                                  datatype.choices[0]?.pattern ?? ''
                                : ''
                        }
                    ></ControlledInput>
                    <span className="field-errors" aria-live="polite"></span>
                </div>
            )
        } else {
            // if our choices are just a list of string values
            if (valueChoices.length) {
                return (
                    <select
                        id={controlId}
                        onChange={(e) => onChangeValue(e.target.value)}
                        value={value ?? ''}
                    >
                        {valueChoices.map((option, idx) => {
                            let displayString =
                                // @ts-ignore
                                option.documentation ?? option.value
                            // documentation strings can be split into short and long descriptions, one per line
                            if (displayString.split('\n').length > 1) {
                                displayString = displayString.split('\n')[0]
                            }
                            return (
                                // @ts-ignore
                                <option key={idx} value={option.value}>
                                    {option.documentation
                                        ? option.documentation.split('\n')[0]
                                        : // @ts-ignore : option.value}
                                          option.value}
                                </option>
                            )
                        })}
                    </select>
                )
            }
        }
    }

    // catch-all return value
    return (
        <>
            <ControlledInput
                type="text"
                required={item.required}
                // @ts-ignore
                value={value ?? null}
                id={controlId}
                onChange={(e) => onChangeValue(e)}
                className={userInteracted ? 'interacted' : null}
                pattern={item.pattern ?? null}
            ></ControlledInput>
            <span className="field-errors" aria-live="polite"></span>
        </>
    )
}
