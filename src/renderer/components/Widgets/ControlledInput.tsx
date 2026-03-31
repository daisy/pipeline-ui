import { useState, useEffect } from 'react'

export function ControlledInput(props) {
    const { value, onChange, ...rest } = props
    const [query, setQuery] = useState(props.value)

    useEffect(() => {
        setQuery(value)
    }, [value])

    const handleChange = (e) => {
        setQuery(e.target.value)
        onChange && onChange(e.target.value)
    }

    return <input value={query} onChange={handleChange} {...rest} />
}
