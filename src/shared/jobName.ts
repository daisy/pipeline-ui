function calculateJobName(job) {
    return job?.jobData?.nicename ?? job?.jobRequest?.nicename ?? 'Untitled job'
}

export { calculateJobName }
