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
    """Thêm hoặc cập nhật bản ghi cân nặng theo ngày"""
    data = request.get_json()
    weight = data.get('weight')
    date_str = data.get('date')  # Ngày người dùng đang xem
    
    if not weight:
        return jsonify({'error': 'Vui lòng nhập cân nặng'}), 400
    
    try:
        weight = float(weight)
        if weight <= 0 or weight > 500:
            return jsonify({'error': 'Cân nặng không hợp lệ'}), 400
    except ValueError:
        return jsonify({'error': 'Cân nặng phải là số'}), 400
    
    # Xác định ngày cần lưu
    if date_str:
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Định dạng ngày không hợp lệ'}), 400
    else:
        target_date = datetime.utcnow()
    
    # Kiểm tra xem ngày này đã có bản ghi cân nặng chưa
    existing_log = WeightLog.query.filter(
        WeightLog.user_id == current_user.id,
        db.func.date(WeightLog.recorded_at) == target_date.date()
    ).first()
    
    try:
        if existing_log:
            # Cập nhật bản ghi hiện có
            existing_log.weight = weight
            existing_log.recorded_at = target_date  # Cập nhật thời gian
            message = f'Đã cập nhật cân nặng cho ngày {target_date.strftime("%d/%m/%Y")}'
            log = existing_log
        else:
            # Tạo bản ghi mới
            new_log = WeightLog(
                user_id=current_user.id,
                weight=weight,
                recorded_at=target_date
            )
            db.session.add(new_log)
            message = f'Đã lưu cân nặng cho ngày {target_date.strftime("%d/%m/%Y")}'
            log = new_log
        
        # Chỉ cập nhật cân nặng hiện tại trong user nếu là ngày hôm nay
        if target_date.date() == datetime.utcnow().date():
            current_user.weight = weight
        
        db.session.commit()
        
        # Tính BMI nếu có chiều cao
        bmi = None
        if current_user.height:
            height_m = current_user.height / 100
            bmi = round(weight / (height_m * height_m), 1)
        
        return jsonify({
            'message': message,
            'weight': weight,
            'bmi': bmi,
            'recorded_at': log.recorded_at.isoformat()
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

@weight_bp.route('/evaluate', methods=['GET'])
@login_required
def evaluate_progress():
    """Đánh giá tiến trình giảm cân bằng AI"""
    days = request.args.get('days', 30, type=int)
    
    # Chỉ cho phép 15 hoặc 30 ngày
    if days not in [15, 30]:
        days = 30
    
    # Lấy dữ liệu cân nặng trong khoảng thời gian
    from_date = datetime.utcnow() - timedelta(days=days)
    
    logs = WeightLog.query.filter(
        WeightLog.user_id == current_user.id,
        WeightLog.recorded_at >= from_date
    ).order_by(WeightLog.recorded_at.asc()).all()
    
    # Kiểm tra số ngày có dữ liệu - yêu cầu đủ ngày mới cho AI đánh giá
    min_required_days = days  # Phải đủ số ngày được yêu cầu
    actual_days = len(logs)
    
    if actual_days < min_required_days:
        return jsonify({
            'success': False,
            'message': f'⚠️ Cần có ít nhất {min_required_days} ngày dữ liệu cân nặng để AI đánh giá chính xác.\n\n'
                      f'📊 Hiện tại bạn mới có {actual_days}/{min_required_days} ngày.\n\n'
                      f'💡 Hãy cập nhật cân nặng đều đặn mỗi ngày nhé! 💪',
            'days_required': min_required_days,
            'days_available': actual_days
        }), 200
    
    # Phân tích dữ liệu
    weights = [log.weight for log in logs]
    dates = [log.recorded_at.strftime('%d/%m') for log in logs]
    
    start_weight = weights[0]
    end_weight = weights[-1]
    weight_change = end_weight - start_weight
    weight_change_percent = (weight_change / start_weight) * 100
    
    # Tính xu hướng
    avg_change_per_week = (weight_change / days) * 7
    
    # Tính độ biến động
    max_weight = max(weights)
    min_weight = min(weights)
    volatility = max_weight - min_weight
    
    # Tạo prompt cho AI
    from app.services.ai_service import get_ai_response
    
    goal = current_user.dietary_preferences or "cải thiện sức khỏe"
    
    # Phân tích xu hướng thật
    if "giảm cân" in goal.lower() or "giảm béo" in goal.lower():
        target_trend = "giảm"
        if weight_change > 0:
            trend_status = f"KHÔNG ĐẠT - Bạn đang TĂNG {abs(weight_change):.1f} kg thay vì giảm"
        elif weight_change < -0.5:
            trend_status = f"TỐT - Đang giảm đúng mục tiêu"
        else:
            trend_status = f"ỔN - Giảm chậm, cần cải thiện"
    elif "tăng cân" in goal.lower() or "tăng cơ" in goal.lower():
        target_trend = "tăng"
        if weight_change < 0:
            trend_status = f"KHÔNG ĐẠT - Bạn đang GIẢM {abs(weight_change):.1f} kg thay vì tăng"
        elif weight_change > 0.5:
            trend_status = f"TỐT - Đang tăng đúng mục tiêu"
        else:
            trend_status = f"ỔN - Tăng chậm, cần cải thiện"
    else:
        target_trend = "duy trì"
        if abs(weight_change) < 0.5:
            trend_status = f"XUẤT SẮC - Duy trì ổn định"
        else:
            trend_status = f"CHÚ Ý - Biến động {abs(weight_change):.1f} kg"
    
    prompt = f"""
🎯 NHIỆM VỤ: Đánh giá THẲNG THẮNG và CHI TIẾT tiến trình sức khỏe

📊 DỮ LIỆU {days} NGÀY:
- Cân nặng: {start_weight:.1f} kg → {end_weight:.1f} kg
- Thay đổi: {weight_change:+.1f} kg ({weight_change_percent:+.1f}%)
- TB/tuần: {avg_change_per_week:+.1f} kg
- Biến động: {volatility:.1f} kg (cao nhất {max_weight:.1f} kg, thấp nhất {min_weight:.1f} kg)
- Số lần đo: {len(logs)}/{days} ngày
- Mục tiêu: {goal}
- Kết quả: {trend_status}

💡 YÊU CẦU ĐÁNH GIÁ:
1. PHẢI ĐÁNH GIÁ CHÍNH XÁC dựa trên dữ liệu:
   - Nếu mục tiêu giảm cân mà tăng → CHỈ RA THẲNG rằng ĐANG LÀM SAI
   - Nếu giảm đúng → KHEN NGỢI cụ thể
   - Nếu tăng khi cần tăng → ĐỘNG VIÊN tiếp tục
   
2. Cấu trúc 3-4 câu:
   - Câu 1: Emoji + Nhận xét thẳng thắng về kết quả ({trend_status})
   - Câu 2: Phân tích nguyên nhân (chế độ ăn/luyện tập)
   - Câu 3: Lời khuyên CỤ THỂ để cải thiện
   - Câu 4: Động viên mạnh mẽ

3. Emoji phù hợp:
   - ⚠️ hoặc 😟 nếu đi ngược mục tiêu
   - 💪 hoặc 👍 nếu tiến bộ chậm
   - 🎉 hoặc 🌟 nếu đạt mục tiêu tốt

⚠️ LƯU Ý QUAN TRỌNG:
- KHÔNG được nói "ổn định" hoặc "tốt" khi người giảm cân mà lại tăng
- KHÔNG động viên sai khi kết quả đi ngược mục tiêu
- KHÔNG dùng markdown (**, ##, -)
- Giọng điệu: THẲNG THẮNG nhưng ĐỘNG VIÊN
- PHẢI nói thật về kết quả, sau đó đưa hướng giải quyết

Hãy đánh giá TRUNG THỰC:"""

    try:
        evaluation = get_ai_response(prompt)
        
        return jsonify({
            'evaluation': evaluation.strip(),
            'days': days,
            'data_points': len(logs),
            'summary': {
                'start_weight': round(start_weight, 1),
                'current_weight': round(end_weight, 1),
                'change': round(weight_change, 1),
                'change_percent': round(weight_change_percent, 1),
                'avg_per_week': round(avg_change_per_week, 1),
                'trend': 'down' if weight_change < -0.5 else 'up' if weight_change > 0.5 else 'stable'
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Không thể tạo đánh giá: {str(e)}'}), 500

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
