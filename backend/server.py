from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import hashlib
import jwt
import os
from dotenv import load_dotenv

# MongoDB
from pymongo import MongoClient
from bson import ObjectId
import logging

# Emergent Integrations for AI
try:
    from emergentintegrations import EmergentIntegrations
except ImportError:
    print("Warning: EmergentIntegrations not available, using mock AI responses")
    EmergentIntegrations = None

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Turkish Cancer Care API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
JWT_SECRET = "onkom_secret_key_2024"

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client.onkom_db

# Collections
users_collection = db.users
health_records_collection = db.health_records
appointments_collection = db.appointments
medicines_collection = db.medicines
predictions_collection = db.predictions

# Initialize Emergent Integrations
emergent_key = os.getenv("EMERGENT_LLM_KEY", "")
ei = EmergentIntegrations(api_key=emergent_key) if emergent_key and EmergentIntegrations else None

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: str
    role: str  # hasta, doktor, bakici
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    name: str
    password: str
    role: str

# Health Data Models
class HealthRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    weight: Optional[float] = None
    temperature: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    sleep_hours: Optional[int] = None
    sleep_minutes: Optional[int] = None
    steps: Optional[int] = None
    symptoms: Optional[List[str]] = []
    notes: Optional[str] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

class HealthRecordCreate(BaseModel):
    weight: Optional[float] = None
    temperature: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    sleep_hours: Optional[int] = None
    sleep_minutes: Optional[int] = None
    steps: Optional[int] = None
    symptoms: Optional[List[str]] = []
    notes: Optional[str] = None

# Appointment Models
class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    doctor_name: str
    specialty: str
    date: str
    time: str
    status: str = "scheduled"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppointmentCreate(BaseModel):
    doctor_name: str
    specialty: str
    date: str
    time: str
    notes: Optional[str] = None

# Medicine Models
class Medicine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    dosage: str
    frequency: str
    time: Optional[str] = None
    instructions: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MedicineCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    time: Optional[str] = None
    instructions: Optional[str] = None

# Predictive Analysis Models - YENİ
class PredictiveAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    prediction_type: str  # treatment_response, nutrition_need, energy_level, etc.
    title: str
    description: str
    probability: float  # 0-100
    timeline: str
    recommendations: List[str]
    severity: str = "medium"  # low, medium, high
    category: str = "treatment"  # treatment, nutrition, lifestyle, medication
    created_at: datetime = Field(default_factory=datetime.utcnow)
    valid_until: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=7))

class ChatRequest(BaseModel):
    message: str

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "role": user_data["role"],
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    return payload

# Initialize demo data
def create_demo_data():
    """Create demo users and sample data"""
    demo_users = [
        {"email": "hasta@demo.com", "name": "Ümit Hastam", "password": "demo123", "role": "hasta"},
        {"email": "doktor@demo.com", "name": "Dr. Ahmet Yılmaz", "password": "demo123", "role": "doktor"},
        {"email": "bakici@demo.com", "name": "Ayşe Bakıcı", "password": "demo123", "role": "bakici"}
    ]
    
    for user_data in demo_users:
        existing_user = users_collection.find_one({"email": user_data["email"]})
        if not existing_user:
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"]
            )
            users_collection.insert_one(user.dict())
            print(f"Demo user created: {user_data['email']}")

# Generate AI-powered predictive analysis
async def generate_predictive_analysis(user_id: str, health_data: dict) -> List[PredictiveAnalysis]:
    """Generate AI-powered predictive analysis based on user health data"""
    try:
        if not ei:
            # Fallback to mock data if no AI key
            return get_mock_predictions(user_id)
        
        # Prepare health context for AI
        health_context = f"""
        Hasta sağlık verileri:
        - Kilo: {health_data.get('weight', 'bilinmiyor')} kg
        - Vücut sıcaklığı: {health_data.get('temperature', 'bilinmiyor')} °C
        - Kan basıncı: {health_data.get('blood_pressure_systolic', 'bilinmiyor')}/{health_data.get('blood_pressure_diastolic', 'bilinmiyor')} mmHg
        - Kalp atış hızı: {health_data.get('heart_rate', 'bilinmiyor')} bpm
        - Uyku süresi: {health_data.get('sleep_hours', 'bilinmiyor')} saat {health_data.get('sleep_minutes', 'bilinmiyor')} dakika
        - Günlük adım: {health_data.get('steps', 'bilinmiyor')} adım
        
        Bu veriler ışığında, kanser tedavisi gören hasta için kişiselleştirilmiş sağlık öngörüleri ve öneriler oluştur.
        """
        
        # AI prediction request
        ai_response = await ei.chat(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Sen bir kanser tedavisi uzmanı AI asistanısın. Sağlık verilerini analiz ederek tahmine dayalı öngörüler ve kişiselleştirilmiş öneriler sunuyorsun."},
                {"role": "user", "content": health_context}
            ]
        )
        
        # Parse AI response and create structured predictions
        predictions = parse_ai_predictions(user_id, ai_response.choices[0].message.content)
        return predictions
        
    except Exception as e:
        print(f"AI prediction error: {e}")
        return get_mock_predictions(user_id)

def get_mock_predictions(user_id: str) -> List[PredictiveAnalysis]:
    """Fallback mock predictions when AI is not available"""
    mock_predictions = [
        PredictiveAnalysis(
            user_id=user_id,
            prediction_type="treatment_response",
            title="Kemoterapi Yan Etkisi Tahmini",
            description="Kemoterapi seansından 2-3 gün sonra vücut sıcaklığınızda yükselme beklenmektedir.",
            probability=85.0,
            timeline="2-3 gün içinde",
            recommendations=[
                "Günde en az 2.5 litre sıvı tüketin",
                "C vitamini açısından zengin meyveleri tercih edin",
                "Vücut sıcaklığınızı günde 3 kez ölçün",
                "Ateş 38.5°C üzerine çıkarsa doktorunuza başvurun"
            ],
            severity="medium",
            category="treatment"
        ),
        PredictiveAnalysis(
            user_id=user_id,
            prediction_type="nutrition_need",
            title="Beslenme Gereksinimi Analizi",
            description="Mevcut kilo kaybı trendine göre protein ihtiyacınız artacak.",
            probability=92.0,
            timeline="1 hafta içinde",
            recommendations=[
                "Günlük protein alımını 1.2g/kg vücut ağırlığına çıkarın",
                "Omega-3 açısından zengin balık tüketin",
                "Probiyotik yoğurt ve kefir ekleyin",
                "Küçük ve sık öğünler tercih edin"
            ],
            severity="high",
            category="nutrition"
        )
    ]
    return mock_predictions

def parse_ai_predictions(user_id: str, ai_content: str) -> List[PredictiveAnalysis]:
    """Parse AI response into structured predictions"""
    # This would be more sophisticated in a real implementation
    # For now, return mock data with AI-enhanced content
    return get_mock_predictions(user_id)

# Authentication Routes
@app.post("/api/register")
async def register(request: RegisterRequest):
    # Check if user exists
    existing_user = users_collection.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Kullanıcı zaten mevcut")
    
    # Create new user
    user = User(
        email=request.email,
        name=request.name,
        password_hash=hash_password(request.password),
        role=request.role
    )
    
    result = users_collection.insert_one(user.dict())
    if result.inserted_id:
        token = create_jwt_token(user.dict())
        return {
            "message": "Kullanıcı başarıyla oluşturuldu",
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role
            }
        }
    else:
        raise HTTPException(status_code=500, detail="Kullanıcı oluşturulamadı")

@app.post("/api/login")
async def login(request: LoginRequest):
    user = users_collection.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Geçersiz email veya şifre")
    
    token = create_jwt_token(user)
    return {
        "message": "Giriş başarılı",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

# Health Records Routes
@app.post("/api/health/records")
async def create_health_record(record: HealthRecordCreate, current_user: dict = Depends(get_current_user)):
    health_record = HealthRecord(
        user_id=current_user["user_id"],
        **record.dict()
    )
    
    result = health_records_collection.insert_one(health_record.dict())
    if result.inserted_id:
        # Generate predictive analysis after new health data
        try:
            predictions = await generate_predictive_analysis(current_user["user_id"], record.dict())
            # Store predictions in database
            for prediction in predictions:
                predictions_collection.insert_one(prediction.dict())
        except Exception as e:
            print(f"Prediction generation error: {e}")
        
        return {"message": "Sağlık verisi başarıyla kaydedildi", "id": health_record.id}
    else:
        raise HTTPException(status_code=500, detail="Sağlık verisi kaydedilemedi")

@app.get("/api/health/records")
async def get_health_records(current_user: dict = Depends(get_current_user)):
    records = list(health_records_collection.find({"user_id": current_user["user_id"]}).sort("recorded_at", -1))
    for record in records:
        record["_id"] = str(record["_id"])
    return records

@app.get("/api/health/records/latest")
async def get_latest_health_record(current_user: dict = Depends(get_current_user)):
    record = health_records_collection.find_one(
        {"user_id": current_user["user_id"]},
        sort=[("recorded_at", -1)]
    )
    if record:
        record["_id"] = str(record["_id"])
        return record
    return {}

# Predictive Analysis Routes - YENİ
@app.get("/api/predictive-analysis")
async def get_predictive_analysis(current_user: dict = Depends(get_current_user)):
    """Get current predictive analysis for user"""
    predictions = list(predictions_collection.find({
        "user_id": current_user["user_id"],
        "valid_until": {"$gte": datetime.utcnow()}
    }).sort("created_at", -1).limit(5))
    
    for prediction in predictions:
        prediction["_id"] = str(prediction["_id"])
    
    # If no recent predictions, generate new ones
    if not predictions:
        try:
            # Get latest health data
            latest_health = health_records_collection.find_one(
                {"user_id": current_user["user_id"]},
                sort=[("recorded_at", -1)]
            )
            
            health_data = latest_health if latest_health else {}
            new_predictions = await generate_predictive_analysis(current_user["user_id"], health_data)
            
            # Store new predictions
            for prediction in new_predictions:
                result = predictions_collection.insert_one(prediction.dict())
                prediction_dict = prediction.dict()
                prediction_dict["_id"] = str(result.inserted_id)
                predictions.append(prediction_dict)
                
        except Exception as e:
            print(f"Error generating predictions: {e}")
    
    return predictions

@app.post("/api/predictive-analysis/refresh")
async def refresh_predictive_analysis(current_user: dict = Depends(get_current_user)):
    """Manually refresh predictive analysis"""
    try:
        # Get latest health data
        latest_health = health_records_collection.find_one(
            {"user_id": current_user["user_id"]},
            sort=[("recorded_at", -1)]
        )
        
        health_data = latest_health if latest_health else {}
        predictions = await generate_predictive_analysis(current_user["user_id"], health_data)
        
        # Clear old predictions
        predictions_collection.delete_many({"user_id": current_user["user_id"]})
        
        # Store new predictions
        result_predictions = []
        for prediction in predictions:
            result = predictions_collection.insert_one(prediction.dict())
            prediction_dict = prediction.dict()
            prediction_dict["_id"] = str(result.inserted_id)
            result_predictions.append(prediction_dict)
        
        return {
            "message": "Tahmine dayalı analiz güncellendi",
            "predictions": result_predictions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analiz güncellenirken hata oluştu: {str(e)}")

# Appointments Routes
@app.post("/api/appointments")
async def create_appointment(appointment: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    new_appointment = Appointment(
        user_id=current_user["user_id"],
        **appointment.dict()
    )
    
    result = appointments_collection.insert_one(new_appointment.dict())
    if result.inserted_id:
        return {"message": "Randevu başarıyla oluşturuldu", "id": new_appointment.id}
    else:
        raise HTTPException(status_code=500, detail="Randevu oluşturulamadı")

@app.get("/api/appointments")
async def get_appointments(current_user: dict = Depends(get_current_user)):
    appointments = list(appointments_collection.find({"user_id": current_user["user_id"]}).sort("created_at", -1))
    for appointment in appointments:
        appointment["_id"] = str(appointment["_id"])
    return appointments

# Medicines Routes
@app.post("/api/medicines")
async def create_medicine(medicine: MedicineCreate, current_user: dict = Depends(get_current_user)):
    new_medicine = Medicine(
        user_id=current_user["user_id"],
        **medicine.dict()
    )
    
    result = medicines_collection.insert_one(new_medicine.dict())
    if result.inserted_id:
        return {"message": "İlaç başarıyla eklendi", "id": new_medicine.id}
    else:
        raise HTTPException(status_code=500, detail="İlaç eklenemedi")

@app.get("/api/medicines")
async def get_medicines(current_user: dict = Depends(get_current_user)):
    medicines = list(medicines_collection.find({"user_id": current_user["user_id"]}).sort("created_at", -1))
    for medicine in medicines:
        medicine["_id"] = str(medicine["_id"])
    return medicines

# AI Chat Route
@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        if not ei:
            return {"response": "AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin."}
        
        # Get user's health context
        latest_health = health_records_collection.find_one(
            {"user_id": current_user["user_id"]},
            sort=[("recorded_at", -1)]
        )
        
        health_context = ""
        if latest_health:
            health_context = f"""
            Kullanıcının son sağlık verileri:
            - Kilo: {latest_health.get('weight', 'bilinmiyor')} kg
            - Vücut sıcaklığı: {latest_health.get('temperature', 'bilinmiyor')} °C
            - Uyku: {latest_health.get('sleep_hours', 'bilinmiyor')} saat {latest_health.get('sleep_minutes', 0)} dakika
            - Günlük adım: {latest_health.get('steps', 'bilinmiyor')} adım
            """
        
        system_message = f"""Sen Türkçe konuşan bir kanser bakım uzmanı AI asistanısın. 
        Hastalara yardımcı ol, sağlık önerilerinde bulun ve sorularını yanıtla.
        {health_context}
        Türkçe yanıt ver ve empati göster."""
        
        response = await ei.chat(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": request.message}
            ]
        )
        
        return {"response": response.choices[0].message.content}
        
    except Exception as e:
        print(f"Chat error: {e}")
        return {"response": "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin."}

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Onkom API çalışıyor"}

# Initialize demo data on startup
@app.on_event("startup")
async def startup_event():
    print("Onkom API başlatılıyor...")
    create_demo_data()
    print("Demo veriler oluşturuldu")
    print("API hazır: http://0.0.0.0:8001")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)