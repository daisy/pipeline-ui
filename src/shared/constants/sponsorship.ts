export type SponsorshipMessage = {
    active: boolean
    buttonText: string
    messageText: string
    url: string
}

export const SPONSORSHIP_URL = 'https://daisy.org/pipelineappSponsor'
export const SPONSORSHIP_DATA_URL =
    'https://dl.daisy.org/tools/sponsorship.json'

export const DEFAULT_SPONSORSHIP_MESSAGE: SponsorshipMessage = {
    active: true,
    buttonText: 'Support our work',
    messageText:
        'If you find this tool useful, please help us by donating to support its ongoing maintenance.',
    url: SPONSORSHIP_URL,
}

export function parseSponsorshipMessage(data: string): SponsorshipMessage {
    const sponsorshipData = JSON.parse(data)
    return {
        ...DEFAULT_SPONSORSHIP_MESSAGE,
        ...sponsorshipData['PipelineApp']['en'],
    }
}
