import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_gemini_func = '''    def try_gemini():
        from google import genai

        full_ctx = system_prompt + "\n\nUser: " + message
        client = genai.Client(api_key=GEMINI_KEY)
        resp = client.models.generate_content(model="gemini-2.0-flash", contents=full_ctx)
        return resp.text.strip()'''

new_gemini_func = '''    def try_gemini():
        from google import genai
        from google.genai import types

        contents = []
        for h in recent_history:
            role = "user" if h["role"] == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part.from_text(h["content"])]))
        contents.append(types.Content(role="user", parts=[types.Part.from_text(message)]))

        client = genai.Client(api_key=GEMINI_KEY)
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        return resp.text.strip()'''

if old_gemini_func in content:
    content = content.replace(old_gemini_func, new_gemini_func)
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Gemini history fixed.")
else:
    print("Old gemini function not found exactly as string.")
