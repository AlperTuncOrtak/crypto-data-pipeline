import re

with open("frontend/src/pages/Pricing.tsx", "r") as f:
    pricing = f.read()

# Remove imports
pricing = re.sub(r'import \{ TimelineContent \}.*;\n', '', pricing)
pricing = re.sub(r'import \{ VerticalCutReveal \}.*;\n', '', pricing)

# Remove opening tags
pricing = re.sub(r'<TimelineContent[^>]*>', '', pricing)
pricing = re.sub(r'</TimelineContent>', '', pricing)
pricing = re.sub(r'<VerticalCutReveal[^>]*>', '', pricing)
pricing = re.sub(r'</VerticalCutReveal>', '', pricing)

with open("frontend/src/pages/Pricing.tsx", "w") as f:
    f.write(pricing)

with open("frontend/src/pages/Portfolio.tsx", "r") as f:
    portfolio = f.read()

# Remove imports
portfolio = re.sub(r'import HistoryTab.*;\n', '', portfolio)
portfolio = re.sub(r'import AnalyticsTab.*;\n', '', portfolio)
portfolio = re.sub(r'import TaxesTab.*;\n', '', portfolio)
portfolio = re.sub(r'import \{[^}]*GuideModal[^}]*\} from "../components/portfolio/PortfolioUtils";\n', '', portfolio)

# Remove unused tabs
portfolio = re.sub(r'\{activeTab === "history"[\s\S]*?\}\)', '', portfolio)
portfolio = re.sub(r'\{activeTab === "analytics"[\s\S]*?\}\)', '', portfolio)
portfolio = re.sub(r'\{activeTab === "taxes"[\s\S]*?\}\)', '', portfolio)

# Remove GuideModal usages
portfolio = re.sub(r'<GuideModal[^>]*/>', '', portfolio)

# Remove calcTax, parseCSV, GuideModal from PortfolioUtils import if present
portfolio = re.sub(r'calcTax,\s*', '', portfolio)
portfolio = re.sub(r'GuideModal,\s*', '', portfolio)
portfolio = re.sub(r'parseCSV,\s*', '', portfolio)
portfolio = re.sub(r',\s*parseCSV', '', portfolio)
portfolio = re.sub(r',\s*calcTax', '', portfolio)
portfolio = re.sub(r',\s*GuideModal', '', portfolio)

with open("frontend/src/pages/Portfolio.tsx", "w") as f:
    f.write(portfolio)

