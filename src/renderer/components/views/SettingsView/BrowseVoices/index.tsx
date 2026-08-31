import { useEffect, useRef, useState } from 'react'
import { TtsVoice } from 'shared/types/ttsConfig'
// @ts-ignore
import { voicesTransliterations } from './voiceTransliterations'
import { PauseIcon, PlayIcon, X } from 'renderer/components/Widgets/SvgIcons'
import { formatGenderAgePart, parseGenderAge } from 'shared/utils'
import { DefaultVoiceTableThreshold } from 'shared/types'
import { fetchVoicePreviewObjectUrl } from '../voicePreview'

export function BrowseVoices({
    availableVoices,
    userPreferredVoices,
    onChangePreferredVoices,
    ttsEnginesStates,
    voiceFilters,
    onChangeVoiceFilters,
    voiceTableThreshold = DefaultVoiceTableThreshold,
    onChangeVoiceTableThreshold,
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
    const [nameSearch, setNameSearch] = useState('')
    const [customPreviewText, setCustomPreviewText] = useState('')
    const [currentPage, setCurrentPage] = useState(0)
    const [playingPreviewKey, setPlayingPreviewKey] = useState<string | null>(
        null
    )
    const nameSearchInputRef = useRef<HTMLInputElement>(null)
    const previewAudioRef = useRef<HTMLAudioElement>(null)
    const previewAudioObjectUrlRef = useRef<string | null>(null)
    const noAgeValue = 'none'
    const voiceTableThresholdMax = Math.max(1, availableVoices.length)
    const clampVoiceTableThreshold = (value: string | number) =>
        Math.min(
            voiceTableThresholdMax,
            Math.max(1, Number(value) || DefaultVoiceTableThreshold)
        )
    const normalizedVoiceTableThreshold =
        clampVoiceTableThreshold(voiceTableThreshold)
    const [voiceTableThresholdInput, setVoiceTableThresholdInput] = useState(
        String(normalizedVoiceTableThreshold)
    )

    useEffect(() => {
        setVoiceTableThresholdInput(String(normalizedVoiceTableThreshold))
    }, [normalizedVoiceTableThreshold])

    let languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

    let addToPreferredVoices = (voice: TtsVoice) => {
        let tmpVoices = [...preferredVoices, voice]
        setPreferredVoices(tmpVoices)
        onChangePreferredVoices(tmpVoices)
    }

    const clearPreviewAudioObjectUrl = () => {
        if (previewAudioObjectUrlRef.current) {
            URL.revokeObjectURL(previewAudioObjectUrlRef.current)
            previewAudioObjectUrlRef.current = null
        }
    }

    const stopPreview = () => {
        const audio = previewAudioRef.current
        audio?.pause()
        if (audio) {
            audio.removeAttribute('src')
            audio.load()
        }
        clearPreviewAudioObjectUrl()
        setPlayingPreviewKey(null)
    }

    useEffect(() => () => clearPreviewAudioObjectUrl(), [])

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
    }

    const voiceKey = (voice: TtsVoice) => `${voice.engine}-${voice.name}`

    const voiceMatchesFilters = (
        voice: TtsVoice,
        filters: VoiceFilterValues
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
                    : parsed.age == filters.age))
        )
    }

    const hasMatchingVoice = (filters: VoiceFilterValues) =>
        availableVoices.some((voice) => voiceMatchesFilters(voice, filters))

    const selectedFilterValues: VoiceFilterValues = {
        lang,
        engine,
        langcode,
        gender,
        age,
    }

    const matchesName = (voice: TtsVoice, search: string = nameSearch) => {
        const query = search.trim().toLowerCase()
        if (query == '') {
            return true
        }
        return (voicesTransliterations[voice.name] ?? voice.name)
            .toLowerCase()
            .includes(query)
    }

    const sortVoicesByName = (a: TtsVoice, b: TtsVoice) =>
        (voicesTransliterations[a.name] ?? a.name) >
        (voicesTransliterations[b.name] ?? b.name)
            ? 1
            : -1

    const sortedVoicesFor = (
        filters: VoiceFilterValues,
        search: string = nameSearch
    ) =>
        availableVoices
            .filter((voice) => voiceMatchesFilters(voice, filters))
            .filter((voice) => matchesName(voice, search))
            .toSorted(sortVoicesByName)

    const voiceRowsAreSame = (a: TtsVoice[], b: TtsVoice[]) =>
        a.length === b.length &&
        a.every((voice, index) => voiceKey(voice) === voiceKey(b[index]))

    const filterChangePreservesRows = (
        filters: VoiceFilterValues,
        search: string = nameSearch
    ) =>
        voiceRowsAreSame(
            sortedVoicesFor(selectedFilterValues, nameSearch),
            sortedVoicesFor(filters, search)
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
            ...changes,
        }

        if (
            resolved.engine != 'All' &&
            !hasMatchingVoice({
                ...resolved,
                langcode: 'All',
                gender: 'All',
                age: 'All',
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
            })
        ) {
            resolved.langcode = 'All'
        }

        if (
            resolved.gender != 'All' &&
            !hasMatchingVoice({
                ...resolved,
                age: 'All',
            })
        ) {
            resolved.gender = 'All'
        }

        if (resolved.age != 'All' && !hasMatchingVoice(resolved)) {
            resolved.age = 'All'
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
    ]

    const applyFilterValues = (
        filters: VoiceFilterValues,
        search: string = nameSearch
    ) => {
        const preservesRows = filterChangePreservesRows(filters, search)
        setLang(filters.lang)
        setEngine(filters.engine)
        setLangcode(filters.langcode)
        setGender(filters.gender)
        setAge(filters.age)
        if (!preservesRows) {
            setCurrentPage(0)
            stopPreview()
        }
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
    let resetFilters = () => {
        setNameSearch('')
        applyFilterValues(
            {
                lang: 'All',
                engine: 'All',
                langcode: 'All',
                gender: 'All',
                age: 'All',
            },
            ''
        )
    }
    let selectNameSearch = (value: string) => {
        const preservesRows = filterChangePreservesRows(
            selectedFilterValues,
            value
        )
        setNameSearch(value)
        if (!preservesRows) {
            setCurrentPage(0)
            stopPreview()
        }
    }
    let clearNameSearch = () => {
        selectNameSearch('')
        nameSearchInputRef.current?.focus()
    }
    const filtersAreActive =
        lang != 'All' ||
        engine != 'All' ||
        langcode != 'All' ||
        gender != 'All' ||
        age != 'All' ||
        nameSearch.trim() != ''

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
    const sortedMatchingVoices = sortedVoicesFor(selectedFilterValues)
    const matchingVoices = sortedMatchingVoices
    const pageSize = normalizedVoiceTableThreshold
    const pageCount = Math.max(
        1,
        Math.ceil(sortedMatchingVoices.length / pageSize)
    )
    const activePage = Math.min(currentPage, pageCount - 1)
    const pageStart = activePage * pageSize
    const visibleVoices = sortedMatchingVoices.slice(
        pageStart,
        pageStart + pageSize
    )
    const showTableControls = sortedMatchingVoices.length > pageSize
    const firstVisibleVoice =
        sortedMatchingVoices.length === 0 ? 0 : pageStart + 1
    const lastVisibleVoice = Math.min(
        pageStart + visibleVoices.length,
        sortedMatchingVoices.length
    )

    useEffect(() => {
        if (currentPage !== activePage) {
            setCurrentPage(activePage)
        }
    }, [activePage, currentPage])

    useEffect(() => {
        stopPreview()
    }, [customPreviewText])

    const previewUrlForVoice = (voice: TtsVoice) => {
        const previewUrl =
            availableVoices.find(
                (v) => v.engine === voice.engine && v.name === voice.name
            )?.preview ?? voice.preview
        if (!previewUrl) return undefined
        const text = customPreviewText.trim()
        return text.length
            ? `${previewUrl}?text=${encodeURIComponent(text).replaceAll(
                  '%20',
                  '+'
              )}`
            : previewUrl
    }

    const toggleVoicePreview = async (voice: TtsVoice) => {
        const key = voiceKey(voice)
        const audio = previewAudioRef.current
        const previewUrl = previewUrlForVoice(voice)
        if (!audio || !previewUrl) return
        if (playingPreviewKey === key && !audio.paused) {
            stopPreview()
            return
        }
        audio.pause()
        clearPreviewAudioObjectUrl()
        const objectUrl = await fetchVoicePreviewObjectUrl(previewUrl)
        if (!objectUrl) {
            setPlayingPreviewKey(null)
            return
        }
        previewAudioObjectUrlRef.current = objectUrl
        audio.src = objectUrl
        audio.load()
        try {
            await audio.play()
            setPlayingPreviewKey(key)
        } catch {
            stopPreview()
        }
    }
    const commitVoiceTableThreshold = () => {
        const threshold = clampVoiceTableThreshold(voiceTableThresholdInput)
        setVoiceTableThresholdInput(String(threshold))
        setCurrentPage(0)
        stopPreview()
        onChangeVoiceTableThreshold(threshold)
    }

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
                    <label htmlFor="voice-name-search">Search name</label>
                    <div className="voice-name-search-control">
                        <input
                            id="voice-name-search"
                            ref={nameSearchInputRef}
                            type="search"
                            value={nameSearch}
                            onChange={(e) => selectNameSearch(e.target.value)}
                        />
                        <button
                            type="button"
                            className="invisible"
                            onClick={clearNameSearch}
                            disabled={nameSearch == ''}
                            title="Clear text"
                            aria-label="Clear text"
                        >
                            <X width="20" height="20" />
                        </button>
                    </div>
                </div>
                <div className="field voice-filter-actions">
                    <button
                        type="button"
                        onClick={resetFilters}
                        disabled={!filtersAreActive}
                    >
                        Reset filters
                    </button>
                </div>
            </div>
            <div className="field voice-preview-text-control">
                <label htmlFor="voice-preview-text">Custom preview text</label>
                <input
                    id="voice-preview-text"
                    type="text"
                    value={customPreviewText}
                    onChange={(e) => setCustomPreviewText(e.target.value)}
                />
            </div>
            <div className="voice-count-row">
                <p className="voice-count" aria-live="polite">
                    {matchingVoices.length}{' '}
                    {matchingVoices.length === 1 ? 'voice' : 'voices'} match
                </p>
                {showTableControls && (
                    <div
                        className="voice-table-display-control"
                        aria-label="Voice table pages"
                    >
                        <input
                            id="voice-table-threshold"
                            type="number"
                            min="1"
                            max={voiceTableThresholdMax}
                            step="1"
                            value={voiceTableThresholdInput}
                            onChange={(e) =>
                                setVoiceTableThresholdInput(e.target.value)
                            }
                            onBlur={commitVoiceTableThreshold}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    commitVoiceTableThreshold()
                                }
                            }}
                            aria-label="Voices per page"
                        />
                        <label htmlFor="voice-table-threshold">per page</label>
                        <div
                            className="voice-pagination"
                            aria-label="Voice result pages"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.max(0, page - 1)
                                    )
                                }
                                disabled={activePage === 0}
                            >
                                Previous
                            </button>
                            <span aria-live="polite">
                                Page {activePage + 1} of {pageCount}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(pageCount - 1, page + 1)
                                    )
                                }
                                disabled={activePage >= pageCount - 1}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="voice-results" role="region">
                <table>
                    <caption>
                        Matching voices
                        {showTableControls &&
                            `, showing ${firstVisibleVoice}-${lastVisibleVoice} of ${matchingVoices.length}`}
                    </caption>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Engine</th>
                            <th>Dialect</th>
                            <th>Gender</th>
                            <th>Age</th>
                            <th>Preview</th>
                            <th>Add</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleVoices.length === 0 && (
                            <tr>
                                <td colSpan={7}>No matching voices.</td>
                            </tr>
                        )}
                        {visibleVoices.map((voice) => {
                            const parsed = parseGenderAge(voice.gender)
                            const voiceName =
                                voicesTransliterations[voice.name] ?? voice.name
                            const key = voiceKey(voice)
                            const previewIsPlaying = playingPreviewKey === key
                            const previewUrl = previewUrlForVoice(voice)
                            const alreadyPreferred =
                                preferredVoices.find(
                                    (v) =>
                                        v.engine === voice.engine &&
                                        v.name === voice.name
                                ) !== undefined
                            return (
                                <tr key={`voice-row-${key}`}>
                                    <th>{voiceName}</th>
                                    <td>
                                        {ttsEnginesStates[voice.engine]?.name ??
                                            voice.engine}
                                    </td>
                                    <td>{languageNames.of(voice.lang)}</td>
                                    <td>
                                        {formatGenderAgePart(parsed.gender)}
                                    </td>
                                    <td>{formatGenderAgePart(parsed.age)}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className="invisible"
                                            onClick={() =>
                                                toggleVoicePreview(voice)
                                            }
                                            disabled={!previewUrl}
                                            aria-label={`${
                                                previewIsPlaying
                                                    ? 'Pause preview'
                                                    : 'Preview'
                                            } for ${voiceName}`}
                                        >
                                            {previewIsPlaying ? (
                                                <PauseIcon
                                                    width="20"
                                                    height="20"
                                                />
                                            ) : (
                                                <PlayIcon
                                                    width="20"
                                                    height="20"
                                                />
                                            )}
                                        </button>
                                    </td>
                                    <td>
                                        {alreadyPreferred ? (
                                            <span>Added</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addToPreferredVoices(voice)
                                                }
                                            >
                                                Add
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <audio ref={previewAudioRef} onEnded={stopPreview} />
            </div>
        </>
    )
}
