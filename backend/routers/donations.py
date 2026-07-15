from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from auth import User, verify_user
from database import get_db

router = APIRouter(
    prefix="/api/donations",
    tags=["Donations"]
)

# Pydantic Schemas for Input/Output Validation
class DonationCreate(BaseModel):
    donor_id: str
    title: str
    description: Optional[str] = None
    food_category: str
    dietary_type: str
    quantity: float
    quantity_unit: str
    estimated_servings: int
    prepared_at: datetime
    use_before: datetime
    storage_type: str
    packaging_status: str
    allergen_information: Optional[str] = None
    pickup_address: str
    pickup_latitude: float
    pickup_longitude: float
    donor_notes: Optional[str] = None
    food_safety_acknowledged: bool = False
    status: str = "AVAILABLE"

@router.get("/donor/{donor_id}")
def get_donor_donations(donor_id: str, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Fetch all donations created by a specific donor."""
    query = text("""
        SELECT * FROM donations
        WHERE donor_id = :donor_id
        ORDER BY created_at DESC
    """)
    result = db.execute(query, {"donor_id": donor_id}).mappings().all()
    return result

@router.get("/available")
def get_available_donations(db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Fetch all available donations (For recipients)."""
    query = text("""
        SELECT d.*, 
               p.full_name as donor_name, p.profile_image_url
        FROM donations d
        JOIN profiles p ON p.id = d.donor_id
        WHERE d.status = 'AVAILABLE'
        ORDER BY d.created_at DESC
    """)
    result = db.execute(query).mappings().all()
    return result

@router.post("/")
def create_donation(donation: DonationCreate, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Create a new donation."""
    query = text("""
        INSERT INTO donations (
            donor_id, title, description, food_category, dietary_type,
            quantity, quantity_unit, estimated_servings, prepared_at, use_before,
            storage_type, packaging_status, allergen_information,
            pickup_address, pickup_latitude, pickup_longitude, donor_notes,
            food_safety_acknowledged, status
        ) VALUES (
            :donor_id, :title, :description, :food_category, :dietary_type,
            :quantity, :quantity_unit, :estimated_servings, :prepared_at, :use_before,
            :storage_type, :packaging_status, :allergen_information,
            :pickup_address, :pickup_latitude, :pickup_longitude, :donor_notes,
            :food_safety_acknowledged, :status
        )
        RETURNING *
    """)
    try:
        result = db.execute(query, donation.model_dump()).mappings().fetchone()
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{donation_id}/status")
def update_donation_status(donation_id: str, status: str, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Update the status of a donation."""
    query = text("""
        UPDATE donations 
        SET status = :status, updated_at = NOW()
        WHERE id = :id
        RETURNING *
    """)
    try:
        result = db.execute(query, {"status": status, "id": donation_id}).mappings().fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Donation not found")
        db.commit()
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
