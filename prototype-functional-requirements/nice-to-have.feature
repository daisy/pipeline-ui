# Prototype functional requirements: nice-to-have features

# to test progress indication in tab title, notifications
Scenario: submit a job
  When the user fills out and submits the job form
  And no jobs are in the job queue
  Then the job is added to the job queue and is started immediately
  And the tab pane contains a (read-only) view of the inputs and options and an indication of the progress and status of the job
  And the tab title contains the name of the script and an indication of the progress of the job
  And a (macOS) notification is sent

# to test notifications
Scenario: get notified of a finished job
  When a job has finished successfully
  And the user clicks on the notification that was sent
  And the job has no open tab
  Then a new tab is opened for the job
  And the tab pane contains a view of the inputs and options, an indication of the progress and status of the job and buttons to download the results
  # the buttons do not actually need to work
