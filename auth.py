from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel
from database import supabase

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    res = supabase.table("users").select("*").eq("username", req.username).eq("password", req.password).eq("active", True).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = res.data[0]
    user.pop("password", None)
    return {"success": True, "user": user}

@router.post("/logout")
def logout():
    return {"success": True}

@router.get("/me")
def me(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("users").select("id,first,last,username,role,active").eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=401, detail="User not found")
    return res.data[0]