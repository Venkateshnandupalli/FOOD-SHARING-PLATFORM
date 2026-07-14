from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import verify_user, User

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)

@router.get("/impact")
def get_impact_metrics(db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Fetch global impact metrics from the Postgres RPC."""
    try:
        # We can execute the Supabase RPC function directly via SQLAlchemy
        result = db.execute(text("SELECT * FROM get_impact_metrics()")).scalar()
        if not result:
            return {
                "totalMeals": 0,
                "co2PreventedKg": 0,
                "waterSavedLiters": 0,
                "activeUsers": 0,
                "verifiedOrgs": 0
            }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/demand-forecast")
def get_demand_forecast(db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Fetch the ML demand forecast hotspots."""
    try:
        result = db.execute(text("SELECT * FROM get_demand_forecast()")).scalar()
        return result if result else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/donation-trends")
def get_donation_trends(db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Fetch trailing 7-day donation trends."""
    try:
        result = db.execute(text("SELECT * FROM get_donation_trends()")).scalar()
        return result if result else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
