export async function fetchVoicePreviewObjectUrl(previewUrl: string) {
    const preview = await window.App.fetchVoicePreview(previewUrl)
    if (!preview?.ok || !preview.audio) {
        console.error(
            'fetchVoicePreviewObjectUrl: preview fetch failed',
            previewUrl,
            !preview?.ok ? preview?.error : 'empty audio buffer'
        )
        return null
    }

    const blob = new Blob([preview.audio], {
        type: preview.contentType ?? 'audio/wav',
    })
    return URL.createObjectURL(blob)
}
