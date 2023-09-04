/*
Select a script and submit a new job
*/
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'
import { Down, Up } from '../SvgIcons'


export function TtsConfigPane({
    availableVoices,
    userPreferredVoices,
    onChangePreferredVoices,
}) {
    const { pipeline } = useWindowStore()
    // todo this data will come from the API
    const [voiceList] = useState([...availableVoices])
    const [preferredVoices, setPreferredVoices] = useState([
        ...userPreferredVoices,
    ])

    let changePreferredVoices = (e, voice: TtsVoice) => {
        if (e.target.checked) {
            let tmpVoices = [...preferredVoices, voice]
            setPreferredVoices(tmpVoices)
            onChangePreferredVoices(tmpVoices)
        } else {
            let tmpVoices = [...preferredVoices]
            let idx = tmpVoices.findIndex((v) => v.id == voice.id)
            tmpVoices.splice(idx, 1)
            setPreferredVoices(tmpVoices)
            onChangePreferredVoices(tmpVoices)
        }
    }
    // let moveVoice = (currPos, newPos) => {
    //     console.log('Move', currPos, newPos)
    //     let tmpVoices = [...voiceList]
    //     let item = tmpVoices.splice(currPos, 1)[0]
    //     tmpVoices.splice(newPos, 0, item)
    //     setVoiceList(tmpVoices)
    // }

    return (
        <>
            <div>
                <p id="available-voices-label" className="label">
                    <b>Text-to-speech voices:</b>
                </p>
                <table aria-labelledby="available-voices-label">
                    <thead>
                        <tr>
                            <th>Prefer</th>
                            <th>Name</th>
                            <th>Engine</th>
                            <th>Language</th>
                            <th>Gender</th>
                            {/* <th>Move</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {voiceList.map((v, idx) => {
                            let checked =
                                preferredVoices.findIndex(
                                    // @ts-ignore
                                    (vx) => vx.id == v.id
                                ) != -1

                            return (
                                <tr key={idx}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            onChange={(e) =>
                                                changePreferredVoices(e, v)
                                            }
                                            title={`Select ${v.name}`}
                                            checked={checked}
                                        />
                                    </td>
                                    <td>{v.name}</td>
                                    <td>{v.engine}</td>
                                    <td>{v.lang}</td>
                                    <td>{v.gender}</td>
                                    {/* <td>
                                    {idx > 0 ? (
                                        <button
                                            className="voice-up"
                                            onClick={(e) =>
                                                moveVoice(idx, idx - 1)
                                            }
                                            title="Move up"
                                        >
                                            <Up width="12" height="12" />
                                        </button>
                                    ) : (
                                        ''
                                    )}
                                    {idx < voiceList.length - 1 ? (
                                        <button
                                            className="voice-down"
                                            onClick={(e) =>
                                                moveVoice(idx, idx + 1)
                                            }
                                            title="Move down"
                                        >
                                            <Down width="12" height="12" />
                                        </button>
                                    ) : (
                                        ''
                                    )}
                                </td> */}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </>
    )
}
