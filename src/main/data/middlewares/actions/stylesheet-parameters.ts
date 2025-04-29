import { PayloadAction } from '@reduxjs/toolkit'
import { error } from 'electron-log'
import { pipelineAPI } from 'main/data/apis/pipeline'
import { selectWebservice, updateJob } from 'shared/data/slices/pipeline'
import { Job, JobRequestError, JobStatus, ScriptOption } from 'shared/types'
import { GetStateFunction } from 'shared/types/store'

export function requestStylesheetParameters(
    action: PayloadAction<any>,
    dispatch,
    getState: GetStateFunction
) {
    const job = action.payload as Job
    const webservice = selectWebservice(getState())
    pipelineAPI
        .fetchStylesheetParameters(job)(webservice)
        .then((parameters: ScriptOption[] | JobRequestError) => {
            error('Result was', parameters)
            // check if parameters is of type JobRequestError
            if ('type' in parameters) {
                dispatch(
                    updateJob({
                        ...job,
                        jobData: {
                            ...job.jobData,
                            status: JobStatus.ERROR,
                        },
                        jobRequestError: parameters,
                        // Note : the error can also come from the input
                        // errors: [
                        //     {
                        //         fieldName: 'stylesheet',
                        //         error: parameters.description,
                        //     },
                        // ],
                    })
                )
            } else {
                // don't add stylesheet parameters if they have
                // the same name as existing script options
                let uniqueParameters = parameters.filter(
                    (p) => !job.script.options.find((o) => o.name == p.name)
                )
                // update job options with new parameters
                const stylesheetParameterOptions = [
                    ...job.jobRequest.stylesheetParameterOptions,
                ]

                uniqueParameters.map((item) => {
                    stylesheetParameterOptions.push({
                        name: item.name,
                        value: item.default,
                        type: 'string',
                        isStylesheetParameter: true,
                    })
                })
                // Also send back the parameters to the UI
                // for composition of the script options
                dispatch(
                    updateJob({
                        ...job,
                        jobRequest: {
                            ...job.jobRequest,
                            stylesheetParameterOptions: [
                                ...stylesheetParameterOptions,
                            ],
                        },
                        stylesheetParameters: [...uniqueParameters],
                    })
                )
            }
        })
        .catch((e) => {
            error('error fetching stylesheet parameters', e)
            dispatch(
                updateJob({
                    ...job,
                    jobData: {
                        ...job.jobData,
                        status: JobStatus.ERROR,
                    },
                    jobRequestError: {
                        type: 'JobRequestError',
                        description: String(e) + ':' + e.parsedText,
                        trace: (e as Error).stack,
                    },
                    // Note : the error can also come from the input
                    // errors: [
                    //     {
                    //         fieldName: 'stylesheet',
                    //         error:
                    //             e instanceof ParserException
                    //                 ? e.parsedText
                    //                 : String(e),
                    //     },
                    // ],
                })
            )
        })
}
