#!/usr/bin/env python3
"""Script test các API endpoints"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_register():
    print("=" * 50)
    print("TEST 1: Đăng ký user mới")
    print("=" * 50)
    
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "test123",
        "height": 170,
        "weight": 65
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/register", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_login():
    print("=" * 50)
    print("TEST 2: Đăng nhập")
    print("=" * 50)
    
    data = {
        "username": "testuser",
        "password": "test123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    return response.cookies

def test_generate_menu(cookies):
    print("=" * 50)
    print("TEST 3: Tạo thực đơn AI")
    print("=" * 50)
    
    response = requests.post(f"{BASE_URL}/api/menu/generate", cookies=cookies)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_get_menu_today(cookies):
    print("=" * 50)
    print("TEST 4: Lấy thực đơn hôm nay")
    print("=" * 50)
    
    response = requests.get(f"{BASE_URL}/api/menu/today", cookies=cookies)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

if __name__ == "__main__":
    try:
        # Test đăng ký
        test_register()
        
        # Test đăng nhập
        cookies = test_login()
        
        # Test tạo menu
        test_generate_menu(cookies)
        
        # Test xem menu
        test_get_menu_today(cookies)
        
        print("✅ Hoàn thành test!")
        
    except Exception as e:
        print(f"❌ Lỗi: {e}")
