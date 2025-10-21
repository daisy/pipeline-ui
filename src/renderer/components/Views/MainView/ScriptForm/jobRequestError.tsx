export function JobRequestError({ jobRequestError }) {
    return (
        <div>
            <h2>Error</h2>
            <span className="field-errors">{jobRequestError.description}</span>
        </div>
    )
}
