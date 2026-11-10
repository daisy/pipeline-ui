/*
Split button to copy a job as a dp2 command line (issue #418).
The main button runs the last-used choice; the arrow opens a menu to pick
"with endpoint" or "without endpoint". The choice is remembered for next time.
*/
import { useEffect, useId, useRef, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { Job } from 'shared/types'
import { buildCliCommand } from 'shared/cliCommand'
import { ChevronDown } from '../../../Widgets/SvgIcons'

const { App } = window

type CopyMode = 'with-endpoint' | 'without-endpoint'

const STORAGE_KEY = 'copyCliCommandMode'

const MODES: Array<{ mode: CopyMode; label: string; description: string }> = [
    {
        mode: 'with-endpoint',
        label: 'Copy as command line with endpoint',
        description:
            'Includes --host, --port and --ws_path for the engine this app is using',
    },
    {
        mode: 'without-endpoint',
        label: 'Copy as command line',
        description: 'Uses the dp2 default configuration to find the engine',
    },
]

function loadMode(): CopyMode {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (MODES.some((m) => m.mode === saved)) return saved as CopyMode
    } catch (e) {}
    return 'with-endpoint'
}

function saveMode(mode: CopyMode) {
    try {
        window.localStorage.setItem(STORAGE_KEY, mode)
    } catch (e) {}
}

export function CopyCliButton({ job }: { job: Job }) {
    const { pipeline, settings } = useWindowStore()
    const [mode, setMode] = useState<CopyMode>(loadMode)
    const [menuOpen, setMenuOpen] = useState(false)
    // status text for the live region; the counter makes repeated copies
    // re-announce even when the text is the same
    const [status, setStatus] = useState<{ text: string; n: number }>({
        text: '',
        n: 0,
    })
    const menuId = useId()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const arrowRef = useRef<HTMLButtonElement>(null)
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

    useEffect(() => {
        if (!status.text) return
        let timer = setTimeout(
            () => setStatus((s) => ({ ...s, text: '' })),
            2000
        )
        return () => clearTimeout(timer)
    }, [status])

    const announce = (text: string) =>
        setStatus((s) => ({ text, n: s.n + 1 }))

    // close the menu when clicking or focusing outside of it
    useEffect(() => {
        if (!menuOpen) return
        const onOutside = (e: Event) => {
            if (!wrapperRef.current?.contains(e.target as Node)) {
                setMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', onOutside)
        document.addEventListener('focusin', onOutside)
        return () => {
            document.removeEventListener('mousedown', onOutside)
            document.removeEventListener('focusin', onOutside)
        }
    }, [menuOpen])

    const openMenu = (focusIndex?: number) => {
        setMenuOpen(true)
        const idx = focusIndex ?? MODES.findIndex((m) => m.mode === mode)
        // focus once the menu is rendered
        setTimeout(() => itemRefs.current[idx]?.focus(), 0)
    }

    const closeMenu = (returnFocus = true) => {
        setMenuOpen(false)
        if (returnFocus) arrowRef.current?.focus()
    }

    const copy = async (copyMode: CopyMode) => {
        try {
            const command = await buildCliCommand({
            script: job.script,
            jobRequest: job.jobRequest,
            stylesheetParameters: job.stylesheetParameters,
            webservice:
                copyMode === 'with-endpoint' ? pipeline.webservice : undefined,
            outputFolder:
                job.jobData?.downloadedFolder ?? settings?.downloadFolder,
            toPath: (url) => App.fileURLToPath(url),
            windows: navigator.userAgent.includes('Windows'),
            })
            App.copyToClipboard(command)
            announce('Copied!')
        } catch (e) {
            console.error('Could not build the command line', e)
            announce('Could not copy the command line')
        }
    }

    const choose = (copyMode: CopyMode) => {
        setMode(copyMode)
        saveMode(copyMode)
        closeMenu()
        copy(copyMode)
    }

    const onMenuKeyDown = (e: React.KeyboardEvent) => {
        const current = itemRefs.current.findIndex(
            (el) => el === document.activeElement
        )
        let next = -1
        if (e.key === 'ArrowDown') next = (current + 1) % MODES.length
        else if (e.key === 'ArrowUp')
            next = (current - 1 + MODES.length) % MODES.length
        else if (e.key === 'Home') next = 0
        else if (e.key === 'End') next = MODES.length - 1
        else if (e.key === 'Escape') {
            e.preventDefault()
            e.stopPropagation()
            closeMenu()
            return
        } else if (e.key === 'Tab') {
            closeMenu(false)
            return
        }
        if (next >= 0) {
            e.preventDefault()
            itemRefs.current[next]?.focus()
        }
    }

    const current = MODES.find((m) => m.mode === mode)

    return (
        <div className="copy-cli" ref={wrapperRef}>
            <div className="split-button">
                <button
                    type="button"
                    className="split-button-main"
                    title={current.description}
                    onClick={() => copy(mode)}
                >
                    {current.label}
                </button>
                <button
                    type="button"
                    className="split-button-arrow"
                    ref={arrowRef}
                    aria-label="More copy options"
                    title="More copy options"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-controls={menuOpen ? menuId : undefined}
                    onClick={() => (menuOpen ? closeMenu() : openMenu())}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            openMenu(0)
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            openMenu(MODES.length - 1)
                        }
                    }}
                >
                    <ChevronDown width="16" height="16" />
                </button>
                {menuOpen && (
                    <div
                        id={menuId}
                        className="split-button-menu"
                        role="menu"
                        aria-label="Copy options"
                        onKeyDown={onMenuKeyDown}
                    >
                        {MODES.map((m, idx) => (
                            <button
                                key={m.mode}
                                type="button"
                                role="menuitemradio"
                                aria-checked={m.mode === mode}
                                aria-labelledby={`${menuId}-${m.mode}-label`}
                                aria-describedby={`${menuId}-${m.mode}-desc`}
                                tabIndex={-1}
                                ref={(el) => {
                                    itemRefs.current[idx] = el
                                }}
                                onClick={() => choose(m.mode)}
                            >
                                <span
                                    className="label"
                                    id={`${menuId}-${m.mode}-label`}
                                >
                                    {m.label}
                                </span>
                                <small id={`${menuId}-${m.mode}-desc`}>
                                    {m.description}
                                </small>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* always rendered so screen readers pick up changes to it */}
            <small
                className={`copied-message${
                    status.text.startsWith('Could not') ? ' error' : ''
                }`}
                role="status"
                aria-live="polite"
            >
                {status.text && <span key={status.n}>{status.text}</span>}
            </small>
        </div>
    )
}
