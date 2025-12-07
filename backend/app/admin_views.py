# backend/app/admin_views.py
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from flask_login import current_user
from flask import redirect, url_for, request, flash
from app import db
from app.models.user import User
from app.models.menu import DailyMenu
from app.models.weight_log import WeightLog


class SecureModelView(ModelView):
    """Base ModelView với authentication và tiếng Việt hóa"""
    
    # Tiếng Việt hóa các text mặc định
    can_create = True
    can_edit = True
    can_delete = True
    can_view_details = True
    can_export = True
    
    # Cấu hình hiển thị
    page_size = 50
    column_display_actions = True
    create_modal = False
    edit_modal = False
    
    # Override các text tiếng Anh
    def __init__(self, model, session, **kwargs):
        super(SecureModelView, self).__init__(model, session, **kwargs)
    
    # Custom labels cho các action
    def get_list_row_actions(self):
        actions = super(SecureModelView, self).get_list_row_actions()
        # Replace English text with Vietnamese
        return actions
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin
    
    def inaccessible_callback(self, name, **kwargs):
        if not current_user.is_authenticated:
            flash('Vui lòng đăng nhập để truy cập trang quản trị!', 'warning')
            return redirect(url_for('auth.login'))
        else:
            flash('Bạn không có quyền truy cập trang quản trị!', 'danger')
            return redirect(url_for('main.index'))


class SecureAdminIndexView(AdminIndexView):
    """Admin Index View với authentication"""
    
    @expose('/')
    def index(self):
        if not current_user.is_authenticated:
            flash('Vui lòng đăng nhập để truy cập trang quản trị!', 'warning')
            return redirect(url_for('auth.login'))
        
        if not current_user.is_admin:
            flash('Bạn không có quyền truy cập trang quản trị!', 'danger')
            return redirect(url_for('main.index'))
        
        # Statistics
        total_users = User.query.count()
        total_menus = DailyMenu.query.count()
        total_weight_logs = WeightLog.query.count()
        admin_count = User.query.filter_by(is_admin=True).count()
        
        return self.render('admin/index.html', 
                         total_users=total_users,
                         total_menus=total_menus,
                         total_weight_logs=total_weight_logs,
                         admin_count=admin_count)


class UserAdminView(SecureModelView):
    """Admin view cho User model"""
    
    # Tên tab/menu
    name = 'Người dùng'
    
    # Phân trang
    page_size = 20
    can_set_page_size = False
    
    # Sắp xếp mặc định: mới nhất đầu tiên
    column_default_sort = ('id', True)  # True = descending
    
    column_list = ['id', 'username', 'email', 'is_admin', 'height', 'weight', 'created_at']
    column_searchable_list = ['username', 'email']
    # Chỉ giữ lại bộ lọc cần thiết
    column_filters = ['is_admin', 'created_at']
    column_editable_list = ['is_admin']
    
    # Hide password hash
    form_excluded_columns = ['password_hash', 'menus', 'weight_logs']
    
    # Display format
    column_formatters = {
        'created_at': lambda v, c, m, p: m.created_at.strftime('%d/%m/%Y %H:%M') if m.created_at else ''
    }
    
    # Labels
    column_labels = {
        'id': 'ID',
        'username': 'Tên đăng nhập',
        'email': 'Email',
        'is_admin': 'Admin',
        'full_name': 'Họ tên',
        'height': 'Chiều cao (cm)',
        'weight': 'Cân nặng (kg)',
        'created_at': 'Ngày tạo',
        'age': 'Tuổi',
        'gender': 'Giới tính',
        'activity_level': 'Mức độ hoạt động',
        'dietary_preferences': 'Mục tiêu dinh dưỡng',
        'allergies': 'Dị ứng'
    }


class MenuAdminView(SecureModelView):
    """Admin view cho DailyMenu model"""
    
    # Tên tab/menu
    name = 'Thực đơn'
    
    # Phân trang
    page_size = 20
    can_set_page_size = False
    
    # Sắp xếp mặc định: mới nhất đầu tiên
    column_default_sort = ('id', True)  # True = descending
    
    column_list = ['id', 'owner', 'date', 'total_calories', 'created_at']
    column_searchable_list = ['content']
    column_filters = ['date']  # Chỉ lọc theo ngày thực đơn
    
    # Cho phép tìm kiếm theo tên user
    column_sortable_list = ['id', ('owner', 'owner.username'), 'date', 'total_calories', 'created_at']
    
    # Display format
    column_formatters = {
        'owner': lambda v, c, m, p: m.owner.username if m.owner else 'N/A',
        'created_at': lambda v, c, m, p: m.created_at.strftime('%d/%m/%Y %H:%M') if m.created_at else '',
        'date': lambda v, c, m, p: m.date.strftime('%d/%m/%Y') if m.date else ''
    }
    
    # Labels
    column_labels = {
        'id': 'ID',
        'owner': 'Người dùng',
        'user_id': 'User ID',
        'date': 'Ngày',
        'content': 'Nội dung',
        'total_calories': 'Tổng calo',
        'created_at': 'Ngày tạo'
    }


class WeightLogAdminView(SecureModelView):
    """Admin view cho WeightLog model"""
    
    # Tên tab/menu
    name = 'Cân nặng'
    
    # Phân trang
    page_size = 20
    can_set_page_size = False
    
    # Sắp xếp mặc định: mới nhất đầu tiên
    column_default_sort = ('id', True)  # True = descending
    
    column_list = ['id', 'user', 'weight', 'recorded_at']
    column_filters = []  # Bỏ hết bộ lọc
    
    # Cho phép tìm kiếm theo tên user
    column_sortable_list = ['id', ('user', 'user.username'), 'weight', 'recorded_at']
    
    # Display format
    column_formatters = {
        'user': lambda v, c, m, p: m.user.username if m.user else 'N/A',
        'recorded_at': lambda v, c, m, p: m.recorded_at.strftime('%d/%m/%Y %H:%M') if m.recorded_at else ''
    }
    
    # Labels
    column_labels = {
        'id': 'ID',
        'user': 'Người dùng',
        'user_id': 'User ID',
        'weight': 'Cân nặng (kg)',
        'recorded_at': 'Thời gian ghi'
    }


def init_admin(app):
    """Initialize Flask-Admin"""
    admin = Admin(
        app,
        name='🍽️ LenMenu - Quản Trị',
        index_view=SecureAdminIndexView(name='Trang Chủ')
    )
    
    # Add views with custom base template
    admin.add_view(UserAdminView(User, db.session, name='👥 Người Dùng', endpoint='user', category='📊 Quản Lý'))
    admin.add_view(MenuAdminView(DailyMenu, db.session, name='🍽️ Thực Đơn', endpoint='dailymenu', category='📊 Quản Lý'))
    admin.add_view(WeightLogAdminView(WeightLog, db.session, name='⚖️ Cân Nặng', endpoint='weightlog', category='📊 Quản Lý'))
    
    return admin
