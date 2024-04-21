// take strings entered in the UI and convert them to the formatting required for stylesheet parameters
// http://daisy.github.io/pipeline/modules/braille/braille-common/src/main/resources/xml/data-types/transform-query.xml
// strings are as in CSS
// https://developer.mozilla.org/en-US/docs/Web/CSS/string

import { ScriptOption } from 'shared/types'

export function consolidateBrailleOptions(scriptOptions, userInputs) {
    // get all the script options that are stylesheet parameters
    let stylesheetParameterOptions = scriptOptions.filter(
        (o) =>
            o.hasOwnProperty('isStylesheetParameter') && o.isStylesheetParameter
    )

    // all the non-stylesheet parameter user inputs (not script options but name-value pairs)
    let jobRequestOptions = userInputs.filter(
        (o) => !stylesheetParameterOptions.find((spOpt) => spOpt.name == o.name)
    )
    if (stylesheetParameterOptions.length > 0) {
        // the input option name-value pair with the specific name "stylesheet-parameters"
        let stylesheetParametersOption = jobRequestOptions.find(
            (o) => o.name == 'stylesheet-parameters'
        )
        stylesheetParametersOption.value = userInputToStylesheetParameters(
            //@ts-ignore
            stylesheetParameterOptions,
            userInputs
        )
    }
    return jobRequestOptions
}
// input is a list of script options and a list of user inputs for the script
function userInputToStylesheetParameters(
    stylesheetParameterOptions: ScriptOption[],
    userInputForAllOptions
) {
    let parameterString = stylesheetParameterOptions
        .map((opt) => {
            let relevantInput = userInputForAllOptions.find(
                (input) => input.name == opt.name
            )
            if (relevantInput) {
                return `(${relevantInput.name}:"${CSS.escape(
                    relevantInput.value
                )}")`
            } else {
                return ''
            }
        })
        .join('')
    return parameterString
}
