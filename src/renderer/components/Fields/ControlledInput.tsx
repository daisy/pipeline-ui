import { useEffect, useState } from 'react'

export function ControlledInput(props) {
    const { value, onChange, ...rest } = props
    const [query, setQuery] = useState(props.value)
    const [propagate, doPropagation] = useState(true)

    useEffect(() => {
        // Field has changed internally, propagate update
        if(propagate && onChange){
            onChange && onChange(query)
        } else {
            // last Update came from parent,
            // reactivate propagation
            doPropagation(true)
        }        
    }, [query])

    // Props update effect
    useEffect(() => {
        // Field value has changed from the parent
        if(query != value){
            // Deactivate propagation
            doPropagation(false)
            // Update the field
            setQuery(query)
        }
    }, [value])

    const handleChange = (e) => {
        setQuery(e.target.value)
    }

    return <input value={query} onChange={handleChange} {...rest} />
}
