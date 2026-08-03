import {
    DEFAULT_SPONSORSHIP_MESSAGE,
    parseSponsorshipMessage,
    SPONSORSHIP_DATA_URL,
    SponsorshipMessage,
} from 'shared/constants'
import { oneTimeFetch } from './ipcs/one-time-fetch'

let cachedSponsorshipMessage: SponsorshipMessage | null = null

export async function getSponsorshipMessage(): Promise<SponsorshipMessage> {
    if (cachedSponsorshipMessage) return cachedSponsorshipMessage

    try {
        const data = await oneTimeFetch(SPONSORSHIP_DATA_URL)
        if (data) {
            cachedSponsorshipMessage = parseSponsorshipMessage(data)
            return cachedSponsorshipMessage
        }
    } catch (err) {
        // Fall back to the bundled sponsorship link if the remote message
        // cannot be fetched or parsed.
    }

    return DEFAULT_SPONSORSHIP_MESSAGE
}
