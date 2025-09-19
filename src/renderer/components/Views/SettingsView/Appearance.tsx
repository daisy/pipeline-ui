import {
    ColorScheme,
    DefaultTextSize,
    Font,
    TextSizeOptions,
} from 'shared/types'
import {
    save,
    setColorScheme,
    setFont,
    setTextSize,
} from 'shared/data/slices/settings'

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
        //@ts-ignore
        document.querySelector('#textSize').value = DefaultTextSize
        App.store.dispatch(setTextSize(DefaultTextSize))
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
                    {TextSizeOptions.map((opt, idx) => (
                        <option value={opt} key={idx}></option>
                    ))}
                </datalist>
                <button type="button" onClick={(e) => resetTextSize()}>
                    Reset text size
                </button>
            </div>
        </>
    )
}
