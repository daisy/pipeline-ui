import { useEffect, useState } from 'react'
import { TtsVoice } from 'shared/types/ttsConfig'
import { voicesTransliterations } from './BrowseVoices/voiceTransliterations'
import { X } from 'renderer/components/Widgets/SvgIcons'
import { SettingsMenuItem } from '.'

// return the first part of the language code (e.g. 'en' for 'en-US')
// or return the whole thing if there is no dash
function getLang(str) {
    let trimmed = str.trim()
    let idxOfDash = trimmed.indexOf('-')
    return str.slice(0, idxOfDash == -1 ? undefined : idxOfDash)
}

export function PreferredVoices({
    userPreferredVoices,
    ttsEnginesStates,
    userDefaultVoices,
    onChangePreferredVoices,
    onChangeDefaultVoices,
    onChangePreferredAndDefaultVoices,
    onSelectSection,
}) {
    const [preferredVoices, setPreferredVoices] = useState([
        ...userPreferredVoices,
    ])
    const [defaultVoices, setDefaultVoices] = useState([...userDefaultVoices])
    const [uniqueLanguages, setUniqueLanguages] = useState([])

    let languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

    useEffect(() => {
        let uniqueLangs = Array.from(
            new Set(preferredVoices.map((v) => getLang(v.lang)))
        )
        setUniqueLanguages(uniqueLangs)
    }, [preferredVoices])

    let removeFromPreferredVoices = (voice: TtsVoice) => {
        let tmpVoices = [...preferredVoices]
        let idx = tmpVoices.findIndex((v) => v.id == voice.id)
        tmpVoices.splice(idx, 1)
        setPreferredVoices(tmpVoices)
        if (defaultVoices.find((vx) => vx.id == voice.id)) {
            let newDefaultVoices = clearDefaultVoice(getLang(voice.lang), false)
            onChangePreferredAndDefaultVoices(tmpVoices, newDefaultVoices)
        } else {
            onChangePreferredVoices(tmpVoices)
        }
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
    let clearDefaultVoice = (langCode, notify = true) => {
        let tmpVoices = defaultVoices ? [...defaultVoices] : []
        let oldDefaultIdx = tmpVoices.findIndex(
            (vx) => getLang(vx.lang) == langCode
        )
        if (oldDefaultIdx != -1) {
            tmpVoices.splice(oldDefaultIdx, 1)
            setDefaultVoices(tmpVoices)
            // in the case that the preferred voices are also changing, we don't want to raise the onChange here
            // because the settings file ends up being wrong
            if (notify) {
                onChangeDefaultVoices(tmpVoices)
            }
        }
        return tmpVoices
    }

    return (
        <div className="tts-preferred-voices">
            <p>
                Add voices via the{' '}
                <a
                    onClick={() =>
                        onSelectSection(SettingsMenuItem.TTSBrowseVoices)
                    }
                >
                    Browse Voices
                </a>{' '}
                page.
            </p>
            {uniqueLanguages
                .sort((a, b) => (a > b ? 1 : -1))
                .map((lang, idx) => {
                    return (
                        <div key={idx}>
                            <table
                                aria-colcount={5}
                                aria-rowcount={
                                    userPreferredVoices.filter(
                                        (v) => getLang(v.lang) == getLang(lang)
                                    ).length
                                }
                            >
                                <caption>
                                    {languageNames.of(getLang(lang))}
                                </caption>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Engine</th>
                                        <th>Language</th>
                                        <th>Gender/Age</th>
                                        <th>Set default</th>
                                        <th>Remove</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preferredVoices
                                        .filter(
                                            (v) =>
                                                getLang(v.lang) == getLang(lang)
                                        )
                                        .sort((a, b) =>
                                            a.name > b.name ? 1 : -1
                                        )
                                        .map((v, idx) => (
                                            <tr key={v.id}>
                                                <th className="voiceName">
                                                    {voicesTransliterations[
                                                        v.name
                                                    ] ?? v.name}
                                                </th>

                                                <td>
                                                    {ttsEnginesStates[v.engine]
                                                        ?.name ?? v.engine}
                                                </td>
                                                <td>
                                                    {languageNames.of(v.lang)}
                                                </td>
                                                <td className="gender">
                                                    {v.gender}
                                                </td>
                                                <td className="set-default">
                                                    <input
                                                        type="radio"
                                                        name={getLang(v.lang)}
                                                        id={`cb-${v.id}`}
                                                        onChange={(e) =>
                                                            selectDefault(e, v)
                                                        }
                                                        aria-label={`Set ${
                                                            v.name
                                                        } as the default voice for ${languageNames.of(
                                                            getLang(v.lang)
                                                        )}`}
                                                        checked={
                                                            defaultVoices?.find(
                                                                (vx) =>
                                                                    vx.id ==
                                                                    v.id
                                                            ) != undefined
                                                        }
                                                    ></input>
                                                </td>
                                                <td className="remove">
                                                    <button
                                                        type="button"
                                                        className="invisible"
                                                        onClick={(e) => {
                                                            removeFromPreferredVoices(
                                                                v
                                                            )
                                                        }}
                                                        aria-label={`Remove ${v.name} from preferred voices`}
                                                    >
                                                        <X
                                                            width={20}
                                                            height={20}
                                                        />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            <div className="row">
                                <p>
                                    The default voice for{' '}
                                    {languageNames.of(getLang(lang))} is{' '}
                                    <b>
                                        {defaultVoices.find(
                                            (v) => getLang(v.lang) == lang
                                        )?.name ?? 'not set'}
                                    </b>
                                    .
                                </p>
                                {defaultVoices.find(
                                    (v) => getLang(v.lang) == lang
                                ) && (
                                    <button
                                        type="button"
                                        onClick={(e) => clearDefaultVoice(lang)}
                                    >
                                        Clear default
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
        </div>
    )
}
