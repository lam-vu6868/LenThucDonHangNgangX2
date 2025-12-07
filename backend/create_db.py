# backend/create_db.py
from app import create_app, db

# 1. Gọi App ra
app = create_app()

# 2. Chạy lệnh tạo bảng trong môi trường của App
with app.app_context():
    print("🚀 Đang kết nối Database...")
    
    # Import lại các model để chắc chắn Flask nhìn thấy chúng
    # (Nếu tên file bạn đặt khác thì sửa lại ở đây nhé)
    try:
        from app.models.user import User
        from app.models.menu import DailyMenu
        from app.models.dish import Dish
        from app.models.weight_log import WeightLog
        print("✅ Đã tìm thấy các Model: User, Menu, Dish, WeightLog")
    except ImportError as e:
        print(f"❌ Lỗi Import: {e}")
        print("👉 Kiểm tra lại xem bạn đã tạo đủ 4 file trong thư mục 'app/models/' chưa?")
        exit()

    # Lệnh tạo bảng
    print("⏳ Đang tạo bảng trong PostgreSQL...")
    db.create_all()
    print("🎉 XONG! Đã tạo đủ bảng. Bạn có thể kiểm tra lại bằng lệnh \\dt")