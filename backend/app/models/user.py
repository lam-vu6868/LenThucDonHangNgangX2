# backend/app/models/user.py (1. File user.py (Bảng Người dùng))
from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    
    # Thông tin sức khỏe
    full_name = db.Column(db.String(100))
    age = db.Column(db.Integer)
    height = db.Column(db.Float) # cm
    weight = db.Column(db.Float) # kg
    gender = db.Column(db.String(10)) 
    activity_level = db.Column(db.String(50)) 
    dietary_preferences = db.Column(db.String(200)) 
    allergies = db.Column(db.String(200)) 
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Quan hệ
    menus = db.relationship('DailyMenu', backref='owner', lazy='dynamic')
    weight_logs = db.relationship('WeightLog', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    

from app import login

@login.user_loader
def load_user(id):
    return User.query.get(int(id))