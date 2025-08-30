from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
ALGORITHM = os.environ.get('ALGORITHM')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', 1440))

# Create the main app without a prefix
app = FastAPI(title="Türkçe Kanser Bakım Uygulaması API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# AI Chat instance
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# User Models
class UserRole(str):
    PATIENT = "hasta"
    DOCTOR = "doktor" 
    CAREGIVER = "bakici"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    birth_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str
    phone: Optional[str] = None
    birth_date: Optional[datetime] = None

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

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
    patient_id: str
    doctor_id: Optional[str] = None
    doctor_name: str
    specialty: str
    appointment_date: datetime
    status: str = "scheduled"  # scheduled, completed, cancelled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AppointmentCreate(BaseModel):
    doctor_name: str
    specialty: str
    appointment_date: datetime
    notes: Optional[str] = None

# Medicine Models
class Medicine(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    dosage: str
    frequency: str  # daily, twice_daily, weekly, etc.
    times: List[str]  # ["08:00", "20:00"]
    start_date: datetime
    end_date: Optional[datetime] = None
    instructions: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MedicineCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    times: List[str]
    start_date: datetime
    end_date: Optional[datetime] = None
    instructions: Optional[str] = None

# AI Chat Models
class AIChat(BaseModel):
    message: str
    context: Optional[str] = None

class AIChatResponse(BaseModel):
    response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return User(**user)

# Authentication routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict['password']
    user_dict['hashed_password'] = hashed_password
    
    user = User(**user_dict)
    # Insert with hashed password included
    user_doc = user.dict()
    user_doc['hashed_password'] = hashed_password
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc or not verify_password(login_data.password, user_doc.get('hashed_password')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = User(**user_doc)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user)

# Health data routes
@api_router.post("/health/records", response_model=HealthRecord)
async def create_health_record(record_data: HealthRecordCreate, current_user: User = Depends(get_current_user)):
    record_dict = record_data.dict()
    record_dict['user_id'] = current_user.id
    record = HealthRecord(**record_dict)
    await db.health_records.insert_one(record.dict())
    return record

@api_router.get("/health/records", response_model=List[HealthRecord])
async def get_health_records(current_user: User = Depends(get_current_user)):
    records = await db.health_records.find({"user_id": current_user.id}).sort("recorded_at", -1).to_list(100)
    return [HealthRecord(**record) for record in records]

@api_router.get("/health/records/latest", response_model=Optional[HealthRecord])
async def get_latest_health_record(current_user: User = Depends(get_current_user)):
    record = await db.health_records.find_one({"user_id": current_user.id}, sort=[("recorded_at", -1)])
    if record:
        return HealthRecord(**record)
    return None

# Appointment routes
@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(appointment_data: AppointmentCreate, current_user: User = Depends(get_current_user)):
    appointment_dict = appointment_data.dict()
    appointment_dict['patient_id'] = current_user.id
    appointment = Appointment(**appointment_dict)
    await db.appointments.insert_one(appointment.dict())
    return appointment

@api_router.get("/appointments", response_model=List[Appointment])
async def get_appointments(current_user: User = Depends(get_current_user)):
    appointments = await db.appointments.find({"patient_id": current_user.id}).sort("appointment_date", 1).to_list(100)
    return [Appointment(**appointment) for appointment in appointments]

# Medicine routes
@api_router.post("/medicines", response_model=Medicine)
async def create_medicine(medicine_data: MedicineCreate, current_user: User = Depends(get_current_user)):
    medicine_dict = medicine_data.dict()
    medicine_dict['user_id'] = current_user.id
    medicine = Medicine(**medicine_dict)
    await db.medicines.insert_one(medicine.dict())
    return medicine

@api_router.get("/medicines", response_model=List[Medicine])
async def get_medicines(current_user: User = Depends(get_current_user)):
    medicines = await db.medicines.find({"user_id": current_user.id, "is_active": True}).to_list(100)
    return [Medicine(**medicine) for medicine in medicines]

# AI Chat route
@api_router.post("/ai/chat", response_model=AIChatResponse)
async def ai_chat(chat_data: AIChat, current_user: User = Depends(get_current_user)):
    try:
        # Get user's recent health data for context
        recent_record = await db.health_records.find_one(
            {"user_id": current_user.id}, 
            sort=[("recorded_at", -1)]
        )
        
        # Build context message
        context = f"""
        Sen Türkçe konuşan bir kanser bakım asistanısın. Hastaya yardımcı olmak için buradासın.
        
        Kullanıcı bilgileri:
        - İsim: {current_user.name}
        - Rol: {current_user.role}
        """
        
        if recent_record:
            context += f"""
        
        Son sağlık verileri:
        - Kilo: {recent_record.get('weight', 'Kayıtlı değil')} kg
        - Ateş: {recent_record.get('temperature', 'Kayıtlı değil')} °C
        - Tansiyon: {recent_record.get('blood_pressure_systolic', 'Kayıtlı değil')}/{recent_record.get('blood_pressure_diastolic', 'Kayıtlı değil')} mmHg
        - Kalp atışı: {recent_record.get('heart_rate', 'Kayıtlı değil')} bpm
        - Semptomlar: {', '.join(recent_record.get('symptoms', [])) if recent_record.get('symptoms') else 'Kayıtlı değil'}
        """
        
        if chat_data.context:
            context += f"\n\nEk context: {chat_data.context}"
        
        # Initialize AI chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"user_{current_user.id}",
            system_message=context
        ).with_model("openai", "gpt-4o-mini")
        
        # Send message
        user_message = UserMessage(text=chat_data.message)
        response = await chat.send_message(user_message)
        
        return AIChatResponse(response=response)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat error: {str(e)}")

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "Türkçe Kanser Bakım Uygulaması API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()