/*
Data manager and owner of tab view
*/
import { useEffect, useState } from 'react'
import { Job } from 'shared/types/pipeline'
import { TabView } from '../TabView'
import { AddJobTab, JobTab } from '../JobTab'
import { JobTabPanel } from '../JobTabPanel'
import { useWindowStore } from 'renderer/store'
import {
    addJob,
    removeJob,
    updateJob,
    newJob,
} from 'shared/data/slices/pipeline'

const { App } = window

export function MainView() {
    const { pipeline } = useWindowStore()
    const [autoselect, setAutoselect] = useState(false)

    useEffect(() => {
        if (!(pipeline.jobs && pipeline.jobs.length > 0)) {
            console.log(pipeline.jobs)
            App.store.dispatch(addJob(newJob(pipeline)))
        }
    }, [])

    let addJobHandle = (onItemWasCreated?) => {
        let theNewJob = newJob(pipeline)
        App.store.dispatch(addJob(theNewJob))
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
