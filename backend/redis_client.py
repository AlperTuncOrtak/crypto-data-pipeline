import os
import json
import redis
from typing import Optional, Any

REDIS_URL = os.getenv("REDIS_URL", os.getenv("UPSTASH_REDIS_URL", ""))

_redis_client = None

def get_redis() -> Optional[redis.Redis]:
    global _redis_client
    if not REDIS_URL:
        return None
        
    if _redis_client is not None:
        return _redis_client
        
    try:
        r = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        r.ping() # test connection
        _redis_client = r
        return r
    except Exception as e:
        print(f"Redis connection failed: {e}")
        return None

def cache_get(key: str) -> Any:
    r = get_redis()
    if not r:
        return None
    val = r.get(key)
    if val:
        try:
            return json.loads(val)
        except:
            return val
    return None

def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> bool:
    r = get_redis()
    if not r:
        return False
    
    if isinstance(value, (dict, list)):
        value = json.dumps(value)
        
    try:
        r.setex(key, ttl_seconds, value)
        return True
    except Exception as e:
        print(f"Redis cache set failed: {e}")
        return False
