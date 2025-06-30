import { useState } from 'react'
import { TtsVoice } from 'shared/types/ttsConfig'
import { voicesTransliterations } from './voiceTransliterations'
import { VoicePreview } from './VoicePreview'

export function BrowseVoices({
    availableVoices,
    userPreferredVoices,
    onChangePreferredVoices,
    ttsEnginesStates,
    voiceFilters,
    onChangeVoiceFilters,
}) {
    const [preferredVoices, setPreferredVoices] = useState([
        ...userPreferredVoices,
    ])
    // filter selections
    const [engine, setEngine] = useState(
        voiceFilters.find((vf) => vf.id == 'select-engine')?.value ?? 'All'
    )
    const [lang, setLang] = useState(
        voiceFilters.find((vf) => vf.id == 'select-lang')?.value ?? 'All'
    )
    const [langcode, setLangcode] = useState(
        voiceFilters.find((vf) => vf.id == 'select-dialect')?.value ?? 'All'
    )
    const [gender, setGender] = useState(
        voiceFilters.find((vf) => vf.id == 'select-gender')?.value ?? 'All'
    )
    const [voiceId, setVoiceId] = useState(
        voiceFilters.find((vf) => vf.id == 'select-voice')?.value ?? 'None'
    )

    let languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

    let addToPreferredVoices = (voice: TtsVoice) => {
        let tmpVoices = [...preferredVoices, voice]
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

    let selectLanguage = (e) => {
        setLang(e.target.value)
        setEngine('All')
        setLangcode('All')
        setGender('All')
        setVoiceId('None')

        let filters = [
            {
                id: 'select-lang',
                value: e.target.value,
            },
            {
                id: 'select-engine',
                value: 'All',
            },
            {
                id: 'select-dialect',
                value: 'All',
            },
            {
                id: 'select-gender',
                value: 'All',
            },
            {
                id: 'select-voice',
                value: 'None',
            },
        ]
        onChangeVoiceFilters(filters)
    }
    let selectEngine = (e) => {
        setEngine(e.target.value)
        setLangcode('All')
        setGender('All')
        setVoiceId('None')

        let filters = [
            {
                id: 'select-lang',
                value: lang,
            },
            {
                id: 'select-engine',
                value: e.target.value,
            },
            {
                id: 'select-dialect',
                value: 'All',
            },
            {
                id: 'select-gender',
                value: 'All',
            },
            {
                id: 'select-voice',
                value: 'None',
            },
        ]
        onChangeVoiceFilters(filters)
    }
    let selectLangcode = (e) => {
        setLangcode(e.target.value)
        setGender('All')
        setVoiceId('None')
        let filters = [
            {
                id: 'select-lang',
                value: lang,
            },
            {
                id: 'select-engine',
                value: engine,
            },
            {
                id: 'select-dialect',
                value: e.target.value,
            },
            {
                id: 'select-gender',
                value: 'All',
            },
            {
                id: 'select-voice',
                value: 'None',
            },
        ]
        onChangeVoiceFilters(filters)
    }
    let selectGender = (e) => {
        setGender(e.target.value)
        setVoiceId('None')
        let filters = [
            {
                id: 'select-lang',
                value: lang,
            },
            {
                id: 'select-engine',
                value: engine,
            },
            {
                id: 'select-dialect',
                value: langcode,
            },
            {
                id: 'select-gender',
                value: e.target.value,
            },
            {
                id: 'select-voice',
                value: 'None',
            },
        ]
        onChangeVoiceFilters(filters)
    }
    let selectVoice = (e) => {
        setVoiceId(e.target.value)
        let filters = [
            {
                id: 'select-lang',
                value: lang,
            },
            {
                id: 'select-engine',
                value: engine,
            },
            {
                id: 'select-dialect',
                value: langcode,
            },
            {
                id: 'select-gender',
                value: gender,
            },
            {
                id: 'select-voice',
                value: e.target.value,
            },
        ]
        onChangeVoiceFilters(filters)
    }

    return (
        <>
            <div className="voice-filters">
                <div className="field">
                    <label htmlFor="select-language">Language</label>
                    <select
                        id="select-language"
                        onChange={(e) => selectLanguage(e)}
                        defaultValue={lang}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(availableVoices.map((v) => getLang(v.lang)))
                        )
                            .sort((a: string, b: string) =>
                                languageNames.of(a) < languageNames.of(b)
                                    ? -1
                                    : 1
                            )
                            .map((lang: string, idx: number) => (
                                <option value={lang} key={lang}>
                                    {languageNames.of(lang)}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="select-engine">Engine</label>
                    <select
                        id="select-engine"
                        onChange={(e) => selectEngine(e)}
                        defaultValue={engine}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter((v) => {
                                        if (lang == 'All') {
                                            return true
                                        }
                                        return getLang(v.lang) == lang
                                    })
                                    .map((v) => v.engine)
                            )
                        )
                            .sort((a: string, b: string) => (a < b ? -1 : 1))
                            .map((engine: string, idx: number) => (
                                <option value={engine} key={engine}>
                                    {ttsEnginesStates[engine]?.name ?? engine}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="select-dialect">Dialect</label>
                    <select
                        id="select-dialect"
                        onChange={(e) => selectLangcode(e)}
                        defaultValue={langcode}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter((v) => {
                                        if (lang == 'All') {
                                            return true
                                        }
                                        return getLang(v.lang) == lang
                                    })
                                    .filter((v) => {
                                        if (engine == 'All') {
                                            return true
                                        }
                                        return v.engine == engine
                                    })
                                    .map((v) => v.lang)
                            )
                        )
                            .sort((a: string, b: string) =>
                                languageNames.of(a) < languageNames.of(b)
                                    ? -1
                                    : 1
                            )
                            .map((lang: string, idx: number) => (
                                <option value={lang} key={lang}>
                                    {languageNames.of(lang)}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="select-gender">Gender/Age</label>
                    <select
                        id="select-gender"
                        onChange={(e) => selectGender(e)}
                        defaultValue={gender}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter((v) => {
                                        if (lang == 'All') {
                                            return true
                                        }
                                        return getLang(v.lang) == lang
                                    })
                                    .filter((v) => {
                                        if (engine == 'All') {
                                            return true
                                        }
                                        return v.engine == engine
                                    })
                                    .filter((v) => {
                                        if (langcode == 'All') {
                                            return true
                                        }
                                        return v.lang == langcode
                                    })
                                    .map((v) => v.gender)
                            )
                        )
                            .sort((a: string, b: string) => (a < b ? -1 : 1))
                            .map((gender: string, idx: number) => (
                                <option value={gender} key={gender}>
                                    {gender.charAt(0).toUpperCase() +
                                        gender.substring(1)}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="select-voice">Voice</label>
                    <select
                        id="select-voice"
                        onChange={(e) => selectVoice(e)}
                        defaultValue={voiceId}
                    >
                        <option value="None">None</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter((v) => {
                                        if (lang == 'All') {
                                            return true
                                        }
                                        return getLang(v.lang) == lang
                                    })
                                    .filter((v) => {
                                        if (engine == 'All') {
                                            return true
                                        }
                                        return v.engine == engine
                                    })
                                    .filter((v) => {
                                        if (langcode == 'All') {
                                            return true
                                        }
                                        return v.lang == langcode
                                    })
                                    .filter((v) => {
                                        if (gender == 'All') {
                                            return true
                                        }
                                        return v.gender == gender
                                    })
                            )
                        )
                            // @ts-ignore
                            .sort((a, b) => (a.name < b.name ? -1 : 1))
                            .map((v: TtsVoice, idx) => (
                                //@ts-ignore
                                <option value={v.id} key={`voice-${v.id}`}>
                                    {voicesTransliterations[v.name] ?? v.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
            <div className="voice-details">
                {voiceId != 'None' ? (
                    <>
                        <p className="selected-voice">
                            <b>Selected</b>: "
                            {voicesTransliterations[
                                availableVoices.find((v) => v.id == voiceId)
                                    .name
                            ] ??
                                availableVoices.find((v) => v.id == voiceId)
                                    .name}
                            ",{' '}
                            {languageNames.of(
                                availableVoices.find((v) => v.id == voiceId)
                                    .lang
                            )}
                            ,{' '}
                            {
                                availableVoices.find((v) => v.id == voiceId)
                                    .engine
                            }
                            ,{' '}
                            {
                                availableVoices.find((v) => v.id == voiceId)
                                    .gender
                            }
                            .
                        </p>
                        <VoicePreview
                            voice={availableVoices.find((v) => v.id == voiceId)}
                        ></VoicePreview>
                        {preferredVoices.find((v) => v.id == voiceId) ? (
                            <p className="voice-already-exists">
                            This voice has been added to your list.
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={(e) =>
                                    addToPreferredVoices(
                                        availableVoices.find(
                                            (v) => v.id == voiceId
                                        )
                                    )
                                }
                            >
                                Add to preferred voices
                            </button>
                        )}
                    </>
                ) : (
                    <p>
                        <i>No voice selected</i>
                    </p>
                )}
            </div>
        </>
    )
}
