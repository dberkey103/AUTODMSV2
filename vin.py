from fastapi import APIRouter, HTTPException, Request
import requests
import os

router = APIRouter()

CARSXE_KEY = os.environ.get("CARSXE_KEY", "")

@router.get("/{vin}")
def decode_vin(vin: str, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if CARSXE_KEY:
        try:
            res = requests.get(
                f"https://api.carsxe.com/specs?key={CARSXE_KEY}&vin={vin}",
                timeout=5
            )
            data = res.json()
            if data.get("success") and data.get("attributes"):
                return {"source": "carsxe", "data": data["attributes"]}
        except Exception as e:
            print(f"CarsXE failed: {e}")
    try:
        res = requests.get(
            f"https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/{vin}?format=json",
            timeout=5
        )
        return {"source": "nhtsa", "data": res.json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))