# pipeline-ui
A user interface for the DAISY Pipeline 2

## Dev notes

This project was created from [this electron template](https://github.com/daltonmenezes/electron-app).

## Current status

* When the app starts, it also starts the Pipeline engine (dynamically using the first free port)
* The list of scripts loads
* The user is presented with a choice of scripts
* The user adds *required* parameters only to their script choice
* The job runs and the app displays its latest status
* When the job is done, the user may copy the path to the results on the clipboard

## Known to-dos

* After a user starts filling out a new job form, if they press "cancel", ask them if they want to cancel
* Also confirm deleting a job
* Move the pipeline "online" status to a preferences pane where you can specify the pipeline installation
* Reintroduce tabbed interface
* Validate job submission form fields
* Display validation status directly for validation jobs
* Open result files/folder in finder/file explorer
* Generally more defensive coding