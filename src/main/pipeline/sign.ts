import { createHmac, randomInt } from 'crypto'

const pipelineAuthParams = ['authid', 'time', 'nonce', 'sign']

export function createPipelineAuthNonce(): string {
    let nonce = ''
    for (let i = 0; i < 20; i++) {
        nonce += randomInt(0, 10).toString()
    }
    return nonce
}

export function signPipelineUrl(
    url: string,
    authId: string,
    secret: string,
    now = new Date(),
    nonce = createPipelineAuthNonce()
): string {
    const signedUrl = new URL(url)

    pipelineAuthParams.forEach((param) => signedUrl.searchParams.delete(param))
    signedUrl.searchParams.append('authid', authId)
    signedUrl.searchParams.append('time', now.toISOString())
    signedUrl.searchParams.append('nonce', nonce)

    const signature = createHmac('sha1', secret)
        .update(signedUrl.toString())
        .digest('base64')
    signedUrl.searchParams.append('sign', signature)

    return signedUrl.toString()
}
