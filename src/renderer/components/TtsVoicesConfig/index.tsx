/*
Select a script and submit a new job
*/
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'
import { Down, Up } from '../SvgIcons'

/**
 * Voices transliterations test for issue #231
 */
const voicesTransliterations = {
    云登: '云登 (Yunden)',
    晓北: '晓北 (Xiaobei)',
    晓妮: '晓妮 (Xiaoni)',
    云翔: '云翔 (Yunxiang)',
    '云希 四川': '云希 四川 (Yunxi Sichuan)',
    መቅደስ: 'መቅደስ (Mekdes)',
    አምሀ: 'አምሀ (Amha)',
    فاطمة: 'فاطمة (Fatima)',
    حمدان: 'حمدان (Hamdan)',
    ليلى: 'ليلى (Leila)',
    علي: 'علي (Ali)',
    أمينة: 'أمينة (Amina)',
    إسماعيل: 'إسماعيل (Ismail)',
    سلمى: 'سلمى (Salma)',
    شاكر: 'شاكر (Shaker)',
    رنا: 'رنا (Rana)',
    باسل: 'باسل (Basel)',
    سناء: 'سناء (Sanaa)',
    تيم: 'تيم (Tim)',
    نورا: 'نورا (Nora)',
    فهد: 'فهد (Fahd)',
    رامي: 'رامي (Rami)',
    إيمان: 'إيمان (Iman)',
    أحمد: 'أحمد (Ahmed)',
    منى: 'منى (Mona)',
    جمال: 'جمال (Jamal)',
    عائشة: 'عائشة (Aisha)',
    عبدالله: 'عبدالله (Abdullah)',
    أمل: 'أمل (Amal)',
    معاذ: 'معاذ (Muadh)',
    زارية: 'زارية (Zaria)',
    حامد: 'حامد (Hamed)',
    أماني: 'أماني (Amani)',
    ليث: 'ليث (Laith)',
    ريم: 'ريم (Reem)',
    هادي: 'هادي (Hadi)',
    مريم: 'مريم (Maryam)',
    صالح: 'صالح (Saleh)',
    Babək: 'Babək (Babek)',
    Калина: 'Калина (Kalina)',
    Борислав: 'Борислав (Borislav)',
    নবনীতা: 'নবনীতা (Nabonita)',
    প্রদ্বীপ: 'প্রদ্বীপ (Pradip)',
    তানিশা: 'তানিশা (Tanisha)',
    ভাস্কর: 'ভাস্কর (Bhaskar)',
    Antonín: 'Antonín (Antonin)',
    Αθηνά: 'Αθηνά (Athina)',
    Νέστορας: 'Νέστορας (Nestoras)',
    //María: 'María (Maria)',
    //Álvaro: 'Álvaro (Alvaro)',
    //Andrés: 'Andrés (Andres)',
    //Víctor: 'Víctor (Victor)',
    //Sebastián: 'Sebastián (Sebastian)',
    دلارا: 'دلارا (Delara)',
    فرید: 'فرید (Farid)',
    //'Rémy Multilingue': 'Rémy Multilingue (Remy Multilingual)',
    ધ્વની: 'ધ્વની (Dhvani)',
    નિરંજન: 'નિરંજન (Niranjan)',
    הילה: 'הילה (Hila)',
    אברי: 'אברי (Avri)',
    स्वरा: 'स्वरा (Swara)',
    मधुर: 'मधुर (Madhur)',
    Srećko: 'Srećko (Srecko)',
    Noémi: 'Noémi (Noemi)',
    Tamás: 'Tamás (Tamas)',
    Անահիտ: 'Անահիտ (Anahit)',
    Հայկ: 'Հայկ (Hayk)',
    Guðrún: 'Guðrún (Gudrun)',
    七海: '七海 (Nanami)',
    圭太: '圭太 (Keita)',
    碧衣: '碧衣 (Aoi)',
    大智: '大智 (Daichi)',
    真夕: '真夕 (Mayu)',
    直紀: '直紀 (Naoki)',
    志織: '志織 (Shiori)',
    ეკა: 'ეკა (Eka)',
    გიორგი: 'გიორგი (Giorgi)',
    Айгүл: 'Айгүл (Aigul)',
    Дәулет: 'Дәулет (Daulet)',
    ស្រីមុំ: 'ស្រីមុំ (Srey Mom)',
    ពិសិដ្ឋ: 'ពិសិដ្ឋ (Piseth)',
    ಸಪ್ನಾ: 'ಸಪ್ನಾ (Sapna)',
    ಗಗನ್: 'ಗಗನ್ (Gagan)',
    선히: '선히 (Seonhee)',
    인준: '인준 (Injun)',
    봉진: '봉진 (Bongjin)',
    국민: '국민 (Gukmin)',
    현수: '현수 (Hyunsoo)',
    지민: '지민 (Jimin)',
    서현: '서현 (Seohyun)',
    순복: '순복 (Sunbok)',
    유진: '유진 (Yujin)',
    ແກ້ວມະນີ: 'ແກ້ວມະນີ (Kaewmanee)',
    ຈັນທະວົງ: 'ຈັນທະວົງ (Chanthavong)',
    Марија: 'Марија (Marija)',
    Александар: 'Александар (Aleksandar)',
    ശോഭന: 'ശോഭന (Shobhana)',
    മിഥുൻ: 'മിഥുൻ (Mithun)',
    Есүй: 'Есүй (Yesui)',
    Батаа: 'Батаа (Bataa)',
    आरोही: 'आरोही (Aarohi)',
    मनोहर: 'मनोहर (Manohar)',
    နီလာ: 'နီလာ (Nila)',
    သီဟ: 'သီဟ (Thiha)',
    हेमकला: 'हेमकला (Hemkala)',
    सागर: 'सागर (Sagar)',
    لطيفه: 'لطيفه (Latifa)',
    ' ګل نواز': 'ګل نواز (Gul Nawaz)',
    //Antônio: 'Antônio (Antonio)',
    Светлана: 'Светлана (Svetlana)',
    Дмитрий: 'Дмитрий (Dmitry)',
    Дария: 'Дария (Daria)',
    තිළිණි: 'තිළිණි (Thilini)',
    සමීර: 'සමීර (Sameera)',
    //Viktória: 'Viktória (Viktoria)',
    //Lukáš: 'Lukáš (Lukas)',
    Софија: 'Софија (Sofija)',
    Никола: 'Никола (Nikola)',
    பல்லவி: 'பல்லவி (Pallavi)',
    வள்ளுவர்: 'வள்ளுவர் (Valluvar)',
    சரண்யா: 'சரண்யா (Saranya)',
    குமார்: 'குமார் (Kumar)',
    கனி: 'கனி (Kani)',
    சூர்யா: 'சூர்யா (Surya)',
    வெண்பா: 'வெண்பா (Venba)',
    அன்பு: 'அன்பு (Anbu)',
    శ్రుతి: 'శ్రుతి (Shruti)',
    మోహన్: 'మోహన్ (Mohan)',
    เปรมวดี: 'เปรมวดี (Premwadee)',
    นิวัฒน์: 'นิวัฒน์ (Niwat)',
    อัจฉรา: 'อัจฉรา (Atchara)',
    Поліна: 'Поліна (Polina)',
    Остап: 'Остап (Ostap)',
    گل: 'گل (Gul)',
    سلمان: 'سلمان (Salman)',
    عظمیٰ: 'عظمیٰ (Uzma)',
    اسد: 'اسد (Asad)',
    //'Hoài My': 'Hoài My (Hoai My)',
    晓彤: '晓彤 (Xiaotong)',
    云哲: '云哲 (Yunzhe)',
    晓敏: '晓敏 (Xiaomin)',
    云松: '云松 (Yunsong)',
    晓晓: '晓晓 (Xiaoxiao)',
    云希: '云希 (Yunxi)',
    云健: '云健 (Yunjian)',
    晓伊: '晓伊 (Xiaoyi)',
    云扬: '云扬 (Yunyang)',
    晓辰: '晓辰 (Xiaochen)',
    '晓辰 多语言': '晓辰 多语言 (Xiaochen Multilingual)',
    晓涵: '晓涵 (Xiaohan)',
    晓梦: '晓梦 (Xiaomeng)',
    晓墨: '晓墨 (Xiaomo)',
    晓秋: '晓秋 (Xiaoqiu)',
    晓柔: '晓柔 (Xiaorou)',
    晓睿: '晓睿 (Xiaorui)',
    晓双: '晓双 (Xiaoshuang)',
    '晓晓 方言': '晓晓 方言 (Xiaoxiao Dialect)',
    '晓晓 多语言': '晓晓 多语言 (Xiaoxiao Multilingual)',
    晓颜: '晓颜 (Xiaoyan)',
    晓悠: '晓悠 (Xiaoyou)',
    '晓宇 多语言': '晓宇 多语言 (Xiaoyu Multilingual)',
    晓甄: '晓甄 (Xiaozhen)',
    云枫: '云枫 (Yunfeng)',
    云皓: '云皓 (Yunhao)',
    云杰: '云杰 (Yunjie)',
    云夏: '云夏 (Yunxia)',
    云野: '云野 (Yunye)',
    '云逸 多语言': '云逸 多语言 (Yuni Multilingual)',
    云泽: '云泽 (Yunze)',
    晓萱: '晓萱 (Xiaoxuan)',
    曉曼: '曉曼 (Xiaoman)',
    雲龍: '雲龍 (Yunlong)',
    曉佳: '曉佳 (Xiaoji)',
    曉臻: '曉臻 (Xiaozhen)',
    雲哲: '雲哲 (Yunzhe)',
    曉雨: '曉雨 (Xiaoy)',
}

export function TtsVoicesConfigPane({
    availableVoices,
    userPreferredVoices,
    userDefaultVoices,
    onChangePreferredVoices,
    onChangeDefaultVoices,
}) {
    const [preferredVoices, setPreferredVoices] = useState([
        ...userPreferredVoices,
    ])
    const [defaultVoices, setDefaultVoices] = useState([...userDefaultVoices])
    // filter selections
    const [engine, setEngine] = useState('All')
    const [lang, setLang] = useState('All')
    const [langcode, setLangcode] = useState('All')
    const [gender, setGender] = useState('All')
    const [voiceId, setVoiceId] = useState('None')
    const [preferredVoicesLanguage, setPreferredVoicesLanguage] =
        useState('All')

    let languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

    let addToPreferredVoices = (voice: TtsVoice) => {
        let tmpVoices = [...preferredVoices, voice]
        setPreferredVoices(tmpVoices)
        onChangePreferredVoices(tmpVoices)
    }

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

    let selectLanguage = (e) => {
        setLang(e.target.value)
        setEngine('All')
        setLangcode('All')
        setGender('All')
        setVoiceId('None')
    }
    let selectEngine = (e) => {
        setEngine(e.target.value)
        setLangcode('All')
        setGender('All')
        setVoiceId('None')
    }
    let selectLangcode = (e) => {
        setLangcode(e.target.value)
        setGender('All')
        setVoiceId('None')
    }
    let selectGender = (e) => {
        setGender(e.target.value)
        setVoiceId('None')
    }
    let selectVoice = (e) => {
        setVoiceId(e.target.value)
    }
    let selectPreferredVoicesLanguage = (e) => {
        setPreferredVoicesLanguage(e.target.value)
    }
    let selectDefault = (e, voice) => {
        console.log('select default', e, voice)
        let tmpVoices = [...defaultVoices]
        let oldDefaultIdx = tmpVoices.findIndex(
            (vx) => getLang(vx.lang) == getLang(voice.lang)
        )
        if (oldDefaultIdx != -1) {
            console.log(getLang(voice.lang), ' has default already')
            tmpVoices.splice(oldDefaultIdx, 1)
        }
        tmpVoices.push(voice)
        setDefaultVoices(tmpVoices)
        onChangeDefaultVoices(tmpVoices)
    }
    let clearDefaultVoice = (langCode) => {
        console.log('clear default', langCode)
        let tmpVoices = [...defaultVoices]
        let oldDefaultIdx = tmpVoices.findIndex(
            (vx) => getLang(vx.lang) == langCode
        )
        if (oldDefaultIdx != -1) {
            console.log('found at ', oldDefaultIdx)
            tmpVoices.splice(oldDefaultIdx, 1)
            setDefaultVoices(tmpVoices)
            onChangeDefaultVoices(tmpVoices)
        } else {
            console.log('not found')
        }
    }
    let preferredRowLength = userPreferredVoices.filter((v) => {
        if (preferredVoicesLanguage == 'All') {
            return true
        } else {
            return getLang(v.lang) == preferredVoicesLanguage
        }
    }).length

    return (
        <>
            <div>
                <p id="available-voices-label" className="label">
                    <b>Text-to-speech voices</b>
                </p>
            </div>

            <div className="voice-filters">
                <div>
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
                <div>
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
                                    {engine.charAt(0).toUpperCase() +
                                        engine.substring(1)}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
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
                <div>
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
                <div>
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
                        <p>
                            <b>Selected</b>: "
                            {availableVoices.find((v) => v.id == voiceId).name}
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
                        {preferredVoices.find((v) => v.id == voiceId) ? (
                            <p>
                                <i>This voice is already in your list.</i>
                            </p>
                        ) : (
                            <button
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
            <div className="preferred-voices">
                <p id="preferred-table-title">
                    View
                    <select onChange={(e) => selectPreferredVoicesLanguage(e)}>
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                userPreferredVoices.map((v) => getLang(v.lang))
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
                                        <td>{v.name}</td>
                                        <td>{v.engine}</td>
                                        <td>{languageNames.of(v.lang)}</td>
                                        <td>{v.gender}</td>
                                        <td className="actions">
                                            <div>
                                                <label htmlFor={`cb-${v.id}`}>
                                                    Default for{' '}
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
                                                        defaultVoices.find(
                                                            (vx) =>
                                                                vx.id == v.id
                                                        ) != undefined
                                                    }
                                                ></input>
                                            </div>
                                            <button
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
            </div>
        </>
    )
}
