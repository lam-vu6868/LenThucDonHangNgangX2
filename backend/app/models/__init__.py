# backend/app/__init__.py
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from config import Config

# Khởi tạo các extension
db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = 'auth.login'

def create_app():
    # Cấu hình đường dẫn frontend
    template_dir = os.path.abspath('../frontend/templates')
    static_dir = os.path.abspath('../frontend/static')

    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    app.config.from_object(Config)

    # Init thư viện
    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)

    # --- KHU VỰC TẠO BẢNG TỰ ĐỘNG ---
    with app.app_context():
        # Import model để Flask biết cấu trúc bảng
        from app.models.user import User
        from app.models.menu import DailyMenu
        from app.models.dish import Dish
        from app.models.weight_log import WeightLog
        
        # LỆNH TẠO BẢNG (Chỉ chạy khi bảng chưa có)
        db.create_all()
        print("✅ Đã khởi tạo Database thành công!")

    # Đăng ký các Route (Blueprint)
    from app.routes.main_routes import main_bp
    app.register_blueprint(main_bp)

    # (Đăng ký thêm auth_bp sau khi bạn viết xong file auth_routes.py)
    # from app.routes.auth_routes import auth_bp
    # app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # (Đăng ký chat_bp nếu đã có)
    # from app.routes.chat_routes import chat_bp
    # app.register_blueprint(chat_bp, url_prefix='/api/chat')

    return app