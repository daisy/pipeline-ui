import { ColorScheme, Font } from 'shared/types'
import {
    save,
    setColorScheme,
    setFont,
    setTextSize,
} from 'shared/data/slices/settings'

const { App } = window
const DEFAULT_TEXT_SIZE = 20
const TEXT_SIZE_OPTIONS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
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

    let fontChanged = (e) => {
        App.store.dispatch(
            setFont(
                Object.keys(Font)[e.target.selectedIndex] as keyof typeof Font
            )
        )
        App.store.dispatch(save())
    }

    let textSizeChanged = (e) => {
        App.store.dispatch(setTextSize(e.target.value))
        App.store.dispatch(save())
    }
    let resetTextSize = () => {
        App.store.dispatch(setTextSize(DEFAULT_TEXT_SIZE))
        App.store.dispatch(save())
    }
    return (
        <>
            <div className="field">
                <label htmlFor="colorMode">Interface color mode</label>
                <span className="description">
                    Select the interface color scheme to use
                </span>
                <select
                    id="colorMode"
                    onChange={(e) => colorModeChanged(e)}
                    defaultValue={newSettings.colorScheme}
                >
                    {Object.entries(ColorScheme).map(
                        ([k, v]: [string, string]) => {
                            return (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            )
                        }
                    )}
                </select>
            </div>
            <div className="field">
                <label htmlFor="font">Font</label>
                <select
                    id="font"
                    onChange={(e) => fontChanged(e)}
                    defaultValue={newSettings.fontName}
                >
                    {Object.entries(Font).map(([k, v]: [string, string]) => {
                        return (
                            <option key={k} value={k}>
                                {v}
                            </option>
                        )
                    })}
                </select>
            </div>
            <div className="field">
                <label htmlFor="textSize">Text size</label>
                <input
                    type="range"
                    id="textSize"
                    list="textSizes"
                    onChange={(e) => textSizeChanged(e)}
                    defaultValue={newSettings.textSize}
                />
                <datalist id="textSizes">
                    {TEXT_SIZE_OPTIONS.map((opt) => (
                        <option value={opt}></option>
                    ))}
                </datalist>
                <button type="button" onClick={(e) => resetTextSize()}>
                    Reset text size
                </button>
            </div>
        </>
    )
}
