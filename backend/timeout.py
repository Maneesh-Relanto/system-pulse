"""
Request timeout protection.
Prevents requests from hanging indefinitely and consuming resources.
"""
import asyncio
from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Callable


class TimeoutError(Exception):
    """Request exceeded timeout limit."""
    pass


async def timeout_middleware(request: Request, call_next: Callable, timeout_seconds: float = 5.0):
    """
    Middleware to enforce request timeouts.
    
    Args:
        request: FastAPI request object
        call_next: Next middleware/route handler
        timeout_seconds: Maximum request duration (default: 5 seconds)
    
    Returns:
        Response or error response if timeout exceeded
    """
    try:
        # Set timeout for the request processing
        response = await asyncio.wait_for(
            call_next(request),
            timeout=timeout_seconds
        )
        return response
    except asyncio.TimeoutError:
        return JSONResponse(
            status_code=504,
            content={
                "error": "Request timeout",
                "message": f"Request took longer than {timeout_seconds} seconds",
                "timeout_seconds": timeout_seconds
            }
        )
    except Exception:
        # Let other exceptions propagate
        raise


class RequestTimeoutMiddleware:
    """
    ASGI middleware for request timeout protection.
    Usage in main.py:
        app.add_middleware(RequestTimeoutMiddleware, timeout_seconds=5.0)
    """
    
    def __init__(self, app, timeout_seconds: float = 5.0):
        self.app = app
        self.timeout_seconds = timeout_seconds
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            # Only apply to HTTP requests
            await self.app(scope, receive, send)
            return
        
        try:
            # Wrap the app call with timeout
            await asyncio.wait_for(
                self.app(scope, receive, send),
                timeout=self.timeout_seconds
            )
        except asyncio.TimeoutError:
            # Send timeout response
            await send({
                "type": "http.response.start",
                "status": 504,
                "headers": [[b"content-type", b"application/json"]],
            })
            await send({
                "type": "http.response.body",
                "body": b'{"error":"Request timeout","message":"Request exceeded 5 second limit"}',
            })
        except Exception:
            # Let other exceptions be handled by normal error handling
            await self.app(scope, receive, send)
