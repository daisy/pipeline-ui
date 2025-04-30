const { App } = window

interface FileLinkProps {
    fileHref: string
    children?: React.ReactNode
}
/*
Wrap a local or remote file reference in a link element
Click to open in finder or browser
*/
export function FileLink({ fileHref, children }: FileLinkProps) {
    let filename = fileHref ? fileHref.slice(fileHref.lastIndexOf('/') + 1) : ''

    let onClick = async (e) => {
        e.preventDefault()
        let localPath = await App.fileURLToPath(fileHref)
        if (localPath) App.showItemInFolder(localPath)
        else App.openInBrowser(fileHref)
    }

    return (
        <a className="filelink" href="#" onClick={onClick}>
            {children ?? filename}
        </a>
    )
}