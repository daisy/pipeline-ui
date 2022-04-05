# Prototype functional requirements

# to test tabs, connection with Pipeline engine
Scenario: create a new job
  When: the user clicks on the clicks on the '+' button in the tab list of the main window
  # in the final app the user can also click on the 'New Job (⌘N)' menu item of the 'File' menu
  Then: a new tab opens in the main window
  And: the tab pane contains a form to configure a "DTBook to DAISY 3" job
  And: the tab title is 'New Job'
  # Required fields
  # * DTBook file (file picker)
  # Optional fields (pre-filled)
  # * Enable text-to-speech (checkbox)
  # * Text-to-speech configuration (file picker)
  # * Enable TTS log (checkbox)
  # * With text (checkbox)
  # * Detect words (checkbox)
  # * Publisher

# to test form validation
Scenario: fail to submit a job
  When: the user submits the job form
  And: a required field was not filled out
  Then: the user is told which fields were note correctly filled out

# to test progress indication in tab title, notifications
Scenario: submit a job
  When: the user fills out and submits the job form
  And: no jobs are in the job queue
  Then: the job is added to the job queue and is started immediately
  And: the tab pane contains a (read-only) view of the inputs and options and an indication of the progress and status of the job
  And: the tab title contains the name of the script an indication of the progress of the job
  And: a (macOS) notification is sent

# to test windowless app
Scenario: close tab of a running job
  When: the user clicks on the 'x' button in the tab title
  # in the final the user can also click on the 'Close Job (⌘W)' menu item of the 'File' menu
  And: the job is running
  And: the window has only one tab
  Then: a warning is shown that the job is and will keep running and can be opened again via the menus or notifications
  And: the tab is closed when the user clicks 'OK'
  # in the final app there will be the possibility to "not show this warning again"
  # in the final it will be possible to open a job via 'Open Job (⌘O)' menu item in 'File' menu or via the 'History' menu or via the 'Job Management' window
  # if the job is idle or finished, there would be a warning that the job will be deleted (and results discarded)
  # in the final app there will be the possibility to save the job

# to test notifications
Scenario: get notified of a finished job
  When: a job has finished successfully
  And: the user clicks on the notification that was sent
  And: the job has no open tab
  Then: a new tab is opened for the job
  And: the tab pane contains a view of the inputs and options, an indication of the progress and status of the job and buttons to download the results
  # the buttons do not actually need to work

# to test icon in system tray
Scenario: quit application
  When: the user clicks on 'Quit DAISY Pipeline 2' item in the menu of the Pipeline icon in the system tray
  # in the final app the user can also click on the 'Quit DAISY Pipeline 2' menu item in the 'DAISY Pipeline 2' menu, or on 'Quit' in the contextual menu of the Pipeline icon the dock
  Then: the application is quit
  # in the final app, if there are running jobs, a warning will be shown that these will be aborted
  # in the final app, warnings will be shown for finished and idle jobs that are not saved
