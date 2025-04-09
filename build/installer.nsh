!ifndef BUILD_UNINSTALLER
  !include "StrFunc.nsh"  
  ${StrStr}
!else
  !include "StrFunc.nsh"  
  ${UnStrStr}
!endif


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

;Install app and cli utility in path
!macro customInstall
    ; Get the user PATH value (in $0)
    ReadRegStr $0 HKCU "Environment" "Path"
    IntOp $6 0 + 0;

    ; Check if $0 ends with a ';'
    StrLen $2 $0
    IntOp $2 $2 - 1
    StrCpy $3 $0 1 $2
    StrCmp $3 ";" pathEndsWithSemicolon 0 ; If not ending with a ';', append it
      StrCpy $0 "$0;"
    pathEndsWithSemicolon:

    ; uncomment to install app in path
    ;${StrStr} $1 $0 "$INSTDIR;"
    ;StrCmp $1 "" 0  AppIsInPath
    ;  StrCpy $0 "$0$INSTDIR;"
    ;  IntOp $6 0 + 1;
    ;AppIsInPath:
    
    ${StrStr} $1 $0 "$INSTDIR\resources\app.asar.unpacked\resources\daisy-pipeline\cli;"
    StrCmp $1 "" 0  CliInPath
      StrCpy $0 "$0$INSTDIR\resources\app.asar.unpacked\resources\daisy-pipeline\cli;"
      IntOp $6 0 + 1;
    CliInPath:

    IntCmp $6 0 EndCustomInstall
      WriteRegExpandStr HKCU "Environment" "Path" "$0"
    EndCustomInstall:
!macroend

; TODO I'd like to remove the path from the user PATH
; but i can't find a way to make electron-builder to accept
; any script in the uninstaller.nsh file
; in the following, despite being documented in NSIS
; the command  UnStrStr is refused
!macro customUnInstall
  ; Get the user PATH value (in $0)
  ReadRegStr $0 HKCU "Environment" "Path"
  IntOp $6 0 + 0;

  StrLen $3 "$INSTDIR\resources\app.asar.unpacked\resources\daisy-pipeline\cli;" ; size of instdir
  StrLen $4 $0 ; size of the path value
  ${UnStrStr} $1 $0 "$INSTDIR\resources\app.asar.unpacked\resources\daisy-pipeline\cli;" ; substring position of instdir in path
  StrCmp $1 "" CliIsNotInPath 0 ; if substring is empty, no modification, else continue
    StrLen $5 $1 ; size of the substring
    IntOp $5 $4 - $5 ; pathSize - substringSize
    StrCpy $0 $0 $5 ; $0 = substring(str=$0, start=0, len=$5)
    StrCpy $1 $1 "" $3 ; $1 = substring(str=$1, start=$3)
    StrCpy $0 "$0$1"
    IntOp $6 0 + 1;
  CliIsNotInPath:
  
  ; uncomment to remove app of the path
  ; StrLen $3 "$INSTDIR;" ; size of instdir
  ; StrLen $4 $0 ; size of the path value
  ; ${UnStrStr} $1 $0 "$INSTDIR;" ; substring position of instdir in path
  ; StrCmp $1 "" AppIsNotInPath 0 ; if substring is empty, no modification, else continue
  ;   StrLen $5 $1 ; size of the substring
  ;   IntOp $5 $4 - $5 ; pathSize - substringSize
  ;   StrCpy $0 $0 $5 ; $0 = substring(str=$0, start=0, len=$5)
  ;   StrCpy $1 $1 "" $3 ; $1 = substring(str=$1, start=$3)
  ;   StrCpy $0 "$0$1"
  ;   IntOp $6 0 + 1;
  ; AppIsNotInPath:

  IntCmp $6 0 EndCustomUnInstall
    WriteRegExpandStr HKCU "Environment" "Path" "$0"
  EndCustomUnInstall:
  
!macroend
