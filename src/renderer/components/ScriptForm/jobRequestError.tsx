export function JobRequestError({ jobRequestError }) {
    return (
        <p>
            An error occured while submitting the form:
            <span className="field-errors">{jobRequestError.description}</span>
        </p>
    )
}
