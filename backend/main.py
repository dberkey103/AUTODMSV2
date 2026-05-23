from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import auth, inventory, deals, service, users, tax, vin

app = FastAPI(title="CARSATION DMS API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://autodmsv2.onrender.com"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(deals.router, prefix="/api/deals", tags=["deals"])
app.include_router(service.router, prefix="/api/service", tags=["service"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(tax.router, prefix="/api/tax", tags=["tax"])
app.include_router(vin.router, prefix="/api/vin", tags=["vin"])

@app.get("/")
def root():
    return {"status": "CARSATION DMS API running"}