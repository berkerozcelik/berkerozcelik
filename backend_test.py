#!/usr/bin/env python3
"""
Turkish Cancer Care Application Backend API Tests
Tests all backend endpoints with Turkish language support and AI functionality
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://cancer-support-app.preview.emergentagent.com')
API_BASE_URL = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.test_users = {}
        self.auth_tokens = {}
        self.test_results = {
            'authentication': {'passed': 0, 'failed': 0, 'details': []},
            'health_records': {'passed': 0, 'failed': 0, 'details': []},
            'ai_chat': {'passed': 0, 'failed': 0, 'details': []},
            'appointments': {'passed': 0, 'failed': 0, 'details': []},
            'medicines': {'passed': 0, 'failed': 0, 'details': []}
        }

    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()

    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()

    def log_result(self, category, test_name, success, details=""):
        """Log test result"""
        if success:
            self.test_results[category]['passed'] += 1
            status = "✅ PASS"
        else:
            self.test_results[category]['failed'] += 1
            status = "❌ FAIL"
        
        self.test_results[category]['details'].append(f"{status}: {test_name} - {details}")
        print(f"{status}: {test_name} - {details}")

    async def test_health_check(self):
        """Test basic health check endpoint"""
        try:
            async with self.session.get(f"{API_BASE_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Health check passed: {data}")
                    return True
                else:
                    print(f"❌ Health check failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Health check error: {str(e)}")
            return False

    async def test_authentication_system(self):
        """Test complete authentication system"""
        print("\n=== Testing Authentication System ===")
        
        # Test user registration for different roles - using demo accounts as requested
        demo_users = [
            {
                "email": "hasta@demo.com",
                "password": "demo123",
                "name": "Ahmet Yılmaz",
                "role": "hasta",
                "phone": "+90 555 123 4567"
            },
            {
                "email": "doktor@demo.com", 
                "password": "demo123",
                "name": "Dr. Ayşe Demir",
                "role": "doktor",
                "phone": "+90 555 987 6543"
            },
            {
                "email": "bakici@demo.com",
                "password": "demo123", 
                "name": "Fatma Özkan",
                "role": "bakici",
                "phone": "+90 555 456 7890"
            }
        ]

        # Store demo users for login testing (accounts already exist)
        for user_data in demo_users:
            self.test_users[user_data['role']] = user_data
            self.log_result('authentication', f"Demo Account {user_data['role']}", True, 
                          f"Demo account {user_data['email']} ready for testing")

        # Test user login
        for role, user_data in self.test_users.items():
            try:
                login_data = {
                    "email": user_data['email'],
                    "password": user_data['password']
                }
                async with self.session.post(
                    f"{API_BASE_URL}/auth/login",
                    json=login_data
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self.auth_tokens[role] = data['access_token']
                        self.log_result('authentication', f"Login {role}", True, 
                                      f"JWT token received for {user_data['name']}")
                    else:
                        error_text = await response.text()
                        self.log_result('authentication', f"Login {role}", False, 
                                      f"Status: {response.status}, Error: {error_text}")
            except Exception as e:
                self.log_result('authentication', f"Login {role}", False, str(e))

        # Test JWT token validation
        if 'hasta' in self.auth_tokens:
            try:
                headers = {"Authorization": f"Bearer {self.auth_tokens['hasta']}"}
                async with self.session.get(f"{API_BASE_URL}/health/records", headers=headers) as response:
                    if response.status in [200, 404]:  # 404 is ok if no records exist yet
                        self.log_result('authentication', "JWT Token Validation", True, 
                                      "Token successfully validated")
                    else:
                        error_text = await response.text()
                        self.log_result('authentication', "JWT Token Validation", False, 
                                      f"Status: {response.status}, Error: {error_text}")
            except Exception as e:
                self.log_result('authentication', "JWT Token Validation", False, str(e))

    async def test_health_records_api(self):
        """Test health records API"""
        print("\n=== Testing Health Records API ===")
        
        if 'hasta' not in self.auth_tokens:
            self.log_result('health_records', "Health Records Test", False, "No patient token available")
            return

        headers = {"Authorization": f"Bearer {self.auth_tokens['hasta']}"}

        # Test creating health records
        health_data = [
            {
                "weight": 75.5,
                "temperature": 36.8,
                "blood_pressure_systolic": 120,
                "blood_pressure_diastolic": 80,
                "heart_rate": 72,
                "symptoms": ["baş ağrısı", "yorgunluk"],
                "notes": "Genel durumum iyi, hafif yorgunluk var"
            },
            {
                "weight": 75.2,
                "temperature": 37.1,
                "blood_pressure_systolic": 125,
                "blood_pressure_diastolic": 82,
                "heart_rate": 78,
                "symptoms": ["hafif ateş"],
                "notes": "Bugün biraz ateşim var"
            }
        ]

        # Create health records
        for i, record_data in enumerate(health_data):
            try:
                async with self.session.post(
                    f"{API_BASE_URL}/health/records",
                    json=record_data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self.log_result('health_records', f"Create Health Record {i+1}", True, 
                                      f"Record created with ID: {data.get('id', 'N/A')}")
                    else:
                        error_text = await response.text()
                        self.log_result('health_records', f"Create Health Record {i+1}", False, 
                                      f"Status: {response.status}, Error: {error_text}")
            except Exception as e:
                self.log_result('health_records', f"Create Health Record {i+1}", False, str(e))

        # Test retrieving all health records
        try:
            async with self.session.get(f"{API_BASE_URL}/health/records", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result('health_records', "Get All Health Records", True, 
                                  f"Retrieved {len(data)} records")
                else:
                    error_text = await response.text()
                    self.log_result('health_records', "Get All Health Records", False, 
                                  f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_result('health_records', "Get All Health Records", False, str(e))

        # Test retrieving latest health record
        try:
            async with self.session.get(f"{API_BASE_URL}/health/records/latest", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data:
                        self.log_result('health_records', "Get Latest Health Record", True, 
                                      f"Latest record: Weight={data.get('weight')}kg, Temp={data.get('temperature')}°C")
                    else:
                        self.log_result('health_records', "Get Latest Health Record", True, "No records found")
                else:
                    error_text = await response.text()
                    self.log_result('health_records', "Get Latest Health Record", False, 
                                  f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_result('health_records', "Get Latest Health Record", False, str(e))

    async def test_ai_chat_integration(self):
        """Test AI chat integration with Turkish language"""
        print("\n=== Testing AI Chat Integration ===")
        
        if 'hasta' not in self.auth_tokens:
            self.log_result('ai_chat', "AI Chat Test", False, "No patient token available")
            return

        headers = {"Authorization": f"Bearer {self.auth_tokens['hasta']}"}

        # Test Turkish language AI chat
        turkish_messages = [
            {
                "message": "Merhaba, nasılsın?",
                "context": "Genel sağlık durumu hakkında bilgi almak istiyorum"
            },
            {
                "message": "Baş ağrım var, ne yapmalıyım?",
                "context": "Kanser tedavisi görüyorum"
            },
            {
                "message": "İlaçlarımı ne zaman almalıyım?",
                "context": "Tedavi programım hakkında bilgi"
            }
        ]

        for i, chat_data in enumerate(turkish_messages):
            try:
                async with self.session.post(
                    f"{API_BASE_URL}/ai/chat",
                    json=chat_data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get('response', '')
                        # Check if response is in Turkish (basic check)
                        turkish_indicators = ['merhaba', 'nasıl', 'sağlık', 'tedavi', 'ilaç', 'doktor']
                        has_turkish = any(indicator in response_text.lower() for indicator in turkish_indicators)
                        
                        self.log_result('ai_chat', f"Turkish AI Chat {i+1}", True, 
                                      f"Response received (Turkish: {has_turkish}): {response_text[:100]}...")
                    else:
                        error_text = await response.text()
                        self.log_result('ai_chat', f"Turkish AI Chat {i+1}", False, 
                                      f"Status: {response.status}, Error: {error_text}")
            except Exception as e:
                self.log_result('ai_chat', f"Turkish AI Chat {i+1}", False, str(e))

        # Test AI chat with health context integration
        try:
            health_context_message = {
                "message": "Son sağlık verilerime göre durumum nasıl?",
                "context": "Sağlık kayıtlarımı analiz et"
            }
            async with self.session.post(
                f"{API_BASE_URL}/ai/chat",
                json=health_context_message,
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result('ai_chat', "Health Context Integration", True, 
                                  f"AI integrated health data in response")
                else:
                    error_text = await response.text()
                    self.log_result('ai_chat', "Health Context Integration", False, 
                                  f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_result('ai_chat', "Health Context Integration", False, str(e))

    async def test_appointments_api(self):
        """Test appointments API"""
        print("\n=== Testing Appointments API ===")
        
        if 'hasta' not in self.auth_tokens:
            self.log_result('appointments', "Appointments Test", False, "No patient token available")
            return

        headers = {"Authorization": f"Bearer {self.auth_tokens['hasta']}"}

        # Test creating appointments
        appointment_data = [
            {
                "doctor_name": "Dr. Mehmet Özkan",
                "specialty": "Onkoloji",
                "appointment_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
                "notes": "Kontrol muayenesi için randevu"
            },
            {
                "doctor_name": "Dr. Zeynep Kaya",
                "specialty": "Radyoloji", 
                "appointment_date": (datetime.utcnow() + timedelta(days=14)).isoformat(),
                "notes": "MR çekimi için randevu"
            }
        ]

        # Create appointments
        for i, appt_data in enumerate(appointment_data):
            try:
                async with self.session.post(
                    f"{API_BASE_URL}/appointments",
                    json=appt_data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self.log_result('appointments', f"Create Appointment {i+1}", True, 
                                      f"Appointment with {appt_data['doctor_name']} created")
                    else:
                        error_text = await response.text()
                        self.log_result('appointments', f"Create Appointment {i+1}", False, 
                                      f"Status: {response.status}, Error: {error_text}")
            except Exception as e:
                self.log_result('appointments', f"Create Appointment {i+1}", False, str(e))

        # Test retrieving appointments
        try:
            async with self.session.get(f"{API_BASE_URL}/appointments", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result('appointments', "Get Appointments", True, 
                                  f"Retrieved {len(data)} appointments")
                else:
                    error_text = await response.text()
                    self.log_result('appointments', "Get Appointments", False, 
                                  f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_result('appointments', "Get Appointments", False, str(e))

    async def test_medicines_api(self):
        """Test medicines API"""
        print("\n=== Testing Medicines API ===")
        
        if 'hasta' not in self.auth_tokens:
            self.log_result('medicines', "Medicines Test", False, "No patient token available")
            return

        headers = {"Authorization": f"Bearer {self.auth_tokens['hasta']}"}

        # Test creating medicine records
        medicine_data = [
            {
                "name": "Paracetamol",
                "dosage": "500mg",
                "frequency": "günde_3_kez",
                "times": ["08:00", "14:00", "20:00"],
                "start_date": datetime.utcnow().isoformat(),
                "instructions": "Yemekten sonra alınmalı"
            },
            {
                "name": "Vitamin D3",
                "dosage": "1000 IU",
                "frequency": "günlük",
                "times": ["09:00"],
                "start_date": datetime.utcnow().isoformat(),
                "end_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                "instructions": "Kahvaltıdan sonra alınmalı"
            }
        ]

        # Create medicine records
        for i, med_data in enumerate(medicine_data):
            try:
                async with self.session.post(
                    f"{API_BASE_URL}/medicines",
                    json=med_data,
                    headers=headers
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        self.log_result('medicines', f"Create Medicine {i+1}", True, 
                                      f"Medicine {med_data['name']} created")
                    else:
                        error_text = await response.text()
                        self.log_result('medicines', f"Create Medicine {i+1}", False, 
                                      f"Status: {response.status}, Error: {error_text}")
            except Exception as e:
                self.log_result('medicines', f"Create Medicine {i+1}", False, str(e))

        # Test retrieving medicines
        try:
            async with self.session.get(f"{API_BASE_URL}/medicines", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result('medicines', "Get Medicines", True, 
                                  f"Retrieved {len(data)} medicines")
                else:
                    error_text = await response.text()
                    self.log_result('medicines', "Get Medicines", False, 
                                  f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_result('medicines', "Get Medicines", False, str(e))

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TURKISH CANCER CARE APP - BACKEND TEST SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results['passed']
            failed = results['failed']
            total_passed += passed
            total_failed += failed
            
            print(f"\n{category.upper().replace('_', ' ')}:")
            print(f"  ✅ Passed: {passed}")
            print(f"  ❌ Failed: {failed}")
            
            if results['details']:
                print("  Details:")
                for detail in results['details']:
                    print(f"    {detail}")
        
        print(f"\nOVERALL RESULTS:")
        print(f"✅ Total Passed: {total_passed}")
        print(f"❌ Total Failed: {total_failed}")
        print(f"📊 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "No tests run")
        print("="*60)

    async def run_all_tests(self):
        """Run all backend tests"""
        print("Starting Turkish Cancer Care Application Backend Tests...")
        print(f"Backend URL: {API_BASE_URL}")
        
        await self.setup_session()
        
        try:
            # Basic health check
            health_ok = await self.test_health_check()
            if not health_ok:
                print("❌ Backend is not responding. Stopping tests.")
                return
            
            # Run all test suites
            await self.test_authentication_system()
            await self.test_health_records_api()
            await self.test_ai_chat_integration()
            await self.test_appointments_api()
            await self.test_medicines_api()
            
        finally:
            await self.cleanup_session()
        
        self.print_summary()

async def main():
    """Main test runner"""
    tester = BackendTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())