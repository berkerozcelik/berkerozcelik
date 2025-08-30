#!/usr/bin/env python3
"""
Quick authentication test to verify login fix
"""

import asyncio
import aiohttp
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://yapilacak-app.preview.emergentagent.com')
API_BASE_URL = f"{BACKEND_URL}/api"

async def test_auth():
    async with aiohttp.ClientSession() as session:
        # Test user data
        user_data = {
            "email": "test@example.com",
            "password": "test123",
            "name": "Test User",
            "role": "hasta"
        }
        
        print("Testing registration...")
        async with session.post(f"{API_BASE_URL}/auth/register", json=user_data) as response:
            if response.status == 200:
                data = await response.json()
                print("✅ Registration successful")
            else:
                error = await response.text()
                print(f"❌ Registration failed: {response.status} - {error}")
                return
        
        print("Testing login...")
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        async with session.post(f"{API_BASE_URL}/auth/login", json=login_data) as response:
            if response.status == 200:
                data = await response.json()
                print("✅ Login successful")
                print(f"Token: {data['access_token'][:50]}...")
            else:
                error = await response.text()
                print(f"❌ Login failed: {response.status} - {error}")

if __name__ == "__main__":
    asyncio.run(test_auth())