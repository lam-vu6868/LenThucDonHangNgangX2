# backend/app/models/weight_log.py (4. File weight_log.py (Bảng Lịch sử cân nặng))
from app import db
from datetime import datetime

class WeightLog(db.Model):
    __tablename__ = 'weight_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    weight = db.Column(db.Float, nullable=False) 
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)