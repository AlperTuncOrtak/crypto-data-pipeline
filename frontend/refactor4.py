import re

with open('src/pages/AIAnalysis.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace formatPrice with NumberFlow where appropriate
# Examples: 
# {formatPrice(selected.current_price)} -> <NumberFlow value={selected.current_price} format={{ style: 'currency', currency: 'USD' }} />
c = re.sub(
    r'\{formatPrice\(([^)]+)\)\}',
    r'<NumberFlow value={Number(\1) || 0} format={{ style: "currency", currency: "USD", maximumFractionDigits: 6 }} />',
    c
)

with open('src/pages/AIAnalysis.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
