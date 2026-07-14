from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from routers import analytics, donations, matches, admin, deliveries, ratings

app = FastAPI(
    title="SharePlate AI Backend",
    description="Python/FastAPI Backend for Food Sharing Platform",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to SharePlate AI FastAPI Backend!"}

@app.get("/health")
def health_check():
    db_status = "connected" if engine else "DATABASE_URL not configured"
    return {"status": "healthy", "database": db_status}

# Include routers
app.include_router(analytics.router)
app.include_router(donations.router)
app.include_router(matches.router)
app.include_router(admin.router)
app.include_router(deliveries.router)
app.include_router(ratings.router)
