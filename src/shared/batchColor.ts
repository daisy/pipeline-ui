import type { Job } from './types'

export const BATCH_COLOR_COUNT = 6

export function getBatchColorIndex(
    batchId: string,
    jobs: Job[],
    paletteSize = BATCH_COLOR_COUNT
): number {
    const safePaletteSize = Math.max(1, paletteSize)
    const orderedBatchIds: string[] = []

    for (const job of jobs) {
        const id = job.jobRequest?.batchId
        if (id && !orderedBatchIds.includes(id)) {
            orderedBatchIds.push(id)
        }
    }

    const batchIndex = orderedBatchIds.indexOf(batchId)
    return (
        (batchIndex >= 0 ? batchIndex : orderedBatchIds.length) %
        safePaletteSize
    )
}
