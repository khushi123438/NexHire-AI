from fastapi import Request, HTTPException, status, Depends
from bson import ObjectId
from app.utils.generate_token import verify_token
from app.config.db import get_db
from app.utils.helpers import serialize_doc

async def protect(request: Request) -> dict:
    """
    FastAPI Auth Dependency matching Express protect middleware.
    Extracts token from Cookie 'token' or 'Authorization: Bearer <token>' header.
    """
    token = None

    # 1. Check Cookies
    if "token" in request.cookies:
        token = request.cookies.get("token")

    # 2. Check Authorization Header
    if not token:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Not authorized. Please login."}
        )

    try:
        decoded = verify_token(token)
        user_id = decoded.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "message": "Invalid token payload."}
            )

        db = get_db()
        query = {"_id": ObjectId(user_id)} if ObjectId.is_valid(user_id) else {"_id": user_id}
        user = await db.users.find_one(query, {"password": 0})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "message": "User not found."}
            )

        # Attach to request state for convenient access if needed
        request.state.user = user
        return serialize_doc(user)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid or expired token."}
        )
