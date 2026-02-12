"""
Process relevance scoring system.
Combines CPU, memory, and network activity into a single relevance score.
Higher score = more important/relevant process to monitor.
"""


def calculate_relevance_score(cpu_percent, memory_mb, incoming_connections, outgoing_connections):
    """
    Calculate a composite relevance score for a process.
    
    Scoring:
    - CPU: Normalized to 0-40 points (max 100% CPU)
    - Memory: Normalized to 0-30 points (max 1000MB)
    - Network: Normalized to 0-30 points (max 20 connections per type)
    
    Total: 0-100 points
    
    Args:
        cpu_percent: CPU usage percentage (0-100+)
        memory_mb: Memory usage in MB (0-...)
        incoming_connections: Count of incoming connections
        outgoing_connections: Count of outgoing connections
    
    Returns:
        float: Relevance score (0-100+)
    """
    
    # CPU score (0-40 points)
    # Normalize: 100% CPU = 40 points, 0% = 0 points
    cpu_score = min(cpu_percent / 2.5, 40)
    
    # Memory score (0-30 points)
    # Normalize: 1000MB = 30 points, 0MB = 0 points
    memory_score = min((memory_mb / 1000) * 30, 30)
    
    # Network score (0-30 points)
    # Each connection type: 20 connections = 15 points max per type
    total_connections = incoming_connections + outgoing_connections
    network_score = min((total_connections / 20) * 30, 30)
    
    # Combine scores
    total_score = cpu_score + memory_score + network_score
    
    return total_score


def sort_processes_by_relevance(processes):
    """
    Sort processes by relevance score.
    
    Args:
        processes: List of process dicts with keys: name, pid, cpu, memory, incoming, outgoing, etc.
    
    Returns:
        list: Sorted processes (highest relevance first)
    """
    scored_processes = []
    
    for proc in processes:
        score = calculate_relevance_score(
            cpu_percent=proc.get('cpu', 0),
            memory_mb=proc.get('memory', 0),
            incoming_connections=proc.get('incoming', 0),
            outgoing_connections=proc.get('outgoing', 0)
        )
        proc['relevance_score'] = score
        scored_processes.append(proc)
    
    # Sort by relevance score descending
    return sorted(scored_processes, key=lambda x: x['relevance_score'], reverse=True)
