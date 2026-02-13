import {
    save,
    setLastUsedScriptOptionOverrides,
    setScriptFrequency,
    setSortScriptsByFrequency,
    setSuggestOptionValues,
} from 'shared/data/slices/settings'
const { App } = window

export function History({ newSettings }) {
    let clearHistory = () => {
        App.store.dispatch(setScriptFrequency([]))
        App.store.dispatch(setLastUsedScriptOptionOverrides([]))
        App.store.dispatch(save())
    }
    let onSuggestOptionValuesChanged = (e) => {
        App.store.dispatch(setSuggestOptionValues(e.target.checked))
        App.store.dispatch(save())
    }
    let onPrioritizeScriptsChanged = (e) => {
        App.store.dispatch(setSortScriptsByFrequency(e.target.checked))
        App.store.dispatch(save())
    }

    return (
        <>
            <div className="field">
                <label htmlFor="prioritizeScripts">
                    Prioritize frequently-used scripts
                </label>
                <input
                    type="checkbox"
                    id="prioritizeScripts"
                    checked={newSettings.sortScriptsByFrequency}
                    onChange={onPrioritizeScriptsChanged}
                />
            </div>
            <div className="field">
                <label htmlFor="suggestOptions">
                    Prefill last-used option values
                </label>
                <input
                    type="checkbox"
                    id="suggestOptions"
                    checked={newSettings.suggestOptionValues}
                    onChange={onSuggestOptionValuesChanged}
                />
            </div>

            <button type="button" onClick={(e) => clearHistory()}>
                Clear script and option history
            </button>
        </>
    )
}
