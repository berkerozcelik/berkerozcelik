#!/usr/bin/env python3
"""
Test for NEW Sleep and Steps Fields in Health Records API
Testing the updated health records API that should include sleep_hours, sleep_minutes, and steps
"""

import asyncio
import aiohttp
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://cancer-support-app.preview.emergentagent.com')
API_BASE_URL = f"{BACKEND_URL}/api"

async def test_sleep_steps_fields():
    """Test the new sleep and steps fields in health records"""
    print("=== Testing NEW Sleep and Steps Fields ===")
    
    # Login to get token
    async with aiohttp.ClientSession() as session:
        # Login with demo patient account
        login_data = {
            "email": "hasta@demo.com",
            "password": "demo123"
        }
        
        async with session.post(f"{API_BASE_URL}/auth/login", json=login_data) as response:
            if response.status != 200:
                print("❌ Failed to login for testing")
                return
            
            data = await response.json()
            token = data['access_token']
            headers = {"Authorization": f"Bearer {token}"}
        
        # Test creating health record WITH NEW FIELDS
        print("\n1. Testing Health Record Creation with Sleep and Steps Data")
        health_data_with_new_fields = {
            "weight": 70.5,
            "temperature": 36.5,
            "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80,
            "heart_rate": 75,
            "sleep_hours": 7,
            "sleep_minutes": 30,
            "steps": 8500,
            "symptoms": ["hafif yorgunluk"],
            "notes": "Bugün iyi uyudum ve yeterince yürüdüm"
        }
        
        async with session.post(
            f"{API_BASE_URL}/health/records",
            json=health_data_with_new_fields,
            headers=headers
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Health record created successfully")
                
                # Check if new fields are present in response
                if 'sleep_hours' in data and 'sleep_minutes' in data and 'steps' in data:
                    print(f"✅ NEW FIELDS PRESENT: sleep_hours={data['sleep_hours']}, sleep_minutes={data['sleep_minutes']}, steps={data['steps']}")
                else:
                    print(f"❌ NEW FIELDS MISSING in response: {data}")
                    print("❌ CRITICAL: Backend models do not include sleep_hours, sleep_minutes, steps fields")
            else:
                error_text = await response.text()
                print(f"❌ Failed to create health record: Status {response.status}, Error: {error_text}")
        
        # Test retrieving records to see if new fields are stored
        print("\n2. Testing Health Record Retrieval with New Fields")
        async with session.get(f"{API_BASE_URL}/health/records/latest", headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                if data:
                    print(f"✅ Latest record retrieved")
                    if 'sleep_hours' in data and 'sleep_minutes' in data and 'steps' in data:
                        print(f"✅ NEW FIELDS RETRIEVED: sleep_hours={data.get('sleep_hours')}, sleep_minutes={data.get('sleep_minutes')}, steps={data.get('steps')}")
                    else:
                        print(f"❌ NEW FIELDS NOT STORED/RETRIEVED: Available fields: {list(data.keys())}")
                        print("❌ CRITICAL: Backend does not support sleep and steps tracking")
                else:
                    print("❌ No latest record found")
            else:
                error_text = await response.text()
                print(f"❌ Failed to get latest record: Status {response.status}, Error: {error_text}")

        # Test with realistic Turkish health data as requested
        print("\n3. Testing with Realistic Turkish Health Data")
        turkish_health_data = {
            "weight": 68.2,
            "temperature": 36.7,
            "blood_pressure_systolic": 118,
            "blood_pressure_diastolic": 78,
            "heart_rate": 72,
            "sleep_hours": 8,
            "sleep_minutes": 15,
            "steps": 6750,
            "symptoms": ["baş ağrısı", "hafif mide bulantısı"],
            "notes": "Kemoterapi sonrası genel durumum iyi. Uyku kalitem arttı ve günlük yürüyüş hedefime ulaştım."
        }
        
        async with session.post(
            f"{API_BASE_URL}/health/records",
            json=turkish_health_data,
            headers=headers
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Turkish health data record created")
                
                # Verify all new fields
                new_fields_present = all(field in data for field in ['sleep_hours', 'sleep_minutes', 'steps'])
                if new_fields_present:
                    print(f"✅ All new fields present in Turkish data record")
                else:
                    print(f"❌ Some new fields missing in Turkish data record")
            else:
                error_text = await response.text()
                print(f"❌ Failed to create Turkish health record: {error_text}")

if __name__ == "__main__":
    asyncio.run(test_sleep_steps_fields())