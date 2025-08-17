import { JobStatus } from 'shared/types'

/*
A few simple icons
*/
export function X({ width, height }) {
    return (
        <svg
            role="presentation"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    )
}

export function Plus({ width, height }) {
    return (
        <svg
            role="presentation"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}

export function Minus({ width, height }) {
    return (
        <svg
            role="presentation"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    )
}

export function Copy({ width, height }) {
    return (
        <svg
            role="presentation"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
    )
}

export function Up({ width, height }) {
    return (
        <svg
            role="presentation"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
    )
}

export function Down({ width, height }) {
    return (
        <svg
            role="presentation"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
    )
}
export function Failed({ width, height }) {
    return (
        <svg width={width} height={height} viewBox="0 -8 528 528">
            <title>Failed</title>
            <path d="M264 456Q210 456 164 429 118 402 91 356 64 310 64 256 64 202 91 156 118 110 164 83 210 56 264 56 318 56 364 83 410 110 437 156 464 202 464 256 464 310 437 356 410 402 364 429 318 456 264 456ZM264 288L328 352 360 320 296 256 360 192 328 160 264 224 200 160 168 192 232 256 168 320 200 352 264 288Z" />
        </svg>
    )
}
export function Idle({ width, height }) {
    return (
        <svg width={width} height={height} viewBox="-16 0 512 512">
            <title>Queued</title>
            <path d="M240 432Q192 432 152 409 111 385 88 345 64 304 64 256 64 208 88 168 111 127 152 104 192 80 240 80 288 80 329 104 369 127 393 168 416 208 416 256 416 304 393 345 369 385 329 409 288 432 240 432ZM352 280L352 232 264 232 264 144 216 144 216 280 352 280Z" />
        </svg>
    )
}
export function Running({ width, height }) {
    return (
        <svg width={width} height={height} viewBox="0 0 100 100">
            <title>Running</title>
            <path d="M 50 96 a 46 46 0 0 1 0 -92 46 46 0 0 1 0 92" />
        </svg>
    )
}
export function Success({ width, height }) {
    return (
        <svg width={width} height={height} viewBox="0 0 1920 1920">
            <title>Completed</title>
            <path
                d="M960 1807.059c-467.125 0-847.059-379.934-847.059-847.059 0-467.125 379.934-847.059 847.059-847.059 467.125 0 847.059 379.934 847.059 847.059 0 467.125-379.934 847.059-847.059 847.059M960 0C430.645 0 0 430.645 0 960s430.645 960 960 960 960-430.645 960-960S1489.355 0 960 0M854.344 1157.975 583.059 886.69l-79.85 79.85 351.135 351.133L1454.4 717.617l-79.85-79.85-520.206 520.208Z"
                fillRule="evenodd"
            />
        </svg>
    )
}
export function JobStatusIcon(status: JobStatus, { width, height }) {
    if (status == JobStatus.ERROR || status == JobStatus.FAIL) {
        return Failed({ width, height })
    }
    if (status == JobStatus.IDLE) {
        return Idle({ width, height })
    }
    if (status == JobStatus.RUNNING) {
        return Running({ width, height })
    }
    if (status == JobStatus.SUCCESS) {
        return Success({ width, height })
    }
}

export function TTSEngineStatusIcon(status: string, {width, height}) {
    if (status == 'available') {
        return Success({width, height})
    }
    else if (status == 'disabled') {
        return Failed({width, height})
    }
    else {
        return <></>
    }
}