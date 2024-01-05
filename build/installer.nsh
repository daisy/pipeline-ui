#### DAISY Pipeline 2 uninstall script ####

!macro RemovePreviousDP2
  !define DP2_KEY "SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\UninstallDAISY Pipeline 2DAISY Consortium DAISY Pipeline 2"
    ; Uninstall key of a previous DP2 installation (tested with installer of DP2 version 1.14.11)
  ReadRegStr $0 HKLM "${DP2_KEY}" "UninstallString"
  StrCmp $0 "" DP2Abort ;Abort the uninstall if not found
    ; Request user confirmation before uninstalling DP2
    ReadRegStr $1 HKLM "${DP2_KEY}" "InstallLocation"
    MessageBox MB_YESNO "An older version of DAISY Pipeline 2 was found on your system in$\r$\n\
    $1$\r$\n\
    Do you want to also remove it while installing the new app?$\r$\n\
    (Installation of the new app will not be impacted if you choose to keep the older DAISY Pipeline 2)" IDNO DP2Abort
    ; Set current directory for the uninstaller, as it takes the working directory by default
    SetOutPath "$1"
    ExecShell "runas" '"$0"' "/S"
    ;Delete previous daisy pipeline 2 data while uninstallation is ongoing
    ; \\?\ required to delete pathes with excending 260 character length
    RMDir /r "\\?\$APPDATA\DAISY Pipeline 2"
  DP2Abort:
!macroend

!macro customInit
  !insertmacro RemovePreviousDP2
!macroend