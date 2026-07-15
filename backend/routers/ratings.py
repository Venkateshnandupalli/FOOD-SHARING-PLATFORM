from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from database import get_db
from auth import verify_user, User

router = APIRouter(
    prefix="/api/ratings",
    tags=["Ratings"]
)

class SubmitRatingReq(BaseModel):
    delivery_id: str
    target_user_id: str
    rating: int
    feedback: str = None
    category: str

@router.post("/")
def submit_rating(req: SubmitRatingReq, db: Session = Depends(get_db), current_user: User = Depends(verify_user)):
    """Submit a rating (inserts directly into ratings table)."""
    query = text("""
        INSERT INTO ratings (delivery_id, reviewer_id, reviewed_user_id, rating, category, comments)
        VALUES (:delivery_id, :rater_id, :target_user_id, :rating, :category, :comments)
    """)
    try:
        db.execute(query, {
            "delivery_id": req.delivery_id,
            "rater_id": current_user.id,
            "target_user_id": req.target_user_id,
            "rating": req.rating,
            "category": req.category,
            "comments": req.feedback
        })
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
