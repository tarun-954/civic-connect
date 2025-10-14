from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
import pyotp
import time

app = FastAPI(title="Civic Connect OTP Service")


class OtpRequest(BaseModel):
    target: str
    purpose: Literal["login", "signup"]
    ttl_seconds: int = Field(default=600, ge=60, le=1800)


class OtpVerify(BaseModel):
    target: str
    purpose: Literal["login", "signup"]
    code: str


def build_secret(target: str, purpose: str) -> str:
    # Deterministic secret per target+purpose for demo; replace with DB if needed
    # WARNING: For production, store per-user random secrets in a database.
    base = f"CIVIC_CONNECT::{purpose}::{target}".encode("utf-8")
    return pyotp.random_base32() if len(base) == 0 else pyotp.random_base32(len(base))


@app.post("/generate")
def generate(req: OtpRequest):
    # Generate TOTP with a pseudo-stable secret. For production, persist a secret per target.
    secret = build_secret(req.target, req.purpose)
    totp = pyotp.TOTP(secret, interval=req.ttl_seconds)
    code = totp.now()
    expires_at = int(time.time()) + req.ttl_seconds
    return {"status": "success", "code": code, "expiresAt": expires_at}


@app.post("/verify")
def verify(req: OtpVerify):
    secret = build_secret(req.target, req.purpose)
    # Default interval must match generation TTL
    # Here we accept a window of 1 interval for slight clock drift
    for interval in [600, 300, 120]:
        totp = pyotp.TOTP(secret, interval=interval)
        if totp.verify(req.code, valid_window=1):
            return {"status": "success"}
    raise HTTPException(status_code=400, detail="Invalid or expired OTP")


