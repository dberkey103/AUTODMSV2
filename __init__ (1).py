from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from database import supabase
from decimal import Decimal

router = APIRouter()

class DealCalcRequest(BaseModel):
    sell: float = 0
    cost: float = 0
    recon: float = 0
    doc: float = 599
    discount: float = 0
    tax_rate: float = 6.35
    reg: float = 180
    emission: float = 20
    vsi: float = 0
    trade_acv: float = 0
    trade_payoff: float = 0
    has_trade: bool = False
    deal_type: str = "cash"
    f_down: float = 0
    f_term: int = 72
    f_buy_rate: float = 0
    f_sell_rate: float = 0
    fi_products_sale: float = 0
    fi_products_cost: float = 0

class DealSaveRequest(BaseModel):
    deal_num: str
    customer_first: Optional[str] = ""
    customer_last: Optional[str] = ""
    customer_addr: Optional[str] = ""
    customer_city: Optional[str] = ""
    customer_state: Optional[str] = ""
    customer_zip: Optional[str] = ""
    customer_phone: Optional[str] = ""
    customer_email: Optional[str] = ""
    customer_dob: Optional[str] = ""
    customer_dl: Optional[str] = ""
    customer_dl_state: Optional[str] = ""
    vehicle_id: Optional[int] = None
    vehicle_name: Optional[str] = ""
    stock: Optional[str] = ""
    deal_type: Optional[str] = "cash"
    sell: float = 0
    cost: float = 0
    recon: float = 0
    discount: float = 0
    tax_rate: float = 6.35
    doc: float = 599
    reg: float = 180
    emission: float = 20
    vsi: float = 0
    trade_vin: Optional[str] = ""
    trade_year: Optional[int] = None
    trade_make: Optional[str] = ""
    trade_model: Optional[str] = ""
    trade_trim: Optional[str] = ""
    trade_miles: Optional[str] = ""
    trade_acv: float = 0
    trade_payoff: float = 0
    has_trade: bool = False
    lender: Optional[str] = ""
    f_down: float = 0
    f_term: Optional[int] = None
    f_buy_rate: float = 0
    f_sell_rate: float = 0
    front_gross: float = 0
    fi_profit: float = 0
    reserve: float = 0
    total_gross: float = 0
    otd: float = 0
    payment: float = 0
    status: str = "In progress"
    notes: Optional[str] = ""

def calculate_deal(data: DealCalcRequest) -> dict:
    """Core deal calculation logic in Python"""
    net_sell = data.sell - data.discount
    
    # Tax on net sale price after trade (standard in most states)
    taxable = max(net_sell - data.trade_acv, 0) if data.has_trade else net_sell
    tax = taxable * (data.tax_rate / 100)
    
    fees = data.reg + data.emission + data.vsi
    trade_equity = data.trade_acv - data.trade_payoff
    
    fi_sale = data.fi_products_sale
    fi_cost = data.fi_products_cost
    fi_profit = fi_sale - fi_cost
    
    otd = net_sell + data.doc + tax + fees + fi_sale - (data.trade_acv if data.has_trade else 0)
    
    front_gross = net_sell - data.cost - data.recon
    
    # Reserve calculation (finance only)
    reserve = 0
    monthly_payment = 0
    if data.deal_type == "finance" and data.f_term > 0:
        amount_financed = otd - data.f_down
        if amount_financed > 0 and data.f_buy_rate >= 0:
            buy_rate_monthly = data.f_buy_rate / 100 / 12
            sell_rate_monthly = data.f_sell_rate / 100 / 12
            if sell_rate_monthly > 0:
                monthly_payment = amount_financed * sell_rate_monthly / (1 - (1 + sell_rate_monthly) ** -data.f_term)
            else:
                monthly_payment = amount_financed / data.f_term
            if buy_rate_monthly > 0 and sell_rate_monthly > buy_rate_monthly:
                pv_buy = amount_financed * buy_rate_monthly / (1 - (1 + buy_rate_monthly) ** -data.f_term)
                pv_sell = monthly_payment
                reserve = (pv_sell - pv_buy) * data.f_term * 0.75
    
    total_gross = front_gross + fi_profit + reserve
    
    return {
        "net_sell": round(net_sell, 2),
        "taxable_amount": round(taxable, 2),
        "tax": round(tax, 2),
        "fees": round(fees, 2),
        "trade_equity": round(trade_equity, 2),
        "fi_profit": round(fi_profit, 2),
        "otd": round(otd, 2),
        "front_gross": round(front_gross, 2),
        "reserve": round(reserve, 2),
        "total_gross": round(total_gross, 2),
        "monthly_payment": round(monthly_payment, 2),
        "amount_financed": round(otd - data.f_down, 2) if data.deal_type == "finance" else 0,
    }

@router.post("/calculate")
def calc_deal(data: DealCalcRequest):
    return calculate_deal(data)

@router.get("/")
def get_deals(request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    res = supabase.table("deals").select("*").order("created_at", desc=True).execute()
    return res.data

@router.post("/")
def save_deal(deal: DealSaveRequest, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Recalculate on save to ensure accuracy
    calc = calculate_deal(DealCalcRequest(
        sell=deal.sell, cost=deal.cost, recon=deal.recon,
        doc=deal.doc, discount=deal.discount, tax_rate=deal.tax_rate,
        reg=deal.reg, emission=deal.emission, vsi=deal.vsi,
        trade_acv=deal.trade_acv, trade_payoff=deal.trade_payoff,
        has_trade=deal.has_trade, deal_type=deal.deal_type,
        f_down=deal.f_down, f_term=deal.f_term or 72,
        f_buy_rate=deal.f_buy_rate, f_sell_rate=deal.f_sell_rate,
    ))
    
    row = deal.dict()
    row.update({
        "front_gross": calc["front_gross"],
        "fi_profit": calc["fi_profit"],
        "reserve": calc["reserve"],
        "total_gross": calc["total_gross"],
        "otd": calc["otd"],
        "payment": calc["monthly_payment"],
    })
    
    res = supabase.table("deals").upsert(row, on_conflict="deal_num").execute()
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
