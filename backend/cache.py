"""
Performance caching layer with TTL (Time To Live).
Reduces redundant process/connection lookups.
"""
import time
from typing import Any, Optional, Callable


class CacheEntry:
    """Single cache entry with expiration tracking."""
    
    def __init__(self, value: Any, ttl: float):
        self.value = value
        self.created_at = time.time()
        self.ttl = ttl
    
    def is_expired(self) -> bool:
        """Check if entry has exceeded TTL."""
        return (time.time() - self.created_at) > self.ttl
    
    def get(self) -> Optional[Any]:
        """Get value if not expired, else None."""
        if self.is_expired():
            return None
        return self.value


class TTLCache:
    """
    Time-To-Live cache for expensive operations.
    Automatically expires entries after specified seconds.
    
    Usage:
        cache = TTLCache()
        
        # Set value with 2 second TTL
        cache.set('processes', data, ttl=2)
        
        # Get value (returns None if expired)
        value = cache.get('processes')
        
        # Get or compute (auto-calculate if missing/expired)
        value = cache.get_or_compute('processes', 
                                     compute_fn=lambda: get_all_processes(),
                                     ttl=2)
    """
    
    def __init__(self):
        self._cache = {}
        self._stats = {
            'hits': 0,
            'misses': 0,
            'total_requests': 0
        }
    
    def set(self, key: str, value: Any, ttl: float = 1.0) -> None:
        """
        Store value in cache with TTL.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: 1 second)
        """
        self._cache[key] = CacheEntry(value, ttl)
    
    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve value from cache if not expired.
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None if expired/missing
        """
        self._stats['total_requests'] += 1
        
        if key not in self._cache:
            self._stats['misses'] += 1
            return None
        
        entry = self._cache[key]
        value = entry.get()
        
        if value is None:
            # Expired - clean up
            del self._cache[key]
            self._stats['misses'] += 1
            return None
        
        self._stats['hits'] += 1
        return value
    
    def get_or_compute(self, key: str, compute_fn: Callable, ttl: float = 1.0) -> Any:
        """
        Get from cache or compute if missing/expired.
        Useful for expensive operations.
        
        Args:
            key: Cache key
            compute_fn: Function to call if cache miss
            ttl: Time to live in seconds
        
        Returns:
            Cached or newly computed value
        """
        cached = self.get(key)
        if cached is not None:
            return cached
        
        # Compute new value
        value = compute_fn()
        self.set(key, value, ttl=ttl)
        return value
    
    def clear(self, key: Optional[str] = None) -> None:
        """
        Clear cache entry or entire cache.
        
        Args:
            key: Specific key to clear, or None to clear all
        """
        if key is None:
            self._cache.clear()
        elif key in self._cache:
            del self._cache[key]
    
    def get_stats(self) -> dict:
        """Get cache performance statistics."""
        total = self._stats['total_requests']
        hits = self._stats['hits']
        hit_rate = (hits / total * 100) if total > 0 else 0
        
        return {
            'total_requests': total,
            'cache_hits': hits,
            'cache_misses': self._stats['misses'],
            'hit_rate_percent': round(hit_rate, 2),
            'active_entries': len(self._cache)
        }
    
    def cleanup_expired(self) -> int:
        """
        Remove all expired entries from cache.
        Returns number of entries cleaned up.
        """
        expired_keys = [k for k, v in self._cache.items() if v.is_expired()]
        for key in expired_keys:
            del self._cache[key]
        return len(expired_keys)


# Global cache instance
_cache_instance = TTLCache()


def get_cache() -> TTLCache:
    """Get the global cache instance."""
    return _cache_instance
