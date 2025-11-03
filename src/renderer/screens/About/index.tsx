//@ts-ignore
import { AboutView } from 'renderer/components/Views/AboutView'
import { useWindowStore } from 'renderer/store'
import { loadStyleProperties } from 'renderer/utils'

export function AboutScreen() {
    const { pipeline, settings } = useWindowStore()
    loadStyleProperties(settings)

    return <AboutView title="About" />
}
