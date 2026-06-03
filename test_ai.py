import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# load env
load_dotenv(Path(__file__).resolve().parent / "backend" / ".env", override=True)

from backend.services.ai_analysis import analyze_coin

res = analyze_coin("bitcoin")
print(res)
