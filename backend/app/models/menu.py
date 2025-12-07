# backend/app/models/menu.py (2. File menu.py (Bảng Thực đơn hàng ngày)
from app import db
from datetime import datetime

class DailyMenu(db.Model):
    __tablename__ = 'daily_menus'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False) 
    content = db.Column(db.Text, nullable=False) # JSON thực đơn AI tạo
    total_calories = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='unique_user_menu'),)