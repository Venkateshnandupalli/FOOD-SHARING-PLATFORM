from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from database import get_db
from auth import verify_user, User

router = APIRouter(
    prefix="/api/deliveries",
    tags=["Deliveries"]
)

class ClaimDeliveryReq(BaseModel):
    match_id: str
    volunteer_id: str

class UpdateStatusReq(BaseModel):
    status: str

@router.get("/available")
def get_available_deliveries(db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Fetch matches that need a driver (calls Supabase RPC)."""
    query = text("SELECT * FROM get_available_deliveries()")
    result = db.execute(query).mappings().all()
    return result

@router.post("/claim")
def claim_delivery(req: ClaimDeliveryReq, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Claim a delivery."""
    query = text("""
        INSERT INTO deliveries (match_id, volunteer_id, status, scheduled_pickup_at)
        VALUES (:match_id, :volunteer_id, 'ASSIGNED', NOW())
        RETURNING *
    """)
    try:
        result = db.execute(query, {"match_id": req.match_id, "volunteer_id": req.volunteer_id}).mappings().fetchone()
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/volunteer/{volunteer_id}")
def get_my_deliveries(volunteer_id: str, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Fetch active deliveries for a volunteer."""
    # A simplified join returning necessary info
    query = text("""
        SELECT del.*, 
               m.id as match_id, m.status as match_status,
               d.title as donation_title,
               o.organization_name as recipient_name
        FROM deliveries del
        JOIN matches m ON m.id = del.match_id
        JOIN donations d ON d.id = m.donation_id
        JOIN organizations o ON o.id = m.recipient_id
        WHERE del.volunteer_id = :volunteer_id
        ORDER BY del.created_at DESC
    """)
    result = db.execute(query, {"volunteer_id": volunteer_id}).mappings().all()
    return result

@router.patch("/{delivery_id}/status")
def update_delivery_status(delivery_id: str, req: UpdateStatusReq, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Update delivery status."""
    query = text("""
        UPDATE deliveries 
        SET status = :status, updated_at = NOW()
        WHERE id = :id
        RETURNING *
    """)
    try:
        result = db.execute(query, {"status": req.status, "id": delivery_id}).mappings().fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Delivery not found")
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
