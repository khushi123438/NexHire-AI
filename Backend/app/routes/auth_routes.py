from fastapi import APIRouter, Depends, Request, Response, Query
from app.controllers.auth_controller import (
    signup_handler,
    login_handler,
    logout_handler,
    get_profile_handler,
    forgot_password_handler,
    verify_otp_handler,
    reset_password_handler,
    google_auth_handler,
    google_callback_handler
)
from app.middleware.auth_middleware import protect

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/signup")
async def signup(request: Request, response: Response):
    data = await request.json()
    return await signup_handler(data, response)

@router.post("/login")
async def login(request: Request, response: Response):
    data = await request.json()
    return await login_handler(data, response)

@router.post("/logout")
def logout(response: Response):
    return logout_handler(response)

@router.post("/forgot-password")
async def forgot_password(request: Request):
    data = await request.json()
    return await forgot_password_handler(data)

@router.post("/verify-otp")
async def verify_otp(request: Request):
    data = await request.json()
    return await verify_otp_handler(data)

@router.post("/reset-password")
async def reset_password(request: Request):
    data = await request.json()
    return await reset_password_handler(data)

@router.get("/me")
async def get_me(user: dict = Depends(protect)):
    return get_profile_handler(user)

@router.get("/google")
async def google_login(mode: str = Query(default="login")):
    return await google_auth_handler(mode)

@router.get("/google/callback")
async def google_callback(code: str = Query(...), state: str = Query(default="login")):
    return await google_callback_handler(code, state)
