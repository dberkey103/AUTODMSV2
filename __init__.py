from fastapi import APIRouter, HTTPException, Request
import requests
import os

router = APIRouter()

ZIPTAX_KEY = os.environ.get("ZIPTAX_KEY", "ziptax_sk_x2FuBXtlB04LsRxJ8rylLgm5V1MpP7")

@router.get("/lookup")
def tax_lookup(address: str, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        res = requests.get(
            f"https://api.zip-tax.com/request/v60?address={address}",
            headers={"X-API-KEY": ZIPTAX_KEY},
            timeout=5
        )
        return res.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
