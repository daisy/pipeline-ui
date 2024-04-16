import remarkGfm from 'remark-gfm'
import Markdown from 'react-markdown'
import { externalLinkClick } from 'renderer/utils'
const { App } = window

export function MarkdownDescription(props) {
    return (
        <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
                // override the rendering of link elements with a link element that opens in an external browser
                a: (props) => {
                    return (
                        <a
                            href={props.href}
                            onClick={(e) => externalLinkClick(e, App)}
                        >
                            {props.children}
                        </a>
                    )
                },
            }}
        >
            {props.children}
        </Markdown>
    )
}
