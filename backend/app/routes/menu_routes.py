# backend/app/routes/menu_routes.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import date, timedelta
from app import db
from app.models.menu import DailyMenu
from app.services.ai_service import get_ai_response

menu_bp = Blueprint('menu', __name__)

@menu_bp.route('/generate', methods=['POST'])
@login_required # Bắt buộc phải đăng nhập mới được tạo thực đơn
def generate_menu():
    # 1. Lấy thông tin từ request body (nếu có)
    data = request.get_json() or {}
    user = current_user
    
    # Cập nhật thông tin user nếu có data mới từ form
    if data:
        if 'height' in data and data['height']:
            user.height = float(data['height'])
        if 'weight' in data and data['weight']:
            user.weight = float(data['weight'])
        if 'age' in data and data['age']:
            user.age = int(data['age'])
        if 'gender' in data and data['gender']:
            user.gender = data['gender']
        if 'dietary_preferences' in data and data['dietary_preferences']:
            user.dietary_preferences = data['dietary_preferences']
        if 'activity_level' in data and data['activity_level']:
            user.activity_level = data['activity_level']
        if 'allergies' in data and data['allergies']:
            user.allergies = data['allergies']
        
        # Lưu thông tin cập nhật vào DB
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
    
    # Lấy thông tin để tạo thực đơn
    weight = user.weight if user.weight else "không rõ"
    height = user.height if user.height else "không rõ"
    age = user.age if user.age else "không rõ"
    gender = user.gender if user.gender else "không rõ"
    goal = user.dietary_preferences if user.dietary_preferences else "Duy trì sức khỏe"
    activity = user.activity_level if user.activity_level else "Vận động vừa"
    allergies = user.allergies if user.allergies else "Không có"
    
    # Lấy ngày từ request để tính BMR chính xác hơn
    menu_date_str = data.get('date')
    if menu_date_str:
        start_date = date.fromisoformat(menu_date_str)
    else:
        start_date = date.today()
    
    # Tính BMR (Basal Metabolic Rate) để đề xuất calo chính xác
    bmr_info = ""
    if user.weight and user.height and user.age and user.gender:
        # BMR theo công thức Mifflin-St Jeor
        if user.gender.lower() == 'nam':
            bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5
        else:
            bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161
        
        # TDEE (Total Daily Energy Expenditure) dựa trên mức độ vận động
        activity_multiplier = {
            'Ít vận động': 1.2,
            'Vận động nhẹ': 1.375,
            'Vận động vừa': 1.55,
            'Vận động nhiều': 1.725,
            'Vận động rất nhiều': 1.9
        }
        tdee = bmr * activity_multiplier.get(activity, 1.55)
        
        # Điều chỉnh calo theo mục tiêu
        if 'giảm cân' in goal.lower() or 'giảm béo' in goal.lower():
            target_cal = int(tdee * 0.85)  # Giảm 15%
            bmr_info = f"\n- Calo khuyến nghị: {target_cal} kcal/ngày (giảm cân an toàn)"
        elif 'tăng cân' in goal.lower() or 'tăng cơ' in goal.lower():
            target_cal = int(tdee * 1.15)  # Tăng 15%
            bmr_info = f"\n- Calo khuyến nghị: {target_cal} kcal/ngày (tăng cân lành mạnh)"
        else:
            target_cal = int(tdee)
            bmr_info = f"\n- Calo khuyến nghị: {target_cal} kcal/ngày (duy trì cân nặng)"

    # 2. Tạo câu lệnh (Prompt) gửi cho AI - Cải thiện với context tốt hơn
    prompt = (
        f"🍽️ NHIỆM VỤ: Tạo thực đơn dinh dưỡng cho ngày {start_date.strftime('%d/%m/%Y')}\n\n"
        f"📊 THÔNG TIN NGƯỜI DÙNG:\n"
        f"- Giới tính: {gender}\n"
        f"- Tuổi: {age} tuổi\n"
        f"- Chiều cao: {height} cm\n"
        f"- Cân nặng: {weight} kg\n"
        f"- Mục tiêu sức khỏe: {goal}\n"
        f"- Mức độ hoạt động: {activity}\n"
        f"- Dị ứng/Hạn chế: {allergies}{bmr_info}\n\n"
        f"🎯 YÊU CẦU THỰC ĐƠN:\n"
        f"1. Tạo 3 bữa ăn chính: Bữa sáng, Bữa trưa, Bữa tối\n"
        f"2. Mỗi món ăn phải ghi:\n"
        f"   - Tên món ăn (món Việt Nam ưu tiên)\n"
        f"   - Khẩu phần cụ thể (gram/ml)\n"
        f"   - Calo ước tính cho từng món\n"
        f"3. Cuối cùng tính TỔNG CALO cả ngày\n"
        f"4. Thực đơn cân đối dinh dưỡng: đủ protein, tinh bột, chất béo, rau củ\n"
        f"5. Món ăn đa dạng, phù hợp văn hóa ẩm thực Việt Nam\n"
        f"6. TUYỆT ĐỐI tránh các món có: {allergies}\n\n"
        f"📝 FORMAT TRẢ LỜI (BẮT BUỘC):\n"
        f"Bữa sáng 🌅\n"
        f"- [Tên món] ([gram/ml]) - [calo] kcal\n"
        f"- [Tên món] ([gram/ml]) - [calo] kcal\n\n"
        f"Bữa trưa 🌞\n"
        f"- [Tên món] ([gram/ml]) - [calo] kcal\n"
        f"- [Tên món] ([gram/ml]) - [calo] kcal\n\n"
        f"Bữa tối 🌙\n"
        f"- [Tên món] ([gram/ml]) - [calo] kcal\n"
        f"- [Tên món] ([gram/ml]) - [calo] kcal\n\n"
        f"Tổng calo: [số] kcal\n\n"
        f"⚠️ LƯU Ý:\n"
        f"- KHÔNG hỏi thêm thông tin\n"
        f"- KHÔNG đưa lời khuyên hay giải thích thêm\n"
        f"- CHỈ trả về thực đơn theo đúng format trên\n"
        f"- Dùng emoji phù hợp cho mỗi bữa ăn\n"
    )

    # 3. Lấy số ngày cần tạo (mặc định là 1)
    num_days = data.get('num_days', 1)
    
    # 4. Gọi AI để tạo thực đơn
    ai_reply = get_ai_response(prompt)

    # 5. Lưu vào Database (Bảng daily_menus)
    
    # Nếu chỉ tạo 1 ngày (cách cũ)
    if num_days == 1:
        # Kiểm tra xem ngày đã chọn đã có thực đơn chưa?
        existing_menu = DailyMenu.query.filter_by(user_id=user.id, date=start_date).first()
        
        if existing_menu:
            # Nếu có rồi thì cập nhật lại nội dung mới
            existing_menu.content = ai_reply
            msg = f"Đã cập nhật thực đơn mới cho ngày {start_date.strftime('%d/%m/%Y')}!"
        else:
            # Nếu chưa có thì tạo mới
            new_menu = DailyMenu(
                user_id=user.id,
                date=start_date,
                content=ai_reply,
                total_calories=0
            )
            db.session.add(new_menu)
            msg = f"Đã tạo thực đơn thành công cho ngày {start_date.strftime('%d/%m/%Y')}!"

        try:
            db.session.commit()
            return jsonify({
                'message': msg,
                'date': str(start_date),
                'menu_content': ai_reply
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    # Tạo nhiều ngày
    else:
        created_count = 0
        skipped_count = 0
        failed_count = 0
        created_dates = []
        
        for i in range(num_days):
            current_date = start_date + timedelta(days=i)
            
            # Kiểm tra xem ngày này đã có thực đơn chưa
            existing_menu = DailyMenu.query.filter_by(user_id=user.id, date=current_date).first()
            
            if existing_menu:
                skipped_count += 1
                continue
            
            # Tạo thực đơn mới cho ngày này
            try:
                # Lấy 3 thực đơn gần đây nhất để tránh lặp món
                recent_menus = DailyMenu.query.filter_by(user_id=user.id)\
                    .filter(DailyMenu.date < current_date)\
                    .order_by(DailyMenu.date.desc())\
                    .limit(3)\
                    .all()
                
                # Tạo danh sách món ăn đã dùng gần đây
                used_dishes = ""
                if recent_menus:
                    used_dishes = "\n\n🚫 TUYỆT ĐỐI KHÔNG LẶP LẠI CÁC MÓN SAU (đã dùng trong 3 ngày gần đây):\n"
                    for menu in recent_menus:
                        # Trích xuất tên món từ thực đơn (lấy các dòng có dấu -)
                        lines = menu.content.split('\n')
                        dishes_list = []
                        for line in lines:
                            if line.strip().startswith('-') and 'kcal' in line.lower():
                                # Lấy tên món (phần trước dấu ngoặc)
                                dish_name = line.split('(')[0].replace('-', '').strip()
                                if dish_name and len(dish_name) > 3:
                                    dishes_list.append(dish_name)
                        
                        if dishes_list:
                            used_dishes += f"  Ngày {menu.date.strftime('%d/%m')}: {', '.join(dishes_list)}\n"
                    
                    used_dishes += "\n⚡ BẮT BUỘC: Thực đơn hôm nay phải có món ăn HOÀN TOÀN KHÁC, sáng tạo và đa dạng!\n"
                
                # Tạo prompt riêng cho từng ngày với danh sách món đã dùng
                daily_prompt = (
                    f"🍽️ NHIỆM VỤ: Tạo thực đơn dinh dưỡng cho ngày {current_date.strftime('%d/%m/%Y')} (Ngày thứ {i+1})\n\n"
                    f"📊 THÔNG TIN NGƯỜI DÙNG:\n"
                    f"- Giới tính: {gender}\n"
                    f"- Tuổi: {age} tuổi\n"
                    f"- Chiều cao: {height} cm\n"
                    f"- Cân nặng: {weight} kg\n"
                    f"- Mục tiêu sức khỏe: {goal}\n"
                    f"- Mức độ hoạt động: {activity}\n"
                    f"- Dị ứng/Hạn chế: {allergies}{bmr_info}{used_dishes}\n\n"
                    f"🎯 YÊU CẦU THỰC ĐƠN:\n"
                    f"1. Tạo 3 bữa ăn chính: Bữa sáng, Bữa trưa, Bữa tối\n"
                    f"2. Mỗi món ăn phải ghi:\n"
                    f"   - Tên món ăn (món Việt Nam ưu tiên)\n"
                    f"   - Khẩu phần cụ thể (gram/ml)\n"
                    f"   - Calo ước tính cho từng món\n"
                    f"3. Cuối cùng tính TỔNG CALO cả ngày\n"
                    f"4. Thực đơn cân đối dinh dưỡng: đủ protein, tinh bột, chất béo, rau củ\n"
                    f"5. Món ăn ĐA DẠNG, sáng tạo, phù hợp văn hóa ẩm thực Việt Nam\n"
                    f"6. TUYỆT ĐỐI tránh các món có: {allergies}\n"
                    f"7. Thay đổi cách chế biến: luân phiên chiên, xào, hấp, luộc, nướng, kho\n"
                    f"8. Đa dạng nguồn protein: thịt bò, thịt lợn, gà, cá, trứng, đậu phụ\n\n"
                    f"📝 FORMAT TRẢ LỜI (BẮT BUỘC):\n"
                    f"Bữa sáng 🌅\n"
                    f"- [Tên món] ([gram/ml]) - [calo] kcal\n"
                    f"- [Tên món] ([gram/ml]) - [calo] kcal\n\n"
                    f"Bữa trưa 🌞\n"
                    f"- [Tên món] ([gram/ml]) - [calo] kcal\n"
                    f"- [Tên món] ([gram/ml]) - [calo] kcal\n\n"
                    f"Bữa tối 🌙\n"
                    f"- [Tên món] ([gram/ml]) - [calo] kcal\n"
                    f"- [Tên món] ([gram/ml]) - [calo] kcal\n\n"
                    f"Tổng calo: [số] kcal\n\n"
                    f"⚠️ LƯU Ý:\n"
                    f"- KHÔNG hỏi thêm thông tin\n"
                    f"- KHÔNG đưa lời khuyên hay giải thích thêm\n"
                    f"- CHỈ trả về thực đơn theo đúng format trên\n"
                    f"- Dùng emoji phù hợp cho mỗi bữa ăn\n"
                    f"- HÃY SÁNG TẠO - thực đơn này phải ĐẶC BIỆT và KHÁC BIỆT!\n"
                )
                
                # Gọi AI để tạo thực đơn cho ngày này
                daily_ai_reply = get_ai_response(daily_prompt)
                
                new_menu = DailyMenu(
                    user_id=user.id,
                    date=current_date,
                    content=daily_ai_reply,
                    total_calories=0
                )
                db.session.add(new_menu)
                db.session.commit()
                
                created_count += 1
                created_dates.append(str(current_date))
            except Exception as e:
                db.session.rollback()
                failed_count += 1
                print(f"Lỗi tạo thực đơn ngày {current_date}: {str(e)}")
        
        return jsonify({
            'message': f'Đã tạo {created_count} thực đơn',
            'summary': {
                'created': created_count,
                'skipped': skipped_count,
                'failed': failed_count,
                'dates_created': created_dates
            }
        }), 200

@menu_bp.route('/today', methods=['GET'])
@login_required
def get_menu_today():
    today = date.today()
    menu = DailyMenu.query.filter_by(user_id=current_user.id, date=today).first()
    
    if menu:
        return jsonify({
            'date': str(menu.date),
            'content': menu.content,
            'calories': menu.total_calories
        })
    else:
        return jsonify({'message': 'Hôm nay chưa có thực đơn nào.'}), 404

@menu_bp.route('/by-date', methods=['GET'])
@login_required
def get_menu_by_date():
    """Lấy thực đơn theo ngày cụ thể"""
    from datetime import datetime
    date_str = request.args.get('date')  # Format: YYYY-MM-DD
    
    if not date_str:
        return jsonify({'error': 'Thiếu tham số date'}), 400
    
    try:
        menu_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD'}), 400
    
    menu = DailyMenu.query.filter_by(user_id=current_user.id, date=menu_date).first()
    
    if menu:
        return jsonify({
            'date': str(menu.date),
            'content': menu.content,
            'calories': menu.total_calories
        }), 200
    else:
        return jsonify({'message': f'Không có thực đơn cho ngày {date_str}'}), 404

@menu_bp.route('/delete/<date_str>', methods=['DELETE'])
@login_required
def delete_menu(date_str):
    """Xóa thực đơn theo ngày"""
    from datetime import datetime
    
    try:
        menu_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Định dạng ngày không hợp lệ. Dùng YYYY-MM-DD'}), 400
    
    menu = DailyMenu.query.filter_by(user_id=current_user.id, date=menu_date).first()
    
    if not menu:
        return jsonify({'error': f'Không tìm thấy thực đơn cho ngày {date_str}'}), 404
    
    try:
        db.session.delete(menu)
        db.session.commit()
        return jsonify({'message': f'Đã xóa thực đơn ngày {date_str}'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@menu_bp.route('/generate-7-days', methods=['POST'])
@login_required
def generate_7_days_menu():
    """Tạo thực đơn cho 7 ngày tiếp theo"""
    from datetime import timedelta
    
    user = current_user
    
    # Lấy ngày bắt đầu (mặc định là hôm nay)
    data = request.get_json() or {}
    start_date_str = data.get('start_date')
    if start_date_str:
        start_date = date.fromisoformat(start_date_str)
    else:
        start_date = date.today()
    
    # Thông tin user để tạo prompt
    weight = user.weight if user.weight else "không rõ"
    height = user.height if user.height else "không rõ"
    age = user.age if user.age else "không rõ"
    gender = user.gender if user.gender else "không rõ"
    goal = user.dietary_preferences if user.dietary_preferences else "Duy trì sức khỏe"
    activity = user.activity_level if user.activity_level else "Vận động vừa"
    allergies = user.allergies if user.allergies else "Không có"
    
    created_menus = []
    errors = []
    
    # Tạo thực đơn cho 7 ngày
    for i in range(7):
        target_date = start_date + timedelta(days=i)
        
        # Kiểm tra xem ngày này đã có thực đơn chưa
        existing_menu = DailyMenu.query.filter_by(
            user_id=user.id, 
            date=target_date
        ).first()
        
        if existing_menu:
            # Đã có rồi, bỏ qua
            continue
        
        # Tạo prompt cho AI
        prompt = (
            f"Bạn là chuyên gia dinh dưỡng. Hãy tạo thực đơn ăn uống cho 1 ngày ({target_date.strftime('%d/%m/%Y')}) dựa trên thông tin sau:\n"
            f"- Giới tính: {gender}\n"
            f"- Tuổi: {age}\n"
            f"- Chiều cao: {height}cm\n"
            f"- Cân nặng: {weight}kg\n"
            f"- Mục tiêu: {goal}\n"
            f"- Mức độ vận động: {activity}\n"
            f"- Dị ứng/Không ăn được: {allergies}\n\n"
            f"YÊU CẦU:\n"
            f"1. Chỉ trả về thực đơn 3 bữa: Sáng, Trưa, Tối\n"
            f"2. Mỗi bữa ghi rõ: tên món ăn, khẩu phần (gram), calo ước tính\n"
            f"3. Cuối cùng ghi tổng calo cả ngày\n"
            f"4. Đa dạng món ăn, không lặp lại\n"
            f"5. Trả lời ngắn gọn, có emoji\n"
        )
        
        try:
            # Gọi AI
            ai_reply = get_ai_response(prompt)
            
            # Lưu vào database
            new_menu = DailyMenu(
                user_id=user.id,
                date=target_date,
                content=ai_reply,
                total_calories=0
            )
            db.session.add(new_menu)
            created_menus.append(target_date.strftime('%d/%m/%Y'))
            
        except Exception as e:
            errors.append(f"{target_date.strftime('%d/%m/%Y')}: {str(e)}")
    
    # Commit tất cả
    try:
        db.session.commit()
        return jsonify({
            'success': True,
            'message': f'Đã tạo thực đơn cho {len(created_menus)} ngày',
            'created_dates': created_menus,
            'errors': errors
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Lỗi lưu database: ' + str(e)
        }), 500

@menu_bp.route('/week', methods=['GET'])
@login_required
def get_menu_week():
    """Lấy thực đơn 7 ngày gần nhất"""
    from datetime import timedelta
    
    today = date.today()
    week_ago = today - timedelta(days=6)  # Lấy 7 ngày (hôm nay + 6 ngày trước)
    
    menus = DailyMenu.query.filter(
        DailyMenu.user_id == current_user.id,
        DailyMenu.date >= week_ago,
        DailyMenu.date <= today
    ).order_by(DailyMenu.date.desc()).all()
    
    result = []
    for menu in menus:
        result.append({
            'date': str(menu.date),
            'content': menu.content,
            'calories': menu.total_calories
        })
    
    return jsonify({'menus': result, 'count': len(result)}), 200