export enum SettingsMenuItem {
    General = '/general',
    Appearance = '/appearance',
    ExternalServices = '/external-services',
    TTSBrowseVoices = '/browse-voices',
    TTSPreferredVoices = '/preferred-voices',
    TTSEngines = '/engines',
    TTSMoreOptions = '/more-options',
}

export const SettingsMenuItems = Object.values(SettingsMenuItem).filter(
    (item) => typeof item === 'string'
)
