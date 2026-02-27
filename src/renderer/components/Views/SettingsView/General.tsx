import { save, setDownloadPath } from 'shared/data/slices/settings'
import { SingleFileInput } from 'renderer/components/Widgets/SingleFileInput'
// @ts-ignore
import { Behavior } from './Behavior'
// @ts-ignore
import { Updates } from './Updates'
// @ts-ignore
import { History } from './History'

const { App } = window

export function General({ newSettings }) {
    const resultsFolderChanged = (filename) => {
        App.store.dispatch(setDownloadPath(filename[0]))
        App.store.dispatch(save())
    }

    return (
        <>
            <div className="field">
                <label htmlFor="resultsFolder">Results folder</label>
                <span className="description">
                    A folder where all job results will be automatically
                    downloaded
                </span>
                <SingleFileInput
                    allowFile={false}
                    allowFolder={true}
                    onChange={resultsFolderChanged}
                    initialValue={[newSettings.downloadFolder]}
                    required={true}
                    elemId="results-folder"
                />
                {newSettings.downloadFolder == '' ? (
                    <span className="warning">This field cannot be empty.</span>
                ) : (
                    ''
                )}
            </div>
            <Behavior newSettings={newSettings} />
            <Updates newSettings={newSettings} />
            <History newSettings={newSettings} />
        </>
    )
}
