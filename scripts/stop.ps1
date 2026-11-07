$demoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $demoRoot
$recordPath = Join-Path $demoRoot '.demo-process.json'
if (Test-Path -LiteralPath $recordPath) {
  $record = Get-Content -LiteralPath $recordPath | ConvertFrom-Json
  $process = Get-Process -Id $record.pid -ErrorAction SilentlyContinue
  if ($process -and $process.ProcessName -eq 'node' -and $process.StartTime.ToUniversalTime().ToString('o') -eq $record.started) { Stop-Process -Id $process.Id }
  Remove-Item -LiteralPath $recordPath
}
