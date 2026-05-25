from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from passlib.hash import bcrypt as bcrypt_ctx
from .database import supabase

router = APIRouter()

class UserRequest(BaseModel):
    id: Optional[int] = None
    first: str
    last: str
    username: str
    password: Optional[str] = ""
    role: str = "salesperson"
    active: bool = True

@router.get("/")
def get_users(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("users").select("id,first,last,username,role,active").execute()
    return res.data

@router.post("/")
def save_user(user: UserRequest, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    data = user.dict()
    if data.get("id"):
        if not data.get("password"):
            data.pop("password")
        else:
            data["password"] = bcrypt_ctx.hash(data["password"])
        res = supabase.table("users").update(data).eq("id", data["id"]).execute()
    else:
        if data.get("password"):
            data["password"] = bcrypt_ctx.hash(data["password"])
        res = supabase.table("users").insert(data).execute()
    return res.data[0]
