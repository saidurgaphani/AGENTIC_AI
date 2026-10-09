from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.database import get_db
from backend.app.models.schema import AppUser
from backend.app.auth import get_current_user, require_role, AuthenticatedUser

router = APIRouter(tags=["Auth & Users"])

@router.get("/me")
def get_current_authenticated_user(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    role_display = "SUPPLY_CHAIN_PLANNER" if user.role.lower() == "planner" else ("ADMIN" if user.role.lower() == "admin" else "VIEWER")

    user_obj = {
        "id": user.id,
        "email": user.email,
        "name": user.name or "Lead Resilience Planner",
        "role": role_display,
        "active": True,
    }

    return {
        "userId": user.id,
        "role": role_display,
        "email": user.email,
        "name": user.name,
        "user": user_obj,
    }

@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    user: AuthenticatedUser = Depends(require_role(["admin", "planner"]))
):
    users = db.query(AppUser).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role,
            "active": u.active,
            "createdAt": u.created_at.isoformat() if u.created_at else None,
            "lastActiveAt": u.last_active_at.isoformat() if u.last_active_at else None,
        }
        for u in users
    ]

@router.get("/users/{id}")
def get_user_by_id(id: str, db: Session = Depends(get_db)):
    u = db.query(AppUser).filter(AppUser.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": u.id,
        "email": u.email,
        "name": u.name,
        "role": u.role,
        "active": u.active,
    }
