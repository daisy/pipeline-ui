import { Message } from 'shared/types'
import { JobMessages } from './job-data'

// Track the newest message sequence so the message socket can resume on reconnect.
export const maxMessageSequence = (
    messages: JobMessages,
    currentMax: number | undefined
) => {
    let maxSequence = currentMax
    messages?.forEach((message) => {
        if (
            Number.isFinite(message.sequence) &&
            (maxSequence === undefined || message.sequence > maxSequence)
        ) {
            maxSequence = message.sequence
        }
        maxSequence = maxMessageSequence(message.messages, maxSequence)
    })
    return maxSequence
}

// Merge new websocket messages and REST snapshots by sequence without losing nested messages.
export const mergeMessages = (
    existingMessages: JobMessages = [],
    incomingMessages: JobMessages = []
) => {
    // Clone first so merge operations do not mutate Redux-owned objects.
    const cloneMessage = (message: Message): Message => ({
        ...message,
        messages: message.messages?.map(cloneMessage),
    })
    const mergedMessages = existingMessages.map(cloneMessage)
    const bySequence = new Map<number, Message>()
    // Index nested messages so incoming updates can replace the right node.
    const indexMessages = (messages: Message[] = []) => {
        messages.forEach((message) => {
            if (Number.isFinite(message.sequence)) {
                bySequence.set(message.sequence, message)
            }
            indexMessages(message.messages)
        })
    }
    // Preserve existing children unless the incoming message includes children.
    const mergeMessage = (target: Message, source: Message) => {
        const mergedChildren =
            source.messages && source.messages.length > 0
                ? mergeMessages(target.messages, source.messages)
                : target.messages
        Object.assign(target, source, {
            ...(mergedChildren ? { messages: mergedChildren } : {}),
        })
    }
    // Add unseen messages at the current level, then index them for later updates.
    const mergeIncoming = (messages: Message[] = []) => {
        messages.forEach((message) => {
            const existingMessage = bySequence.get(message.sequence)
            if (existingMessage) {
                mergeMessage(existingMessage, message)
            } else {
                const clonedMessage = cloneMessage(message)
                mergedMessages.push(clonedMessage)
                indexMessages([clonedMessage])
            }
        })
    }
    indexMessages(mergedMessages)
    mergeIncoming(incomingMessages)
    return mergedMessages.sort((a, b) => a.sequence - b.sequence)
}
