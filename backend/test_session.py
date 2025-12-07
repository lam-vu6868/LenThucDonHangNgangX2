#!/usr/bin/env python3
"""Test session và CORS"""
import requests

BASE_URL = "http://127.0.0.1:5000"

# Create a session to persist cookies
session = requests.Session()

print("1. Testing login...")
response = session.post(f"{BASE_URL}/api/auth/login", json={
    "username": "testuser",
    "password": "test123"
})
print(f"Login status: {response.status_code}")
print(f"Response: {response.json()}")
print(f"Cookies: {session.cookies.get_dict()}")
print()

print("2. Testing generate menu (should work with session)...")
response = session.post(f"{BASE_URL}/api/menu/generate", json={
    "height": 170,
    "weight": 65,
    "dietary_preferences": "Giảm cân"
})
print(f"Generate status: {response.status_code}")
if response.status_code == 200:
    print("✅ Session works!")
    print(f"Menu preview: {response.json()['menu_content'][:200]}...")
else:
    print(f"❌ Error: {response.text}")
