$file = 'frontend/src/pages/Portfolio.tsx'
$c = Get-Content $file -Raw
$pattern = '(?s)\{activeTab === "history".*?\{activeTab === "taxes" && \(\s*<motion\.div.*?</motion\.div>\s*\)\}'
$c = $c -replace $pattern, ''
Set-Content $file $c
