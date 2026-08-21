# ============================================================
# backend/services/llm_config.py
# ============================================================
# Groq model adlari tek yerde.
#
# NEDEN BU DOSYA VAR: Kod uzun sure "llama-3.3-70b-versatile" ve
# "llama3-8b-8192" modellerini 7 ayri yerde sabit yaziyordu. Groq bu
# modelleri kullanimdan kaldirinca her Groq cagrisi 404 dondu ve sistem
# sessizce Gemini fallback'ine dustu — "Groq birincil, Gemini yedek"
# mimarisi fiilen "her zaman Gemini" oldu ve bunu kimse fark etmedi
# cunku fallback calisiyordu.
#
# Artik model adi ortam degiskeninden geliyor: bir sonraki kullanimdan
# kaldirmada kod degil .env degisiyor (ve container restart).
#
# Model secerken dikkat: bazi modeller (orn. qwen/qwen3.6-27b) reasoning
# metnini <think> bloklari halinde dogrudan content alanina yaziyor ve
# bu kullaniciya gorunur. gpt-oss ailesi reasoning'i ayri bir "reasoning"
# alaninda tutuyor, content temiz kaliyor — bu yuzden varsayilan o.
#
# Hesapta hangi modellerin oldugunu gormek icin:
#   docker exec crypto_api python3 -c "import os,httpx;\
#     print([m['id'] for m in httpx.get('https://api.groq.com/openai/v1/models',\
#     headers={'Authorization':'Bearer '+os.getenv('GROQ_API_KEY','')}).json()['data']])"
# ============================================================
import os

# Ana analiz/sohbet modeli (eski: llama-3.3-70b-versatile)
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

# Kisa ve ucuz isler icin daha kucuk model (eski: llama3-8b-8192)
GROQ_MODEL_FAST = os.getenv("GROQ_MODEL_FAST", "openai/gpt-oss-20b")

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
