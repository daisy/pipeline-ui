import {
    DEFAULT_SPONSORSHIP_MESSAGE,
    parseSponsorshipMessage,
    SPONSORSHIP_DATA_URL,
} from 'shared/constants'

const { App } = window

let defaultSponsorshipMessage = DEFAULT_SPONSORSHIP_MESSAGE

async function updateSponsorshipMessage() {
    // fetch the latest sponsorship message
    try {
        let data = await App.oneTimeFetch(SPONSORSHIP_DATA_URL)
        if (data) {
            return parseSponsorshipMessage(data)
        } else {
            return defaultSponsorshipMessage
        }
    } catch (err) {
        return defaultSponsorshipMessage
    }
}
export { defaultSponsorshipMessage, updateSponsorshipMessage }
