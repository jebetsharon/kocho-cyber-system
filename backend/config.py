import os
from datetime import timedelta

class Config:
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'kocho-dev-secret-key'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://kocho_admin:kocho_secure_pass_2024@localhost:5432/kocho_cyber_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'kocho-jwt-dev-secret'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Business Info
    BUSINESS_NAME = "Kocho Printers and Cyber Ltd"
    BUSINESS_EMAIL = "kochoprinters@gmail.com"
    BUSINESS_PHONE = "0724444979"
    BUSINESS_ADDRESS = "Eldoret Town, Saito Building, Alot Oloo Street, Room B10"
    BUSINESS_HOURS = "8:00 AM - 7:00 PM (Monday - Saturday)"