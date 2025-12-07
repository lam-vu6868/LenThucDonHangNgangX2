# backend/app/__init__.py
import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_cors import CORS  # <-- Thêm CORS
from flask_babel import Babel
from config import Config

# Khởi tạo các extension
db = SQLAlchemy()
migrate = Migrate()
login = LoginManager()
login.login_view = 'auth.login'
babel = Babel()

# Unauthorized handler - Trả về JSON thay vì redirect
@login.unauthorized_handler
def unauthorized():
    from flask import jsonify
    return jsonify({'error': 'Vui lòng đăng nhập'}), 401

def create_app():
    # Cấu hình trỏ ngược ra frontend
    template_dir = os.path.abspath('../frontend/templates')
    static_dir = os.path.abspath('../frontend/static')

    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    app.config.from_object(Config)
    
    # Cấu hình ngôn ngữ tiếng Việt
    app.config['BABEL_DEFAULT_LOCALE'] = 'vi'
    app.config['BABEL_TRANSLATION_DIRECTORIES'] = 'translations'

    # CORS không cần thiết vì frontend và backend cùng origin (port 5000)
    # Nhưng giữ lại với origins=['*'] cho development
    CORS(app, 
         supports_credentials=True, 
         origins=['http://localhost:5000', 'http://127.0.0.1:5000'],
         allow_headers=['Content-Type', 'Authorization'],
         expose_headers=['Content-Type', 'Set-Cookie'])

    # Init các thư viện vào App
    db.init_app(app)
    migrate.init_app(app, db)
    login.init_app(app)
    login.session_protection = 'strong'
    babel.init_app(app)

    # --- KHU VỰC TẠO BẢNG TỰ ĐỘNG (QUAN TRỌNG) ---
    with app.app_context():
        # Import model để Flask biết cấu trúc bảng
        from app.models.user import User
        from app.models.menu import DailyMenu
        from app.models.weight_log import WeightLog
        
        # Lệnh tạo bảng (Chỉ chạy khi bảng chưa có)
        db.create_all()
        print("✅ Database đã sẵn sàng!")

    # --- ĐĂNG KÝ ROUTE ---
    # 1. Trang chủ
    from app.routes.main_routes import main_bp
    app.register_blueprint(main_bp)

    # 2. Xác thực (Đăng nhập/Đăng ký)
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # 3. Thực đơn AI
    from app.routes.menu_routes import menu_bp
    app.register_blueprint(menu_bp, url_prefix='/api/menu')

    # 4. Theo dõi cân nặng
    from app.routes.weight_routes import weight_bp
    app.register_blueprint(weight_bp, url_prefix='/api/weight')

    # 5. Chat (Nếu bạn muốn giữ lại thì bỏ comment dòng dưới)
    # from app.routes.chat_routes import chat_bp
    # app.register_blueprint(chat_bp, url_prefix='/api/chat')

    # 6. Admin Panel (Flask-Admin)
    from app.admin_views import init_admin
    init_admin(app)

    return app