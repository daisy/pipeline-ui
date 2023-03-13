import React from 'react'
import { useEffect, useRef, useState } from 'react'

export function ControlledInput(props) {
    const { value, onChange, ...rest } = props
    const [query, setQuery] = useState(props.value)

    const ref = useRef(null)

    useEffect(() => {
        onChange && onChange(query)
    }, [query])

    const handleChange = (e) => {
        setQuery(e.target.value)
    }

    return <input ref={ref} value={query} onChange={handleChange} {...rest} />
}

/* test with react full component
export class ControlledInputClass extends React.Component<
    {
        value?: string
        onChange?: (e: string) => void
        type?: string
        required?: boolean
        id?: string
        className?: string
        pattern?: string
    },
    {
        query: string
        cursor: number
    }
> {
    inputRef
    isUpdating = null
    constructor(props) {
        super(props)
        this.state = {
            query: props.value,
            cursor: null,
        }
        this.inputRef = React.createRef()
        this.onKeyDown = this.onKeyDown.bind(this)
        this.handleChange = this.handleChange.bind(this)
    }


    onKeyDown(e) {
        if (e.code == 'ArrowRight' || e.code == 'ArrowLeft') {
            if (this.isUpdating) {
                clearTimeout(this.isUpdating)
            }
            this.isUpdating = setTimeout(() => {
                this.props.onChange && this.props.onChange(this.state.query)
            }, 500)
        }
    }

    handleChange(e) {
        console.log('change', e)
        if (this.isUpdating) {
            console.log('clear timeout')
            clearTimeout(this.isUpdating)
        }
        this.setState({
            query: e.target.value,
        })
        this.isUpdating = setTimeout(() => {
            this.props.onChange && this.props.onChange(e.target.value)
        }, 500)
    }

    render(): React.ReactNode {
        const { value, onChange, ...rest } = this.props
        return (
            <input
                ref={this.inputRef}
                value={this.state.query}
                onKeyDown={this.onKeyDown}
                onChange={this.handleChange}
                {...rest}
            />
        )
    }
}*/
