# One-time setup for signed Cinema playback.
# Creates a Cloudflare Stream signing key, stores it as Firebase secrets,
# and deploys the cinemaStreamToken function. No secrets are written to the repo.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "`nStep 1 of 4: Firebase sign-in" -ForegroundColor Cyan
npx firebase login
if ($LASTEXITCODE) { throw 'Firebase sign-in failed.' }

Write-Host "`nStep 2 of 4: Cloudflare details" -ForegroundColor Cyan
$account = (Read-Host 'Paste your Cloudflare Account ID').Trim()
$token = (Read-Host 'Paste your Cloudflare API token (the Stream signing one)').Trim()

Write-Host "`nStep 3 of 4: Creating the signing key and saving it to Firebase" -ForegroundColor Cyan
$response = Invoke-RestMethod -Method Post -Uri "https://api.cloudflare.com/client/v4/accounts/$account/stream/keys" -Headers @{ Authorization = "Bearer $token" }
if (-not $response.success) { throw "Cloudflare refused: $($response.errors | ConvertTo-Json -Compress)" }
$idFile = New-TemporaryFile
$pemFile = New-TemporaryFile
try {
  [IO.File]::WriteAllText($idFile, $response.result.id)
  [IO.File]::WriteAllText($pemFile, $response.result.pem)
  npx firebase functions:secrets:set STREAM_SIGNING_KEY_ID --data-file $idFile --project neta-dao-cinema
  if ($LASTEXITCODE) { throw 'Saving STREAM_SIGNING_KEY_ID failed.' }
  npx firebase functions:secrets:set STREAM_SIGNING_KEY_PEM --data-file $pemFile --project neta-dao-cinema
  if ($LASTEXITCODE) { throw 'Saving STREAM_SIGNING_KEY_PEM failed.' }
} finally {
  Remove-Item $idFile, $pemFile -ErrorAction SilentlyContinue
}

Write-Host "`nStep 4 of 4: Deploying the cinemaStreamToken function" -ForegroundColor Cyan
npx firebase deploy --only functions:academy-staff:cinemaStreamToken --project neta-dao-cinema
if ($LASTEXITCODE) { throw 'Deploy failed.' }

Write-Host "`nAll done. You can now delete the 'Stream signing' API token in Cloudflare." -ForegroundColor Green
