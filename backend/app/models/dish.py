# backend/app/models/dish.py (3. File dish.py (Bảng Món ăn - Kiến thức của AI))
from app import db

class Dish(db.Model):
    __tablename__ = 'dishes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    recipe = db.Column(db.Text)      
    calories = db.Column(db.Integer) 
    protein = db.Column(db.Float)    
    carbs = db.Column(db.Float)      
    fat = db.Column(db.Float)        
    image_url = db.Column(db.String(255))