from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from database import supabase

router = APIRouter()

class RORequest(BaseModel):
    ro_num: str
    vehicle_id: Optional[int] = None
    customer_name: Optional[str] = ""
    vin: Optional[str] = ""
    year: Optional[int] = None
    make: Optional[str] = ""
    model: Optional[str] = ""
    trim: Optional[str] = ""
    miles: Optional[str] = ""
    advisor: Optional[str] = ""
    tech: Optional[str] = ""
    jobs: Optional[list] = []
    status: str = "Open"
    notes: Optional[str] = ""
    promise_date: Optional[str] = ""

@router.get("/")
def get_ros(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("repair_orders").select("*").order("created_at", desc=True).execute()
    return res.data

@router.post("/")
def save_ro(ro: RORequest, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("repair_orders").upsert(ro.dict(), on_conflict="ro_num").execute()
    return res.data[0]

@router.put("/{ro_num}")
def update_ro(ro_num: str, data: dict, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("repair_orders").update(data).eq("ro_num", ro_num).execute()
    return res.data[0]

@router.delete("/{ro_num}")
def delete_ro(ro_num: str, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    supabase.table("repair_orders").delete().eq("ro_num", ro_num).execute()
    return {"success": True}