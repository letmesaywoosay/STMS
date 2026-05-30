param (
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

$token = $env:GITHUB_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
    try {
        $remoteUrl = git remote get-url origin
        if ($remoteUrl -match "https://[^:]+:([^@]+)@github.com") {
            $token = $Matches[1]
        }
    } catch {}
}

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Error "GitHub Token could not be resolved from environment or Git remote URL."
}

$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "PowerShell"
}

# 1. Get remote SHA
$res = Invoke-RestMethod -Uri "https://api.github.com/repos/letmesaywoosay/STMS/contents/src/ApplicantManager.jsx?ref=main" -Headers $headers
$sha = $res.sha

# 2. Read local file
$fileBytes = [System.IO.File]::ReadAllBytes("src/ApplicantManager.jsx")
$base64Content = [System.Convert]::ToBase64String($fileBytes)

# 3. Create message
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $CommitMessage = "Auto-deploy via PowerShell API script at $timestamp"
}

# 4. Upload file via PUT
$bodyObj = @{
    message = $CommitMessage
    content = $base64Content
    branch  = "main"
    sha     = $sha
}
$bodyJson = $bodyObj | ConvertTo-Json -Depth 10

try {
    $putRes = Invoke-RestMethod -Uri "https://api.github.com/repos/letmesaywoosay/STMS/contents/src/ApplicantManager.jsx" -Headers $headers -Method Put -Body $bodyJson -ContentType "application/json"
    Write-Host "Success! Commit SHA: $($putRes.commit.sha)"
} catch {
    Write-Error "Upload failed: $_"
}
