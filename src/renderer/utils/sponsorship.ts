const { App } = window

// default message
let defaultSponsorshipMessage = {
    active: true,
    buttonText: 'Support our work',
    messageText:
        'If you find this tool useful, please help us by donating to support its ongoing maintenance.',
    url: 'https://daisy.org/pipelineappSponsor',
}

async function updateSponsorshipMessage() {
    // fetch the latest sponsorship message
    try {
        let sponsorshipData = await App.oneTimeFetch(
            'https://dl.daisy.org/tools/sponsorship.json'
        )
        if (sponsorshipData) {
            return sponsorshipData['PipelineApp']['en']
        } else {
            return defaultSponsorshipMessage
        }
    } catch (err) {
        return defaultSponsorshipMessage
    }
}
export { defaultSponsorshipMessage, updateSponsorshipMessage }
