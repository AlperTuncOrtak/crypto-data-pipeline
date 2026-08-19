import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("backend/.env")
url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")

sb = create_client(url, key)
res = sb.table("user_wallets").select("*").execute()
print(res.data)
