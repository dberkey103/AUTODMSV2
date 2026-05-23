from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from .database import supabase

router = APIRouter()

class VehicleIn(BaseModel):
    model_config = {"extra": "ignore"}   # drop any fields not listed here

    vin:               Optional[str]   = ""
    stock:             Optional[str]   = ""
    year:              Optional[Any]   = None   # frontend sends string; DB coerces
    make:              Optional[str]   = ""
    model:             Optional[str]   = ""
    trim:              Optional[str]   = ""
    miles:             Optional[Any]   = 0      # frontend sends int after parseInt
    ext_color:         Optional[str]   = ""
    int_color:         Optional[str]   = ""
    source:            Optional[str]   = ""
    purchase_date_raw: Optional[str]   = ""
    price:             float           = 0
    cost:              float           = 0
    fp_amount:         float           = 0      # was floor_amt — matches frontend & table
    fp_rate:           float           = 0      # was floor_rate
    fp_days:           int             = 0      # was floor_days
    status:            str             = "In recon"
    recon:             Optional[List]  = []
    photos:            Optional[List]  = []

@router.get("/")
def get_inventory(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("inventory").select("*").order("created_at", desc=True).execute()
    return res.data

@router.post("/")
def add_vehicle(vehicle: VehicleIn, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("inventory").insert(vehicle.model_dump()).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Insert returned no data — check Supabase RLS policies")
    return res.data[0]

@router.put("/{vehicle_id}")
def update_vehicle(vehicle_id: int, data: Dict[str, Any], request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("inventory").update(data).eq("id", vehicle_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Vehicle not found or update failed")
    return res.data[0]

@router.delete("/{vehicle_id}")
def delete_vehicle(vehicle_id: int, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    supabase.table("inventory").delete().eq("id", vehicle_id).execute()
    return {"success": True}