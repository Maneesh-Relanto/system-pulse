"""
Backend module for System Pulse
"""
from .scoring import calculate_relevance_score, sort_processes_by_relevance
from .cache import TTLCache, get_cache
from .async_ops import run_in_executor, get_thread_pool_executor, shutdown_executor
from .timeout import RequestTimeoutMiddleware

__all__ = [
    'calculate_relevance_score',
    'sort_processes_by_relevance',
    'TTLCache',
    'get_cache',
    'run_in_executor',
    'get_thread_pool_executor',
    'shutdown_executor',
    'RequestTimeoutMiddleware'
]
