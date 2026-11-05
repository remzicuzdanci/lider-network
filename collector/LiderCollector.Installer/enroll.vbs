
' LiderCollector enrollment action
' CustomActionData = full MSI path e.g. C:\Users\...\LiderCollectorSetup-acme-{token}.msi
Dim msiFull, msiName, i, lastDash, deployToken
Dim http, resp, Q, searchStr, tokenStart, tokenEnd, enrollToken
Dim fso, dataDir, enrollJson, f, hostName, body

Q = Chr(34)

' ── 1. Parse deploy token from MSI filename ────────────────────────────────
msiFull = Session.Property("CustomActionData")

For i = Len(msiFull) To 1 Step -1
    If Mid(msiFull, i, 1) = "\" Then Exit For
Next
msiName = Mid(msiFull, i + 1)

If LCase(Right(msiName, 4)) = ".msi" Then
    msiName = Left(msiName, Len(msiName) - 4)
End If

lastDash = 0
For i = Len(msiName) To 1 Step -1
    If Mid(msiName, i, 1) = "-" Then
        lastDash = i
        Exit For
    End If
Next

If lastDash = 0 Or lastDash = Len(msiName) Then
    Err.Raise 1, "LiderSetup", "Deploy token not found in installer filename: " & msiName
End If

deployToken = Mid(msiName, lastDash + 1)

' ── 2. Hostname ────────────────────────────────────────────────────────────
hostName = CreateObject("WScript.Network").ComputerName

' ── 3. HTTP auto-enroll ────────────────────────────────────────────────────
Set http = CreateObject("WinHttp.WinHttpRequest.5.1")
http.Open "POST", "http://192.168.20.61/api/v1/collector/auto-enroll", False
http.SetRequestHeader "Content-Type", "application/json"
http.SetTimeouts 5000, 5000, 20000, 20000

body = "{" & _
    Q & "deploy_token" & Q & ":" & Q & deployToken & Q & "," & _
    Q & "hostname"     & Q & ":" & Q & hostName    & Q & "," & _
    Q & "version"      & Q & ":" & Q & "1.0.0"     & Q & "," & _
    Q & "os_name"      & Q & ":" & Q & "Windows"   & Q & "," & _
    Q & "os_arch"      & Q & ":" & Q & "x64"       & Q & _
    "}"

http.Send body

If http.Status <> 200 Then
    Err.Raise 1, "LiderSetup", "Enrollment failed (HTTP " & http.Status & "): " & http.ResponseText
End If

' ── 4. Parse enrollment_token ──────────────────────────────────────────────
resp = http.ResponseText
searchStr = Q & "enrollment_token" & Q & ":" & Q
tokenStart = InStr(resp, searchStr)
If tokenStart = 0 Then
    Err.Raise 1, "LiderSetup", "Cannot parse server response: " & resp
End If
tokenStart = tokenStart + Len(searchStr)
tokenEnd   = InStr(tokenStart, resp, Q)
enrollToken = Mid(resp, tokenStart, tokenEnd - tokenStart)

If Len(enrollToken) < 10 Then
    Err.Raise 1, "LiderSetup", "Invalid enrollment_token received"
End If

' ── 5. Write enrollment.json ───────────────────────────────────────────────
Set fso = CreateObject("Scripting.FileSystemObject")
dataDir = "C:\ProgramData\LiderCollector"
If Not fso.FolderExists(dataDir) Then fso.CreateFolder dataDir

enrollJson = "{" & _
    Q & "server_url"       & Q & ":" & Q & "http://192.168.20.61" & Q & "," & _
    Q & "enrollment_token" & Q & ":" & Q & enrollToken            & Q & _
    "}"

Set f = fso.CreateTextFile(dataDir & "\enrollment.json", True, False)
f.Write enrollJson
f.Close

' ── 6. Setup log ───────────────────────────────────────────────────────────
Set f = fso.OpenTextFile(dataDir & "\setup.log", 8, True)
f.WriteLine Now() & " [EnrollCA] OK host=" & hostName & " token=" & Left(enrollToken, 8) & "..."
f.Close
