import { useWindowStore } from 'renderer/store'
import { CustomFieldDocumentation } from './CustomFieldDocumentation'
import { Datatype, ScriptItemBase } from 'shared/types'
import { useEffect, useState } from 'react'
import { ControlledInput } from './ControlledInput'

export function CustomField({
    item,
    onChange,
    initialValue,
    controlId,
    error,
}: {
    item: ScriptItemBase
    onChange: (value: any) => void
    initialValue: any
    controlId: string
    error?: string
}) {
    const { pipeline } = useWindowStore()
    const [value, setValue] = useState(initialValue)
    const [userInteracted, setUserInteracted] = useState(false) // false if the user started typing

    useEffect(() => {
        const elem = document.getElementById(controlId) as HTMLInputElement
        if (elem) {
            elem.setCustomValidity(error ?? '')
        }
    }, [error])

    const errorProps = error
        ? {
              'aria-invalid': true,
              'aria-errormessage': controlId + '-error',
          }
        : {
              'aria-invalid': false,
          }

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
                        {...errorProps}
                    ></ControlledInput>
                    {error ? (
                        <span
                            id={controlId + '-error'}
                            className="field-errors"
                            aria-live="polite"
                        >
                            {error}
                        </span>
                    ) : (
                        ''
                    )}
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
                {...errorProps}
            ></ControlledInput>
            {error ? (
                <span
                    id={controlId + '-error'}
                    className="field-errors"
                    aria-live="polite"
                >
                    {error}
                </span>
            ) : (
                ''
            )}
        </>
    )
}
