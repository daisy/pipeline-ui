# pipeline-ui
A user interface for the DAISY Pipeline 2

## Dev notes

This project was created from [this electron template](https://github.com/daltonmenezes/electron-app).

## Usage notes

* Download and install the latest [release](https://github.com/daisy/pipeline-ui/releases)
* Start the Pipeline App and wait for the Pipeline engine to start
* Choose a script and fill out the appropriate fields
* Run the job and observe its progress and results

### Experimental keyboard shortcuts

Use these shortcuts with `Alt + Shift` on Windows or `Control + Opt` on Mac

* `0-9` to access the first 10 tabs quickly (1 = first tab, 0 = tenth tab)
* `R` to run a job
* `N` to add a new job

## Ideas and todos

These will move to the issue tracker eventually.

### Script selection
* Drag and drop files to filter suggested scripts
* Or just pick a script

### Job submission
* After a user starts filling out a new job form, if they close the tab, ask them if they want to cancel
* Validate job submission form fields
* Support multiple files

### Job details
* Confirm deleting a job

### General
* Move the pipeline "online" status to a preferences pane where you can specify the pipeline installation
* Redesign main menu

### Behind the scenes todos

* Global state via redux
* Basic testing framework via selenium
