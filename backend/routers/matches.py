from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from auth import verify_user, User

router = APIRouter(
    prefix="/api/matches",
    tags=["Matches"]
)

class AcceptDonationReq(BaseModel):
    donation_id: str
    recipient_org_id: str

@router.post("/accept")
def accept_donation(req: AcceptDonationReq, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Manually accept a donation from the Browse page (calls Supabase RPC)."""
    query = text("""
        SELECT accept_donation(:donation_id, :org_id)
    """)
    try:
        db.execute(query, {"donation_id": req.donation_id, "org_id": req.recipient_org_id})
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate/{donation_id}")
def generate_matches(donation_id: str, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """AI Proactive Matching - Generates matches for a donation (calls Supabase RPC)."""
    query = text("""
        SELECT generate_matches_for_donation(:donation_id) as generated_count
    """)
    try:
        result = db.execute(query, {"donation_id": donation_id}).scalar()
        db.commit()
        return {"generated_count": result or 0}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/donation/{donation_id}")
def get_matches_for_donation(donation_id: str, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Get matches for a specific donation."""
    query = text("""
        SELECT m.*, 
               o.organization_name, o.contact_phone
        FROM matches m
        JOIN organizations o ON o.id = m.recipient_organization_id
        WHERE m.donation_id = :donation_id
        ORDER BY m.total_match_score DESC
    """)
    result = db.execute(query, {"donation_id": donation_id}).mappings().all()
    return result

@router.get("/recipient/{org_id}")
def get_matches_for_recipient(org_id: str, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Get pending matches for a specific recipient organization."""
    query = text("""
        SELECT m.*, 
               d.title as donation_title, d.food_category, d.quantity, d.quantity_unit,
               p.full_name as donor_name, p.profile_image_url
        FROM matches m
        JOIN donations d ON d.id = m.donation_id
        JOIN profiles p ON p.id = d.donor_id
        WHERE m.recipient_organization_id = :org_id AND m.match_status = 'PENDING'
        ORDER BY m.total_match_score DESC
    """)
    result = db.execute(query, {"org_id": org_id}).mappings().all()
    return result
