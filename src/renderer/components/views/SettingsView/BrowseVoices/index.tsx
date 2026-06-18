import { useState } from 'react'
import { TtsVoice } from 'shared/types/ttsConfig'
// @ts-ignore
import { voicesTransliterations } from './voiceTransliterations'
// @ts-ignore
import { VoicePreview } from './VoicePreview'
import { SettingsMenuItem } from '../types'
import { formatGenderAgePart, parseGenderAge } from 'shared/utils'

export function BrowseVoices({
    availableVoices,
    userPreferredVoices,
    onChangePreferredVoices,
    ttsEnginesStates,
    voiceFilters,
    onChangeVoiceFilters,
    onSelectSection,
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
    const [age, setAge] = useState(
        voiceFilters.find((vf) => vf.id == 'select-age')?.value ?? 'All'
    )
    const [voiceId, setVoiceId] = useState(
        voiceFilters.find((vf) => vf.id == 'select-voice')?.value ?? 'None'
    )
    const noAgeValue = 'none'

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

    type VoiceFilterValues = {
        lang: string
        engine: string
        langcode: string
        gender: string
        age: string
        voiceId: string
    }

    const voiceKey = (voice: TtsVoice) => `${voice.engine}-${voice.name}`

    const voiceMatchesFilters = (
        voice: TtsVoice,
        filters: VoiceFilterValues,
        includeVoice = false
    ) => {
        const parsed = parseGenderAge(voice.gender)
        return (
            (filters.lang == 'All' || getLang(voice.lang) == filters.lang) &&
            (filters.engine == 'All' || voice.engine == filters.engine) &&
            (filters.langcode == 'All' || voice.lang == filters.langcode) &&
            (filters.gender == 'All' || parsed.gender == filters.gender) &&
            (filters.age == 'All' ||
                (filters.age == noAgeValue
                    ? parsed.age == undefined
                    : parsed.age == filters.age)) &&
            (!includeVoice ||
                filters.voiceId == 'None' ||
                voiceKey(voice) == filters.voiceId)
        )
    }

    const hasMatchingVoice = (
        filters: VoiceFilterValues,
        includeVoice = false
    ) =>
        availableVoices.some((voice) =>
            voiceMatchesFilters(voice, filters, includeVoice)
        )

    const resolveFilterValues = (
        changes: Partial<VoiceFilterValues>
    ): VoiceFilterValues => {
        const resolved: VoiceFilterValues = {
            lang,
            engine,
            langcode,
            gender,
            age,
            voiceId,
            ...changes,
        }

        if (
            resolved.engine != 'All' &&
            !hasMatchingVoice({
                ...resolved,
                langcode: 'All',
                gender: 'All',
                age: 'All',
                voiceId: 'None',
            })
        ) {
            resolved.engine = 'All'
        }

        if (
            resolved.langcode != 'All' &&
            !hasMatchingVoice({
                ...resolved,
                gender: 'All',
                age: 'All',
                voiceId: 'None',
            })
        ) {
            resolved.langcode = 'All'
        }

        if (
            resolved.gender != 'All' &&
            !hasMatchingVoice({
                ...resolved,
                age: 'All',
                voiceId: 'None',
            })
        ) {
            resolved.gender = 'All'
        }

        if (
            resolved.age != 'All' &&
            !hasMatchingVoice({
                ...resolved,
                voiceId: 'None',
            })
        ) {
            resolved.age = 'All'
        }

        if (
            resolved.voiceId != 'None' &&
            !hasMatchingVoice(resolved, true)
        ) {
            resolved.voiceId = 'None'
        }

        return resolved
    }

    const filtersFromValues = (filters: VoiceFilterValues) => [
        {
            id: 'select-lang',
            value: filters.lang,
        },
        {
            id: 'select-engine',
            value: filters.engine,
        },
        {
            id: 'select-dialect',
            value: filters.langcode,
        },
        {
            id: 'select-gender',
            value: filters.gender,
        },
        {
            id: 'select-age',
            value: filters.age,
        },
        {
            id: 'select-voice',
            value: filters.voiceId,
        },
    ]

    const applyFilterValues = (filters: VoiceFilterValues) => {
        setLang(filters.lang)
        setEngine(filters.engine)
        setLangcode(filters.langcode)
        setGender(filters.gender)
        setAge(filters.age)
        setVoiceId(filters.voiceId)
        onChangeVoiceFilters(filtersFromValues(filters))
    }

    let selectLanguage = (e) => {
        applyFilterValues(resolveFilterValues({ lang: e.target.value }))
    }
    let selectEngine = (e) => {
        applyFilterValues(resolveFilterValues({ engine: e.target.value }))
    }
    let selectLangcode = (e) => {
        applyFilterValues(resolveFilterValues({ langcode: e.target.value }))
    }
    let selectGender = (e) => {
        applyFilterValues(resolveFilterValues({ gender: e.target.value }))
    }
    let selectAge = (e) => {
        applyFilterValues(resolveFilterValues({ age: e.target.value }))
    }
    let selectVoice = (e) => {
        applyFilterValues(resolveFilterValues({ voiceId: e.target.value }))
    }
    let resetFilters = () => {
        applyFilterValues({
            lang: 'All',
            engine: 'All',
            langcode: 'All',
            gender: 'All',
            age: 'All',
            voiceId: 'None',
        })
    }
    const filtersAreActive =
        lang != 'All' ||
        engine != 'All' ||
        langcode != 'All' ||
        gender != 'All' ||
        age != 'All' ||
        voiceId != 'None'
    const selectedVoice =
        voiceId !== 'None'
            ? availableVoices.find((v) => voiceKey(v) == voiceId)
            : null

    const matchesLanguage = (voice: TtsVoice) =>
        lang == 'All' || getLang(voice.lang) == lang
    const matchesEngine = (voice: TtsVoice) =>
        engine == 'All' || voice.engine == engine
    const matchesDialect = (voice: TtsVoice) =>
        langcode == 'All' || voice.lang == langcode
    const matchesGender = (voice: TtsVoice) =>
        gender == 'All' || parseGenderAge(voice.gender).gender == gender
    const matchesAge = (voice: TtsVoice) =>
        age == 'All' ||
        (age == noAgeValue
            ? parseGenderAge(voice.gender).age == undefined
            : parseGenderAge(voice.gender).age == age)

    const matchingVoices = availableVoices
        .filter(matchesLanguage)
        .filter(matchesEngine)
        .filter(matchesDialect)
        .filter(matchesGender)
        .filter(matchesAge)

    return (
        <>
            <div className="voice-filters">
                <div className="field">
                    <label htmlFor="select-language">Language</label>
                    <select
                        id="select-language"
                        onChange={(e) => selectLanguage(e)}
                        value={lang}
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
                        value={engine}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter(matchesLanguage)
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
                        value={langcode}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter(matchesLanguage)
                                    .filter(matchesEngine)
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
                    <label htmlFor="select-gender">Gender</label>
                    <select
                        id="select-gender"
                        onChange={(e) => selectGender(e)}
                        value={gender}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter(matchesLanguage)
                                    .filter(matchesEngine)
                                    .filter(matchesDialect)
                                    .map((v) => parseGenderAge(v.gender).gender)
                            )
                        )
                            .sort((a: string, b: string) => (a < b ? -1 : 1))
                            .map((gender: string, idx: number) => (
                                <option value={gender} key={gender}>
                                    {formatGenderAgePart(gender)}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="select-age">Age</label>
                    <select
                        id="select-age"
                        onChange={(e) => selectAge(e)}
                        value={age}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter(matchesLanguage)
                                    .filter(matchesEngine)
                                    .filter(matchesDialect)
                                    .filter(matchesGender)
                                    .map(
                                        (v) =>
                                            parseGenderAge(v.gender).age ??
                                            noAgeValue
                                    )
                            )
                        )
                            .sort((a: string, b: string) => (a < b ? -1 : 1))
                            .map((age: string, idx: number) => (
                                <option value={age} key={age}>
                                    {formatGenderAgePart(
                                        age == noAgeValue ? undefined : age
                                    )}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor="select-voice">Voice</label>
                    <select
                        id="select-voice"
                        onChange={(e) => selectVoice(e)}
                        value={voiceId}
                    >
                        <option value="None">None</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter(matchesLanguage)
                                    .filter(matchesEngine)
                                    .filter(matchesDialect)
                                    .filter(matchesGender)
                                    .filter(matchesAge)
                            )
                        )
                            // @ts-ignore
                            .sort((a, b) => (a.name < b.name ? -1 : 1))
                            .map((v: TtsVoice, idx) => (
                                //@ts-ignore
                                <option
                                    value={`${v.engine}-${v.name}`}
                                    key={`voice-${v.engine}-${v.name}`}
                                >
                                    {voicesTransliterations[v.name] ?? v.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
            <div className="voice-count-row">
                <p className="voice-count" aria-live="polite">
                    {matchingVoices.length}{' '}
                    {matchingVoices.length === 1 ? 'voice' : 'voices'} match
                </p>
                <button
                    type="button"
                    onClick={resetFilters}
                    disabled={!filtersAreActive}
                >
                    Reset filters
                </button>
            </div>
            <div className="voice-details">
                {selectedVoice ? (
                    <>
                        <p className="selected-voice">
                            <b>Selected</b>: "
                            {voicesTransliterations[selectedVoice.name] ??
                                selectedVoice.name}
                            ", {languageNames.of(selectedVoice.lang)},{' '}
                            {selectedVoice.engine}, Gender:{' '}
                            {formatGenderAgePart(
                                parseGenderAge(selectedVoice.gender).gender
                            )}
                            , Age:{' '}
                            {formatGenderAgePart(
                                parseGenderAge(selectedVoice.gender).age
                            )}
                            .
                        </p>
                        <VoicePreview
                            voice={selectedVoice}
                            availableVoices={availableVoices}
                        ></VoicePreview>
                        {preferredVoices.find(
                            (v) =>
                                v.engine === selectedVoice.engine &&
                                v.name === selectedVoice.name
                        ) ? (
                            <p className="voice-already-exists">
                                This voice has been added to{' '}
                                <a
                                    onClick={() =>
                                        onSelectSection(
                                            SettingsMenuItem.TTSPreferredVoices
                                        )
                                    }
                                >
                                    your list
                                </a>
                                .
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    addToPreferredVoices(selectedVoice)
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
