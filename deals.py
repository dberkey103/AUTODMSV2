from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from database import supabase

router = APIRouter()

class DealRequest(BaseModel):
    deal_num: str
    vehicle_id: Optional[int] = None
    vehicle_name: Optional[str] = ""
    customer_first: Optional[str] = ""
    customer_last: Optional[str] = ""
    deal_type: str = "finance"
    status: str = "In progress"
    sell_price: float = 0
    cost: float = 0
    trade_value: float = 0
    trade_payoff: float = 0
    doc_fee: float = 0
    tax_rate: float = 0
    down: float = 0
    term: int = 72
    rate: float = 6.9
    reserve: float = 0
    total_gross: float = 0
    notes: Optional[str] = ""

@router.get("/")
def get_deals(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("deals").select("*").order("created_at", desc=True).execute()
    return res.data

@router.post("/")
def save_deal(deal: DealRequest, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("deals").upsert(deal.dict(), on_conflict="deal_num").execute()
    return res.data[0]

@router.put("/{deal_num}")
def update_deal(deal_num: str, data: dict, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("deals").update(data).eq("deal_num", deal_num).execute()
    return res.data[0]

@router.delete("/{deal_num}")
def delete_deal(deal_num: str, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    supabase.table("deals").delete().eq("deal_num", deal_num).execute()
    return {"success": True}