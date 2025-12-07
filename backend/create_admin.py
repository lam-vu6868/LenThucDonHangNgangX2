# backend/create_admin.py
"""Script để tạo tài khoản admin"""
from app import create_app, db
from app.models.user import User

app = create_app()

with app.app_context():
    # Kiểm tra xem admin đã tồn tại chưa
    admin = User.query.filter_by(username='admin').first()
    
    if admin:
        print("⚠️  Tài khoản admin đã tồn tại!")
        print(f"   Username: {admin.username}")
        print(f"   Email: {admin.email}")
        print(f"   Is Admin: {admin.is_admin}")
        
        # Cập nhật is_admin nếu chưa có
        if not admin.is_admin:
            admin.is_admin = True
            db.session.commit()
            print("✅ Đã cập nhật quyền admin!")
    else:
        # Tạo admin mới
        admin = User(
            username='admin',
            email='admin@lenmenu.com',
            full_name='Administrator',
            is_admin=True
        )
        admin.set_password('admin123')  # Mật khẩu mặc định
        
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Đã tạo tài khoản admin thành công!")
        print(f"   Username: admin")
        print(f"   Password: admin123")
        print(f"   Email: admin@lenmenu.com")
        print("\n⚠️  LƯU Ý: Hãy đổi mật khẩu ngay sau khi đăng nhập!")
