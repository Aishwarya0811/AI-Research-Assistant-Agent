#!/usr/bin/env python3
"""
Alternative server starter that avoids Windows permission issues
"""
import os
import sys
from pathlib import Path

def find_free_port():
    """Find a free port to use"""
    import socket
    
    ports_to_try = [8888, 9000, 9001, 9002, 5000, 5001, 4000, 4001]
    
    for port in ports_to_try:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    
    # If no port works, return a random high port
    return 8888

def start_server():
    """Start the server with error handling"""
    # Change to backend directory
    backend_path = Path(__file__).parent / "backend"
    os.chdir(backend_path)
    
    # Add backend to Python path
    sys.path.insert(0, str(backend_path.absolute()))
    
    try:
        # Import here to avoid path issues
        from main import app
        import uvicorn
        
        # Find a free port
        port = find_free_port()
        
        print(f"AI Research Assistant")
        print(f"Starting server on http://127.0.0.1:{port}")
        print(f"Open your browser and go to: http://localhost:{port}")
        print("Press Ctrl+C to stop")
        print("-" * 60)
        
        # Start without reload to avoid permission issues
        uvicorn.run(
            app, 
            host="127.0.0.1", 
            port=port,
            reload=False,  # Disable reload to avoid Windows issues
            log_level="info"
        )
        
    except ImportError as e:
        print(f"Import error: {e}")
        print("Please install dependencies: pip install -r requirements.txt")
        sys.exit(1)
    except PermissionError as e:
        print(f"Permission error: {e}")
        print("Try running as Administrator or use a different port")
        sys.exit(1)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()