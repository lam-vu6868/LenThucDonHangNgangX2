# backend/app/routes/weight_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
from app import db
from app.models.weight_log import WeightLog

weight_bp = Blueprint('weight', __name__)

@weight_bp.route('/log', methods=['POST'])
@login_required
def add_weight_log():
    """Thêm bản ghi cân nặng mới"""
    data = request.get_json()
    weight = data.get('weight')
    
    if not weight:
        return jsonify({'error': 'Vui lòng nhập cân nặng'}), 400
    
    try:
        weight = float(weight)
        if weight <= 0 or weight > 500:
            return jsonify({'error': 'Cân nặng không hợp lệ'}), 400
    except ValueError:
        return jsonify({'error': 'Cân nặng phải là số'}), 400
    
    # Tạo bản ghi mới
    new_log = WeightLog(
        user_id=current_user.id,
        weight=weight
    )
    
    # Cập nhật cân nặng hiện tại trong user
    current_user.weight = weight
    
    try:
        db.session.add(new_log)
        db.session.commit()
        
        # Tính BMI nếu có chiều cao
        bmi = None
        if current_user.height:
            height_m = current_user.height / 100
            bmi = round(weight / (height_m * height_m), 1)
        
        return jsonify({
            'message': 'Đã lưu cân nặng thành công',
            'weight': weight,
            'bmi': bmi,
            'recorded_at': new_log.recorded_at.isoformat()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@weight_bp.route('/history', methods=['GET'])
@login_required
def get_weight_history():
    """Lấy lịch sử cân nặng (30 ngày gần nhất) - 1 bản ghi/ngày"""
    days = request.args.get('days', 30, type=int)
    
    # Lấy logs trong khoảng thời gian
    from_date = datetime.utcnow() - timedelta(days=days)
    
    logs = WeightLog.query.filter(
        WeightLog.user_id == current_user.id,
        WeightLog.recorded_at >= from_date
    ).order_by(WeightLog.recorded_at.asc()).all()
    
    # Lọc để chỉ lấy 1 bản ghi cuối cùng mỗi ngày (tránh trùng lặp)
    daily_logs = {}
    for log in logs:
        date_key = log.recorded_at.date()
        # Giữ bản ghi mới nhất của mỗi ngày
        if date_key not in daily_logs or log.recorded_at > daily_logs[date_key].recorded_at:
            daily_logs[date_key] = log
    
    # Format dữ liệu cho chart - frontend expects 'history' key
    history = []
    for date_key in sorted(daily_logs.keys()):
        log = daily_logs[date_key]
        history.append({
            'id': log.id,
            'weight': log.weight,
            'recorded_at': log.recorded_at.isoformat()
        })
    
    return jsonify({
        'history': history
    }), 200

@weight_bp.route('/latest', methods=['GET'])
@login_required
def get_latest_weight():
    """Lấy cân nặng theo ngày hoặc mới nhất"""
    date_str = request.args.get('date')
    
    if date_str:
        # Lấy cân nặng của ngày cụ thể
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            # Lấy cân nặng đầu tiên của ngày đó
            log = WeightLog.query.filter(
                WeightLog.user_id == current_user.id,
                db.func.date(WeightLog.recorded_at) == target_date
            ).order_by(WeightLog.recorded_at.desc()).first()
            
            if not log:
                return jsonify({
                    'current_weight': None,
                    'bmi': None,
                    'change': 0,
                    'message': 'Chưa có dữ liệu cho ngày này'
                }), 200
            
            # Tính BMI
            bmi = None
            if current_user.height and log.weight:
                height_m = current_user.height / 100
                bmi = round(log.weight / (height_m * height_m), 1)
            
            # Tính thay đổi so với 30 ngày trước
            thirty_days_ago = target_date - timedelta(days=30)
            old_log = WeightLog.query.filter(
                WeightLog.user_id == current_user.id,
                db.func.date(WeightLog.recorded_at) <= thirty_days_ago
            ).order_by(WeightLog.recorded_at.desc()).first()
            
            change = 0
            if old_log:
                change = round(log.weight - old_log.weight, 1)
            
            return jsonify({
                'current_weight': log.weight,
                'bmi': bmi,
                'change': change,
                'recorded_at': log.recorded_at.isoformat()
            }), 200
        except ValueError:
            return jsonify({'error': 'Định dạng ngày không hợp lệ'}), 400
    
    # Không có date parameter, lấy cân nặng mới nhất
    latest = WeightLog.query.filter_by(
        user_id=current_user.id
    ).order_by(WeightLog.recorded_at.desc()).first()
    
    if not latest:
        return jsonify({
            'current_weight': current_user.weight,
            'bmi': None,
            'change': 0
        }), 200
    
    # Tính BMI
    bmi = None
    if current_user.height and latest.weight:
        height_m = current_user.height / 100
        bmi = round(latest.weight / (height_m * height_m), 1)
    
    # Tính thay đổi 30 ngày
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    old_log = WeightLog.query.filter(
        WeightLog.user_id == current_user.id,
        WeightLog.recorded_at <= thirty_days_ago
    ).order_by(WeightLog.recorded_at.desc()).first()
    
    change = 0
    if old_log:
        change = round(latest.weight - old_log.weight, 1)
    
    return jsonify({
        'current_weight': latest.weight,
        'bmi': bmi,
        'change': change,
        'recorded_at': latest.recorded_at.isoformat()
    }), 200

@weight_bp.route('/delete/<int:log_id>', methods=['DELETE'])
@login_required
def delete_weight_log(log_id):
    """Xóa bản ghi cân nặng"""
    log = WeightLog.query.filter_by(id=log_id, user_id=current_user.id).first()
    
    if not log:
        return jsonify({'error': 'Không tìm thấy bản ghi'}), 404
    
    try:
        db.session.delete(log)
        db.session.commit()
        return jsonify({'message': 'Đã xóa thành công'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
