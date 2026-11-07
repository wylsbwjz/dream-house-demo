$ErrorActionPreference = 'Stop'
$demoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $demoRoot
$env:TEMP = 'E:/Codex/Temp'
$env:TMP = 'E:/Codex/Temp'
$demoNode = 'E:/Codex/Runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
if (-not (Test-Path -LiteralPath $demoNode)) { $demoNode = (Get-Command node).Source }
$envPath = Join-Path $demoRoot '.env'
if (-not (Test-Path -LiteralPath $envPath)) { Copy-Item -LiteralPath (Join-Path $demoRoot '.env.example') -Destination $envPath }
$demoPort = 4317
Get-Content -LiteralPath $envPath | ForEach-Object { if ($_ -match '^PORT=(\d+)$') { $demoPort = [int]$Matches[1] } }
$demoUrl = "http://127.0.0.1:$demoPort"
try { $ready = Invoke-RestMethod -Uri "$demoUrl/api/config" -TimeoutSec 2 } catch { $ready = $null }
if (-not $ready) {
  $process = Start-Process -FilePath $demoNode -ArgumentList @('server/local.mjs','--production') -WorkingDirectory $demoRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $demoRoot 'server.log') -RedirectStandardError (Join-Path $demoRoot 'server-error.log')
  Set-Content -LiteralPath (Join-Path $demoRoot '.demo-process.json') -Value (@{pid=$process.Id; started=$process.StartTime.ToUniversalTime().ToString('o')} | ConvertTo-Json)
  for ($i=0; $i -lt 20; $i++) { try { $ready=Invoke-RestMethod -Uri "$demoUrl/api/config" -TimeoutSec 1; break } catch { Start-Sleep -Milliseconds 300 } }
}
if ($ready) { Start-Process 'explorer.exe' -ArgumentList $demoUrl } else { throw 'Demo failed to start. Check server-error.log.' }
