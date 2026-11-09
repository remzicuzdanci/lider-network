' Lider IT ONE Collector — installer actions (run as SYSTEM, deferred).
'
' WriteBootstrap : writes %ProgramData%\LiderCollector\enrollment.json from the values stamped into THIS msi
'                  (ENROLLTOKEN, SERVERURL). It does NOT touch the network: the Windows service itself enrolls on its
'                  first start (retrying until the server is reachable), stores the API key with DPAPI and deletes the file.
' LogRolledBack  : rollback action — records that the installation was undone.
' LogCommitted   : commit action  — records a successful installation.
'
' The token is NEVER written to any log. Install problems are written to %ProgramData%\LiderCollector\setup.log.
Option Explicit

Const FOR_APPENDING = 8

Function DataDir()
    Dim sh : Set sh = CreateObject("WScript.Shell")
    DataDir = sh.ExpandEnvironmentStrings("%ProgramData%") & "\LiderCollector"
End Function

Sub EnsureDir(fso, path)
    If Not fso.FolderExists(path) Then fso.CreateFolder path
End Sub

Sub WriteLog(msg)
    On Error Resume Next
    Dim fso : Set fso = CreateObject("Scripting.FileSystemObject")
    EnsureDir fso, DataDir()
    Dim f : Set f = fso.OpenTextFile(DataDir() & "\setup.log", FOR_APPENDING, True)
    f.WriteLine Year(Now) & "-" & Right("0" & Month(Now), 2) & "-" & Right("0" & Day(Now), 2) & " " & _
                Right("0" & Hour(Now), 2) & ":" & Right("0" & Minute(Now), 2) & ":" & Right("0" & Second(Now), 2) & " [installer] " & msg
    f.Close
End Sub

Function Matches(pattern, text)
    Dim re : Set re = CreateObject("VBScript.RegExp")
    re.Pattern = pattern
    re.IgnoreCase = False
    Matches = re.Test(text)
End Function

Function WriteBootstrap()
    Dim data, p, token, url, fso, dir, q, f, cfg
    data = Session.Property("CustomActionData")
    p = InStr(data, "|")
    If p = 0 Then
        WriteLog "bootstrap skipped: malformed installer data."
        WriteBootstrap = 1 : Exit Function
    End If
    token = Trim(Left(data, p - 1))
    url = Trim(Mid(data, p + 1))

    Set fso = CreateObject("Scripting.FileSystemObject")
    dir = DataDir()
    EnsureDir fso, dir

    ' Generic / upgrade installer (no stamped token): nothing to do — the existing identity is preserved.
    If Not Matches("^ldt_[0-9a-f]{64}$", token) Then
        WriteLog "no enrollment token in this installer (upgrade or unstamped package) - existing agent identity kept."
        WriteBootstrap = 1 : Exit Function
    End If

    ' Already enrolled on this machine: never leave a fresh live token on disk.
    cfg = dir & "\collector.json"
    If fso.FileExists(cfg) Then
        Dim t : Set t = fso.OpenTextFile(cfg, 1)
        Dim txt : txt = t.ReadAll : t.Close
        If Matches("""collector_id""\s*:\s*[1-9]", txt) Then
            WriteLog "this machine is already enrolled - enrollment token ignored, existing identity kept."
            WriteBootstrap = 1 : Exit Function
        End If
    End If

    If Not Matches("^https?://[A-Za-z0-9._:/\-\[\]]+$", url) Then
        Err.Raise 1, "LiderSetup", "Invalid server address embedded in the installer. Download the installer again from Lider IT ONE."
    End If

    q = Chr(34)
    Dim allowHttp : allowHttp = "false"
    If LCase(Left(url, 7)) = "http://" Then allowHttp = "true"

    On Error Resume Next
    Set f = fso.CreateTextFile(dir & "\enrollment.json", True, False)
    If Err.Number <> 0 Then
        Dim why : why = Err.Description
        On Error GoTo 0
        WriteLog "FAILED to create enrollment.json: " & why
        Err.Raise 1, "LiderSetup", "Could not write the enrollment file to " & dir & " (" & why & ")."
    End If
    f.Write "{" & q & "server_url" & q & ":" & q & url & q & "," & _
                  q & "enrollment_token" & q & ":" & q & token & q & "," & _
                  q & "allow_http" & q & ":" & allowHttp & "}"
    f.Close
    On Error GoTo 0

    WriteLog "enrollment file written (server=" & url & ", one-time token, allow_http=" & allowHttp & "). The service enrolls on first start."
    WriteBootstrap = 1
End Function

Function LogRolledBack()
    WriteLog "installation ROLLED BACK (version " & Session.Property("CustomActionData") & "). See the Windows Installer log for the cause."
    LogRolledBack = 1
End Function

Function LogCommitted()
    WriteLog "installation completed (version " & Session.Property("CustomActionData") & ")."
    LogCommitted = 1
End Function
