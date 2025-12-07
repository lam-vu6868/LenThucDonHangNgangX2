# backend/app/routes/auth_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models.user import User

# Tạo nhóm đường dẫn cho Auth
auth_bp = Blueprint('auth', __name__)

# --- 1. ĐĂNG KÝ ---
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Lấy thông tin từ form gửi lên
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # Lấy thêm thông tin sức khỏe (nếu có)
    height = data.get('height')
    weight = data.get('weight')
    diet_goal = data.get('dietary_preferences') 

    # Validate cơ bản
    if not username or not email or not password:
        return jsonify({'error': 'Vui lòng điền Username, Email và Password!'}), 400

    # Kiểm tra trùng lặp
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Tên đăng nhập đã tồn tại!'}), 409
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email này đã được sử dụng!'}), 409

    # Tạo User mới
    new_user = User(
        username=username, 
        email=email,
        height=height,
        weight=weight,
        dietary_preferences=diet_goal
    )
    # Mã hóa mật khẩu (Quan trọng)
    new_user.set_password(password) 
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Đăng ký thành công!', 'username': username}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# --- 2. ĐĂNG NHẬP ---
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Tìm user trong DB
    user = User.query.filter_by(username=username).first()

    # Kiểm tra: Có user không? Mật khẩu khớp không?
    if user is None or not user.check_password(password):
        return jsonify({'error': 'Sai tên đăng nhập hoặc mật khẩu!'}), 401

    # Tạo phiên đăng nhập (Session) với remember=True
    from flask import session, make_response
    login_user(user, remember=True)
    
    # Debug: Print session info
    print(f"Login successful for user: {user.username}")
    print(f"Session data: {session}")
    
    response = make_response(jsonify({
        'message': 'Đăng nhập thành công!',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'height': user.height,
            'weight': user.weight
        }
    }), 200)
    
    return response

# --- 3. ĐĂNG XUẤT ---
@auth_bp.route('/logout', methods=['POST'])
@login_required # Phải đăng nhập mới được đăng xuất
def logout():
    logout_user()
    return jsonify({'message': 'Đăng xuất thành công!'})

# --- 4. KIỂM TRA ĐANG LÀ AI? (Dùng cho Frontend sau này) ---
@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'height': current_user.height,
        'weight': current_user.weight
    })