import { AboutView } from 'renderer/components/AboutView'

export function AboutScreen() {
    // TODO get this info dynamically
    return (
        <AboutView
            title="DAISY Pipeline (2023)"
            version="1.0.0-RC2"
            engineVersion="1.14.11"
        />
    )
}
