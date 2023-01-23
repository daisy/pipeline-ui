/*
Data manager and owner of tab view
*/
import { useEffect, useState } from 'react'
import { Job, JobStatus, JobState } from 'shared/types/pipeline'
import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'shared/parser/pipelineXmlConverter'
import { TabView } from '../TabView'
import { AddJobTab, JobTab } from '../JobTab'
import { JobTabPanel } from '../JobTabPanel'
import { useWindowStore } from 'renderer/store'
import { ReduxTest } from '../ReduxTest'
import { addJob, removeJob, updateJob } from 'shared/data/slices/pipeline'

const NEW_JOB = (id) => ({
    internalId: id,
    state: JobState.NEW,
})

const { App } = window

export function MainView() {
    const { pipeline } = useWindowStore()
    const [nextJobId, setNextJobId] = useState(0)
    const [autoselect, setAutoselect] = useState(false)

    useEffect(() => {
        if (!(pipeline.jobs && pipeline.jobs.length > 0)) {
            console.log(pipeline.jobs)
            App.store.dispatch(addJob(NEW_JOB(`job-${nextJobId}`)))
            setNextJobId(nextJobId + 1)
        }
    }, [])

    let addJobHandle = (onItemWasCreated?) => {
        let theNewJob = NEW_JOB(`job-${nextJobId}`)
        App.store.dispatch(addJob(theNewJob))
        setNextJobId(nextJobId + 1)
        if (onItemWasCreated) {
            onItemWasCreated(theNewJob.internalId)
        }
    }

    let deleteJobHandle = (jobId: string) => {
        App.store.dispatch(removeJob(jobId))
    }

    let updateJobHandle = (job: Job) => {
        App.store.dispatch(updateJob(job))
    }

    return (
        <>
            <ReduxTest />
            <TabView<Job>
                items={pipeline.jobs}
                onTabCreate={addJobHandle}
                onTabClose={deleteJobHandle}
                ItemTab={JobTab}
                AddItemTab={AddJobTab}
                ItemTabPanel={JobTabPanel}
                updateItem={updateJobHandle}
            />
        </>
    )
}
