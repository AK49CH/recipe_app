import requests

# Test Ollama API
try:
    # Test basic connectivity
    response = requests.get("http://localhost:11434/api/tags", timeout=10)
    print(f"API tags response: {response.status_code}")
    if response.status_code == 200:
        print("Ollama API is accessible!")
        data = response.json()
        print(f"Available models: {data}")
    else:
        print(f"API returned status: {response.status_code}")

    # Test chat endpoint
    chat_payload = {
        "model": "llama3:8b",
        "messages": [{"role": "user", "content": "Say hello"}],
        "stream": False
    }

    response = requests.post("http://localhost:11434/api/chat", json=chat_payload, timeout=30)
    print(f"Chat API response: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"Chat response: {result.get('message', {}).get('content', 'No content')}")
    else:
        print(f"Chat failed: {response.text}")

except Exception as e:
    print(f"Error testing Ollama: {e}")
