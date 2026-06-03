$retryCount = 0
while ($retryCount -lt 30) {
    $result = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Docker is up!"
        break
    }
    Write-Host "Waiting for Docker..."
    Start-Sleep -Seconds 2
    $retryCount++
}
docker-compose up -d
