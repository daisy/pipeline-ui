import { ColorScheme } from 'shared/types'
import { save, setColorScheme } from 'shared/data/slices/settings'

const { App } = window

export function Appearance({ newSettings }) {
    const colorModeChanged = (e) => {
        App.store.dispatch(
            setColorScheme(
                Object.keys(ColorScheme)[
                    e.target.selectedIndex
                ] as keyof typeof ColorScheme
            )
        )
        App.store.dispatch(save())
    }

    return (
        <div className="field">
            <label htmlFor="colorMode">Interface color mode</label>
            <span className="description">
                Select the interface color scheme to use
            </span>
            <select
                id="colorMode"
                onChange={(e) => colorModeChanged(e)}
                value={newSettings.colorScheme}
            >
                {Object.entries(ColorScheme).map(([k, v]: [string, string]) => {
                    return (
                        <option key={k} value={k}>
                            {v}
                        </option>
                    )
                })}
            </select>
        </div>
    )
}
