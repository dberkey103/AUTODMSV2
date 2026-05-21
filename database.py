from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from database import supabase

router = APIRouter()

class VehicleRequest(BaseModel):
    stock: str
    year: int
    make: str
    model: str
    trim: Optional[str] = ""
    miles: Optional[str] = "0"
    price: float = 0
    cost: float = 0
    vin: Optional[str] = ""
    source: Optional[str] = ""
    purchase_date: Optional[str] = ""
    purchase_date_raw: Optional[str] = ""
    ext_color: Optional[str] = ""
    int_color: Optional[str] = ""
    floor_amt: float = 0
    floor_rate: float = 6.9
    floor_days: int = 0
    status: str = "Available"
    recon: Optional[list] = []
    photos: Optional[list] = []
    exports: Optional[dict] = {}

@router.get("/")
def get_inventory(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("inventory").select("*").order("created_at", desc=True).execute()
    return res.data

@router.post("/")
def add_vehicle(vehicle: VehicleRequest, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("inventory").insert(vehicle.dict()).execute()
    return res.data[0]

@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: int, data: dict, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("inventory").update(data).eq("id", vehicle_id).execute()
    return res.data[0]

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    supabase.table("inventory").delete().eq("id", vehicle_id).execute()
    return {"success": True}
