export async function fetchVoicePreviewObjectUrl(previewUrl: string) {
    const preview = await window.App.fetchVoicePreview(previewUrl)
    if (!preview?.ok || !preview.audio) return null

    const blob = new Blob([preview.audio], {
        type: preview.contentType ?? 'audio/wav',
    })
    return URL.createObjectURL(blob)
}
