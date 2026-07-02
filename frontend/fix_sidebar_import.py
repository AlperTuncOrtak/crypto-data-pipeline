import re

with open('src/components/layout/WatchlistSidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Rename the old WatchlistPanel to OldWatchlistPanel
content = content.replace('function WatchlistPanel({', 'function OldWatchlistPanel({')

# 2. Add import statement at the top
import_statement = 'import WatchlistPanel from "./WatchlistPanel";\n'
if import_statement not in content:
    content = content.replace('import { useState, useMemo, useEffect } from "react";', 'import { useState, useMemo, useEffect } from "react";\n' + import_statement)

# 3. Rename old Sparkline just in case
content = content.replace('function Sparkline({', 'function OldSparkline({')

with open('src/components/layout/WatchlistSidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
