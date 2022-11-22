export function Results({ job }) {
    return (
        <ul aria-live="polite">
            {job.jobData.results.namedResults.map((item) => (
                <li>
                    <span>{item.nicename}</span>
                    {item.files.length > 1 ? (
                        <ul>
                            {item.files.map((resultFile) => (
                                <li>{resultFile.file}</li>
                            ))}
                        </ul>
                    ) : (
                        <span>{item.files[0]?.file}</span>
                    )}
                </li>
            ))}
        </ul>
    )
}
