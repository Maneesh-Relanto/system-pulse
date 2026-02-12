"""
Async operations for System Pulse.
Runs expensive I/O operations in a thread pool to avoid blocking the event loop.
"""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Any

# Thread pool for CPU-bound and I/O operations
_executor = ThreadPoolExecutor(max_workers=2)


async def run_in_executor(func: Callable, *args) -> Any:
    """
    Run a blocking function in a thread pool without blocking the event loop.
    
    Args:
        func: Blocking function to execute
        *args: Arguments to pass to the function
    
    Returns:
        Result from the function
    
    Usage:
        result = await run_in_executor(collect_process_data)
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(_executor, func, *args)


def get_thread_pool_executor() -> ThreadPoolExecutor:
    """Get the thread pool executor for custom operations."""
    return _executor


def shutdown_executor() -> None:
    """Shutdown the thread pool executor gracefully."""
    _executor.shutdown(wait=True)
