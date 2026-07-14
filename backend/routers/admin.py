from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

class StatusUpdateReq(BaseModel):
    status: str

@router.get("/metrics")
def get_system_metrics(db: Session = Depends(get_db)):
    """Get high level system metrics."""
    query = text("""
        SELECT 
            (SELECT COUNT(*) FROM profiles WHERE role = 'DONOR') as total_users,
            (SELECT COUNT(*) FROM organizations WHERE verification_status = 'APPROVED') as total_approved_orgs,
            (SELECT COUNT(*) FROM donations) as total_donations,
            (SELECT COUNT(*) FROM deliveries WHERE status = 'DELIVERED') as successful_deliveries
    """)
    result = db.execute(query).mappings().fetchone()
    return result

@router.get("/organizations/pending")
def get_pending_organizations(db: Session = Depends(get_db)):
    """Fetch organizations awaiting approval."""
    query = text("""
        SELECT o.*, 
               p.full_name as owner_name, p.phone as owner_phone
        FROM organizations o
        JOIN profiles p ON p.id = o.owner_id
        WHERE o.verification_status = 'PENDING'
        ORDER BY o.created_at ASC
    """)
    result = db.execute(query).mappings().all()
    return result

@router.patch("/organizations/{org_id}/status")
def update_organization_status(org_id: str, req: StatusUpdateReq, db: Session = Depends(get_db)):
    """Approve or Reject an organization."""
    query = text("""
        UPDATE organizations
        SET verification_status = :status, updated_at = NOW()
        WHERE id = :id
        RETURNING *
    """)
    try:
        result = db.execute(query, {"status": req.status, "id": org_id}).mappings().fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Organization not found")
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
