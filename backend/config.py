import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session configuration - Same origin, no CORS needed
    SESSION_COOKIE_SAMESITE = 'Lax'  # Changed from None to Lax for same-origin
    SESSION_COOKIE_SECURE = False  # False for HTTP (development)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_NAME = 'session'
