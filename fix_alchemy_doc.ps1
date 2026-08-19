$file = 'backend/services/alchemy_service.py'
$c = Get-Content $file -Raw
$c = $c -replace '"\\""', "'''"
Set-Content $file $c
