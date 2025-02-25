import { useWindowStore } from 'renderer/store'
import { CustomFieldDocumentation } from './CustomFieldDocumentation'
import { ScriptItemBase, TypeChoice, ValueChoice } from 'shared/types'
import { useEffect, useState, useMemo } from 'react'
import { ControlledInput } from './ControlledInput'
import { MarkdownDescription } from './MarkdownDescription'
import { fetchTemporaryDatatype } from 'renderer/utils/temp-datatype'

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
    const [datatype, setDatatype] = useState(
        pipeline.datatypes.find((dt) => dt.id == item.type) ?? null
    )

    useMemo(() => {
        const fetchData = async () => {
            let datatypeDetails = await fetchTemporaryDatatype(item.type)
            // @ts-ignore
            setDatatype({ ...datatypeDetails })
        }
        fetchData()
    }, [])

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

    let onChangeValue = (newValue) => {
        setUserInteracted(true)
        setValue(newValue)
        onChange(newValue)
    }

    if (datatype && datatype.choices) {
        // if there are value choices, make a dropdown select
        let valueChoices = datatype.choices.filter((item) =>
            item.hasOwnProperty('value')
        ) as ValueChoice[]
        let typeChoices = datatype.choices.filter(
            (item) => !item.hasOwnProperty('value')
        ) as TypeChoice[]

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
                                ? (datatype.choices[0] as TypeChoice)
                                      ?.pattern ?? ''
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
                const selectedOption = valueChoices
                    .map((o) => o.value)
                    .indexOf(value)
                const hasLongDescriptions = valueChoices.some(
                    (o) => o.documentation.split('\n').length > 1
                )
                return (
                    <>
                        <select
                            id={controlId}
                            onChange={(e) => onChangeValue(e.target.value)}
                            value={
                                (Array.isArray(value) && value.length == 0) ||
                                value == null
                                    ? ''
                                    : value
                            }
                            aria-details={
                                controlId + '-' + selectedOption + '-details'
                            }
                            multiple={false}
                        >
                            {valueChoices.map((option, idx) => {
                                let displayString =
                                    option.documentation ?? option.value
                                // documentation strings can be split into short and long descriptions, one per line
                                if (displayString.split('\n').length > 1) {
                                    displayString = displayString.split('\n')[0]
                                }
                                return (
                                    // @ts-ignore
                                    <option
                                        key={controlId + '-' + idx}
                                        aria-details={
                                            controlId + '-' + idx + '-details'
                                        }
                                        value={option.value}
                                    >
                                        {option.documentation
                                            ? option.documentation.split(
                                                  '\n'
                                              )[0]
                                            : option.value}
                                    </option>
                                )
                            })}
                        </select>
                        {hasLongDescriptions && (
                            <section id={controlId + '-details'}>
                                {valueChoices.map((option, idx) => {
                                    const displayed = idx == selectedOption
                                    const selectedOptionDescription =
                                        option?.documentation
                                            .split('\n')
                                            .slice(1)
                                            .join('\n')
                                    return (
                                        <p
                                            id={
                                                controlId +
                                                '-' +
                                                idx +
                                                '-details'
                                            }
                                            key={
                                                controlId +
                                                '-' +
                                                idx +
                                                '-details'
                                            }
                                            className={
                                                !displayed
                                                    ? 'visuallyhidden'
                                                    : ''
                                            }
                                            style={{ margin: 0 }}
                                        >
                                            <MarkdownDescription>
                                                {selectedOptionDescription}
                                            </MarkdownDescription>
                                        </p>
                                    )
                                })}
                            </section>
                        )}
                    </>
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
