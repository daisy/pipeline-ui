import { useState } from 'react'
import { TtsVoice } from 'shared/types/ttsConfig'
import { voicesTransliterations } from './BrowseVoices/voiceTransliterations'

export function PreferredVoices({
    userPreferredVoices,
    ttsEnginesStates,
    userDefaultVoices,
    onChangePreferredVoices,
    onChangeDefaultVoices,
}) {
    const [preferredVoices, setPreferredVoices] = useState([
        ...userPreferredVoices,
    ])
    const [defaultVoices, setDefaultVoices] = useState([...userDefaultVoices])
    const [preferredVoicesLanguage, setPreferredVoicesLanguage] =
        useState('All')

    let languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

    let removeFromPreferredVoices = (voice: TtsVoice) => {
        if (defaultVoices.find((vx) => vx.id == voice.id)) {
            clearDefaultVoice(voice.lang)
        }

        let tmpVoices = [...preferredVoices]
        let idx = tmpVoices.findIndex((v) => v.id == voice.id)
        tmpVoices.splice(idx, 1)
        setPreferredVoices(tmpVoices)
        onChangePreferredVoices(tmpVoices)
    }

    // return the first part of the language code (e.g. 'en' for 'en-US')
    // or return the whole thing if there is no dash
    let getLang = (str) => {
        let trimmed = str.trim()
        let idxOfDash = trimmed.indexOf('-')
        return str.slice(0, idxOfDash == -1 ? undefined : idxOfDash)
    }

    let selectDefault = (e, voice) => {
        let tmpVoices = defaultVoices ? [...defaultVoices] : []
        let oldDefaultIdx =
            tmpVoices?.findIndex(
                (vx) => getLang(vx.lang) == getLang(voice.lang)
            ) ?? -1
        if (oldDefaultIdx != -1) {
            tmpVoices.splice(oldDefaultIdx, 1)
        }
        tmpVoices.push(voice)
        setDefaultVoices(tmpVoices)
        onChangeDefaultVoices(tmpVoices)
    }
    let clearDefaultVoice = (langCode) => {
        let tmpVoices = defaultVoices ? [...defaultVoices] : []
        let oldDefaultIdx = tmpVoices.findIndex(
            (vx) => getLang(vx.lang) == langCode
        )
        if (oldDefaultIdx != -1) {
            tmpVoices.splice(oldDefaultIdx, 1)
            setDefaultVoices(tmpVoices)
            onChangeDefaultVoices(tmpVoices)
        }
    }
    let preferredRowLength = userPreferredVoices.filter((v) => {
        if (preferredVoicesLanguage == 'All') {
            return true
        } else {
            return getLang(v.lang) == preferredVoicesLanguage
        }
    }).length
    let selectPreferredVoicesLanguage = (e) => {
        setPreferredVoicesLanguage(e.target.value)
    }
    return (
        <>
            <p id="preferred-table-title">
                View
                <select onChange={(e) => selectPreferredVoicesLanguage(e)}>
                    <option value="All">All</option>
                    {Array.from(
                        new Set(userPreferredVoices.map((v) => getLang(v.lang)))
                    )
                        .sort((a: string, b: string) =>
                            languageNames.of(a) < languageNames.of(b) ? -1 : 1
                        )
                        .map((lang: string, idx: number) => (
                            <option value={lang} key={lang}>
                                {languageNames.of(lang)}
                            </option>
                        ))}
                </select>
                preferred voices. Showing {preferredRowLength}{' '}
                {preferredRowLength == 1 ? 'row' : 'rows'}.
            </p>
            <div
                role="region"
                aria-labelledby="preferred-table-title"
                tabIndex={0}
            >
                <table aria-colcount={5} aria-rowcount={preferredRowLength}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Engine</th>
                            <th>Language</th>
                            <th>Gender/Age</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userPreferredVoices
                            .filter((v) => {
                                if (preferredVoicesLanguage == 'All') {
                                    return true
                                } else {
                                    return (
                                        getLang(v.lang) ==
                                        preferredVoicesLanguage
                                    )
                                }
                            })
                            .sort((a, b) => (a.name > b.name ? 1 : -1))
                            .map((v, idx) => (
                                <tr key={v.id}>
                                    <td className="voiceName">
                                        {voicesTransliterations[v.name] ??
                                            v.name}
                                    </td>
                                    <td>
                                        {ttsEnginesStates[v.engine]?.name ??
                                            v.engine}
                                    </td>
                                    <td>{languageNames.of(v.lang)}</td>
                                    <td>{v.gender}</td>
                                    <td className="actions">
                                        <div>
                                            <label htmlFor={`cb-${v.id}`}>
                                                Set as default for{' '}
                                                {languageNames.of(
                                                    getLang(v.lang)
                                                )}
                                            </label>
                                            <input
                                                type="radio"
                                                name={getLang(v.lang)}
                                                id={`cb-${v.id}`}
                                                onChange={(e) =>
                                                    selectDefault(e, v)
                                                }
                                                defaultChecked={
                                                    defaultVoices?.find(
                                                        (vx) => vx.id == v.id
                                                    ) != undefined
                                                }
                                            ></input>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                removeFromPreferredVoices(v)
                                            }}
                                            title={`Remove ${v.name}`}
                                        >
                                            Remove voice
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {preferredVoicesLanguage != 'All' ? (
                    <button
                        type="button"
                        onClick={(e) =>
                            clearDefaultVoice(preferredVoicesLanguage)
                        }
                    >
                        Clear default for{' '}
                        {languageNames.of(preferredVoicesLanguage)}
                    </button>
                ) : (
                    ''
                )}
            </div>
        </>
    )
}
