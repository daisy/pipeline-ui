export function JobRequestError({ jobRequestError }) {
    return (
        <p>
            An error occured:
            <span className="field-errors">{jobRequestError.description}</span>
        </p>
    )
}
