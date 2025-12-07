# 🍽️ AI Meal Planner - Lên Thực Đơn Dinh Dưỡng Thông Minh

Ứng dụng web tự động tạo thực đơn ăn uống hàng ngày dựa trên thông tin sức khỏe người dùng, sử dụng AI (Google Gemini).

## 🎯 Tính năng
- ✅ Đăng ký/Đăng nhập tài khoản
- ✅ Quản lý thông tin sức khỏe (chiều cao, cân nặng, BMI)
- ✅ Tạo thực đơn tự động bằng AI (3 bữa/ngày)
- ✅ Xem thực đơn theo từng ngày
- ✅ Cập nhật thực đơn cho các ngày khác nhau

## 🛠️ Tech Stack
- **Backend:** Flask + PostgreSQL
- **Frontend:** HTML/CSS/JavaScript
- **AI:** Google Gemini (gemma-3-1b-it)

---

## 📦 Hướng dẫn Cài đặt

### Bước 1: Clone dự án

```bash
git clone https://github.com/lam-vu6868/LenThucDonHangNgay.git
cd LenThucDonHangNgay/my-project
```

### Bước 2: Cài đặt PostgreSQL

```bash
# Cài PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Khởi động service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Bước 3: Tạo Database

```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Chạy các lệnh SQL sau:
CREATE USER flask_user WITH PASSWORD 'password123';
CREATE DATABASE flask_project;
ALTER DATABASE flask_project OWNER TO flask_user;
GRANT ALL PRIVILEGES ON DATABASE flask_project TO flask_user;

# Thoát
\q
```

**Test kết nối:**
```bash
PGPASSWORD=password123 psql -h localhost -U flask_user -d flask_project -c "\dt"
```

### Bước 4: Setup Backend

```bash
cd backend

# Tạo và kích hoạt môi trường ảo
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc: venv\Scripts\activate  # Windows

# Cài đặt thư viện
pip install -r requirements.txt
```

### Bước 5: Tạo file .env

Tạo file `.env` trong thư mục `backend/`:

```bash
nano .env
```

Thêm nội dung sau (thay `GEMINI_API_KEY` bằng key của bạn):

```env
SECRET_KEY=dev
DATABASE_URL=postgresql://flask_user:password123@localhost:5432/flask_project
GEMINI_API_KEY=your_google_ai_key_here
```

**Lấy Google AI API Key:** https://aistudio.google.com/apikey

Lưu file: `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 🚀 BƯỚC 6: Chạy Backend Server

#### **6.1. Đảm bảo đang ở đúng vị trí**

```bash
# Kiểm tra thư mục hiện tại
pwd
# Kết quả: /home/lamvu/LenMenu/my-project/backend

# Nếu sai, di chuyển vào backend
cd /home/lamvu/LenMenu/my-project/backend
```

#### **6.2. Bật môi trường ảo**

**⚠️ QUAN TRỌNG: Phải bật venv trước khi chạy!**

```bash
# Linux/Mac:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

**Kiểm tra đã bật chưa:**
```bash
# Dòng lệnh phải có (venv) ở đầu:
# (venv) user@machine:~/my-project/backend$

# Hoặc kiểm tra bằng lệnh:
which python
# Kết quả phải có chữ "venv": .../venv/bin/python
```

#### **6.3. Chạy Backend Server**

```bash
python3 run.py
```

**⏳ Đợi 2-3 giây...**

#### **6.4. Kết quả thành công**

**Bạn sẽ thấy:**
```
✅ Database đã sẵn sàng!
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
 * Restarting with stat
✅ Database đã sẵn sàng!
 * Debugger is active!
 * Debugger PIN: xxx-xxx-xxx
```

**✅ Checkpoint:** Backend đang chạy ở `http://127.0.0.1:5000`

**💡 Giải thích:**
- `✅ Database đã sẵn sàng!` → Đã kết nối PostgreSQL và tạo bảng thành công
- `Running on http://127.0.0.1:5000` → Server đang lắng nghe port 5000
- `Debug mode: on` → Khi sửa code sẽ tự động reload

**🚫 GIỮ NGUYÊN Terminal này, KHÔNG tắt!**

#### **6.5. Nếu gặp lỗi - Cách xử lý**

**Lỗi 1: `ModuleNotFoundError: No module named 'flask'`**
```
➡️ Nguyên nhân: Chưa bật venv hoặc chưa cài thư viện
➡️ Fix:
source venv/bin/activate
pip install -r requirements.txt
```

**Lỗi 2: `FATAL: database "flask_project" does not exist`**
```
➡️ Nguyên nhân: Chưa tạo database trong PostgreSQL
➡️ Fix: Quay lại BƯỚC 2
```

**Lỗi 3: `password authentication failed for user "flask_user"`**
```
➡️ Nguyên nhân: Sai password trong file .env
➡️ Fix:
nano .env
# Kiểm tra dòng DATABASE_URL có đúng password123 không
```

**Lỗi 4: `connection to server on socket ... failed`**
```
➡️ Nguyên nhân: PostgreSQL chưa chạy
➡️ Fix:
sudo systemctl start postgresql
pg_isready  # Kiểm tra
```

**Lỗi 5: `No module named 'psycopg2'`**
```
➡️ Nguyên nhân: Driver PostgreSQL chưa cài
➡️ Fix:
source venv/bin/activate
pip install psycopg2-binary
```
   - `auth_bp` → API `/api/auth/*` (login, register, logout, me)
   - `menu_bp` → API `/api/menu/*` (generate, by-date)
5. **Khởi động Flask Development Server** ở port 5000

**✅ Kết quả thành công sẽ hiển thị:**
```
✅ Database đã sẵn sàng!
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
 * Restarting with stat
 * Debugger is active!
 * Debugger PIN: xxx-xxx-xxx
```

**❌ Nếu gặp lỗi:**

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| `ModuleNotFoundError: No module named 'flask'` | Chưa cài thư viện hoặc chưa bật venv | `source venv/bin/activate` → `pip install -r requirements.txt` |
| `FATAL: database "flask_project" does not exist` | Chưa tạo database PostgreSQL | Quay lại Bước 2.2 |
| `FATAL: password authentication failed for user "flask_user"` | Sai password trong `.env` | Kiểm tra lại `DATABASE_URL` |
| `connection refused` | PostgreSQL chưa chạy | `sudo systemctl start postgresql` |
| `ImportError: cannot import name 'db'` | Lỗi circular import | Kiểm tra cấu trúc import trong `__init__.py` |

**🔧 Debug:**
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Test kết nối database
PGPASSWORD=password123 psql -h localhost -U flask_user -d flask_project -c "\dt"

# Kiểm tra biến môi trường đã load chưa
python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('DATABASE_URL'))"
```

---

### 🌐 BƯỚC 7: Chạy Frontend Server

Frontend là trang web tĩnh (HTML/CSS/JS), không cần cài thư viện.

**⚠️ Backend phải đang chạy (BƯỚC 6) trước khi chạy Frontend!**

#### **7.1. Mở Terminal mới (Terminal thứ 2)**

**⚠️ GIỮ NGUYÊN Terminal 1 (đang chạy Backend), MỞ Terminal MỚI!**

**Trong VS Code:**
- Nhấn `Ctrl + Shift + ~` (tạo terminal mới)
- Hoặc click dấu `+` trên tab Terminal

**Trong Terminal riêng:**
- Mở cửa sổ Terminal mới
- Hoặc mở tab mới (Ctrl+Shift+T)

#### **7.2. Di chuyển vào thư mục frontend**

```bash
# Di chuyển vào thư mục frontend
cd /home/lamvu/LenMenu/my-project/frontend

# Kiểm tra đúng thư mục chưa
pwd
# Kết quả: /home/lamvu/LenMenu/my-project/frontend

# Xem các file
ls
# Kết quả: index.html  login.html  register.html  dashboard.html  static/
```

#### **7.3. Chạy HTTP Server**

```bash
# Chạy server Python đơn giản
python3 -m http.server 8000
```

#### **7.4. Kết quả thành công**

```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

**✅ Checkpoint:** Frontend đang chạy ở `http://localhost:8000`

**💡 Giải thích:**
- Không cần `venv` vì chỉ serve file HTML tĩnh
- Port `8000` khác với Backend (`5000`)
- `python3 -m http.server` là module có sẵn trong Python

**🚫 GIỮ NGUYÊN Terminal này cùng với Terminal Backend!**

---

### 🎯 BƯỚC 8: Mở trình duyệt và test

#### **8.1. Tóm tắt trạng thái hiện tại**

Bạn đang có 2 Terminal đang chạy:
- **Terminal 1:** Backend (port 5000) - `python3 run.py`
- **Terminal 2:** Frontend (port 8000) - `python3 -m http.server 8000`

#### **8.2. Mở trình duyệt**

```bash
# Mở trình duyệt tự động (Linux)
xdg-open http://localhost:8000

# Hoặc mở thủ công:
# 1. Mở Chrome/Firefox
# 2. Nhập: http://localhost:8000
```

#### **8.3. Danh sách các trang**

| Trang | URL | Mô tả |
|-------|-----|-------|
| **Trang chủ** | http://localhost:8000/index.html | Landing page |
| **Đăng ký** | http://localhost:8000/register.html | Tạo tài khoản |
| **Đăng nhập** | http://localhost:8000/login.html | Đăng nhập |
| **Dashboard** | http://localhost:8000/dashboard.html | Quản lý thực đơn (cần đăng nhập) |

#### **8.4. Test đăng ký tài khoản**

1. Truy cập: http://localhost:8000/register.html
2. Điền form:
   - Username: `testuser`
   - Email: `test@gmail.com`
   - Password: `123456`
   - Height: `170`
   - Weight: `65`
3. Nhấn **"Đăng ký"**
4. Nếu thành công → Chuyển sang trang login

#### **8.5. Test đăng nhập**

1. Truy cập: http://localhost:8000/login.html
2. Điền:
   - Username: `testuser`
   - Password: `123456`
3. Nhấn **"Đăng nhập"**
4. Nếu thành công → Chuyển sang Dashboard

#### **8.6. Test tạo thực đơn AI**

1. Ở Dashboard, nhấn **"Tạo Thực Đơn"**
2. Điền thông tin (hoặc giữ nguyên mặc định)
3. Nhấn **"Tạo"**
4. Đợi 5-10 giây (AI đang tạo)
5. Thực đơn sẽ hiển thị với 3 bữa: Sáng, Trưa, Tối

**✅ Checkpoint:** Ứng dụng hoạt động hoàn chỉnh!

---

### 🔍 BƯỚC 9: Xem dữ liệu trong Database

#### **9.1. Cách 1: Dùng psql (Nhanh nhất)**

**Mở Terminal mới (Terminal thứ 3):**

```bash
# Kết nối vào database
PGPASSWORD=password123 psql -h localhost -U flask_user -d flask_project
```

**Bạn sẽ thấy:** `flask_project=>`

**Các lệnh SQL hữu ích:**

```sql
-- 1. Xem danh sách bảng
\dt

-- 2. Xem cấu trúc bảng users
\d users

-- 3. Xem tất cả users
SELECT * FROM users;

-- 4. Xem user cụ thể với thông tin đầy đủ
SELECT id, username, email, height, weight, age FROM users;

-- 5. Xem tất cả menus
SELECT id, user_id, date, LEFT(content, 60) as preview 
FROM daily_menus 
ORDER BY date DESC;

-- 6. Xem menu chi tiết của user (thay 2 = id user của bạn)
SELECT date, content 
FROM daily_menus 
WHERE user_id = 2 
ORDER BY date DESC;

-- 7. Đếm số menu mỗi user đã tạo
SELECT user_id, COUNT(*) as total_menus 
FROM daily_menus 
GROUP BY user_id;

-- 8. Xem menu ngày hôm nay
SELECT * FROM daily_menus WHERE date = CURRENT_DATE;

-- 9. Thoát
\q
```

#### **9.2. Cách 2: Dùng Python (Qua ORM)**

```bash
# Vào thư mục backend
cd /home/lamvu/LenMenu/my-project/backend

# Bật venv
source venv/bin/activate

# Mở Python
python3
```

**Trong Python shell:**

```python
# Import models
from app import create_app, db
from app.models.user import User
from app.models.menu import DailyMenu
from datetime import date

# Tạo app context
app = create_app()
with app.app_context():
    # Xem tất cả users
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, User: {u.username}, Email: {u.email}")
    
    # Lấy user cụ thể
    user = User.query.filter_by(username='testuser').first()
    if user:
        print(f"Height: {user.height}cm, Weight: {user.weight}kg")
    
    # Xem menu của user
    if user:
        menus = DailyMenu.query.filter_by(user_id=user.id).all()
        for menu in menus:
            print(f"Date: {menu.date}")
            print(f"Content: {menu.content[:100]}...")
    
    # Thoát Python
    exit()
```

#### **9.3. Cách 3: Dùng pgAdmin (GUI)**

1. Tải pgAdmin: https://www.pgadmin.org/download/
2. Cài đặt và mở
3. Add New Server:
   - **General → Name:** Flask Project
   - **Connection → Host:** localhost
   - **Connection → Port:** 5432
   - **Connection → Database:** flask_project
   - **Connection → Username:** flask_user
   - **Connection → Password:** password123
4. Save và explore tables

---

### 🛑 BƯỚC 10: Dừng Server

#### **10.1. Dừng Backend (Terminal 1)**

```bash
# Trong terminal đang chạy python3 run.py
# Nhấn: Ctrl + C

# Kết quả:
# ^C
# KeyboardInterrupt
```

#### **10.2. Dừng Frontend (Terminal 2)**

```bash
# Trong terminal đang chạy http.server
# Nhấn: Ctrl + C
```

#### **10.3. Tắt môi trường ảo**

```bash
# Trong terminal backend
deactivate

# Dấu (venv) sẽ biến mất
```

---

### 🔄 BƯỚC 11: Khởi động lại (Quy trình hoàn chỉnh)

**Mỗi lần muốn chạy lại dự án:**

**Terminal 1 - Backend:**
```bash
# 1. Vào thư mục backend
cd /home/lamvu/LenMenu/my-project/backend

# 2. Bật venv
source venv/bin/activate

# 3. Chạy server
python3 run.py

# Đợi thấy: "Running on http://127.0.0.1:5000"
```

**Terminal 2 - Frontend:**
```bash
# 1. Vào thư mục frontend
cd /home/lamvu/LenMenu/my-project/frontend

# 2. Chạy HTTP server
python3 -m http.server 8000

# Đợi thấy: "Serving HTTP on 0.0.0.0 port 8000"
```

**Mở trình duyệt:**
```
http://localhost:8000
```

**✅ XONG! Dự án đã sẵn sàng hoạt động!**

---

### 💡 Lưu ý quan trọng

1. **Luôn bật Backend trước, Frontend sau**
2. **Mỗi lần sửa code Python → Nhấn Ctrl+C và chạy lại `python3 run.py`**
3. **Sửa HTML/CSS/JS → Chỉ cần refresh browser (F5)**
4. **Sửa file .env → Phải restart Backend**
5. **PostgreSQL phải đang chạy:** `sudo systemctl status postgresql`
6. **Kiểm tra port 5000 và 8000 không bị chiếm bởi ứng dụng khác**

---

### 🎯 7. Truy cập ứng dụng (Tóm tắt)

**Danh sách các trang:**

| Trang | URL | Mô tả | Yêu cầu đăng nhập |
|-------|-----|-------|-------------------|
| **Trang chủ** | http://localhost:8000/index.html | Landing page, giới thiệu | ❌ Không |
| **Đăng ký** | http://localhost:8000/register.html | Tạo tài khoản mới | ❌ Không |
| **Đăng nhập** | http://localhost:8000/login.html | Đăng nhập vào hệ thống | ❌ Không |
| **Dashboard** | http://localhost:8000/dashboard.html | Trang chính - Quản lý thực đơn | ✅ Có |

**API Endpoints (Backend):**

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `http://localhost:5000/api/auth/register` | Đăng ký tài khoản |
| POST | `http://localhost:5000/api/auth/login` | Đăng nhập |
| GET | `http://localhost:5000/api/auth/me` | Lấy thông tin user hiện tại |
| POST | `http://localhost:5000/api/auth/logout` | Đăng xuất |
| POST | `http://localhost:5000/api/menu/generate` | Tạo thực đơn bằng AI |
| GET | `http://localhost:5000/api/menu/by-date?date=YYYY-MM-DD` | Lấy menu theo ngày |

---

### 🔍 8. Kiểm tra và Quản lý Database (PostgreSQL)

#### **Cách 1: Dùng psql (Command Line)**

**Kết nối vào database:**
```bash
# Cú pháp đầy đủ (khuyên dùng)
PGPASSWORD=password123 psql -h localhost -U flask_user -d flask_project

# Nếu đã config pg_hba.conf = md5
psql -h localhost -U flask_user -d flask_project
# Nhập password: password123
```

**Các lệnh PostgreSQL thường dùng:**
```sql
-- Xem danh sách bảng
\dt

-- Xem cấu trúc bảng users
\d users

-- Xem tất cả users
SELECT * FROM users;

-- Xem user cụ thể
SELECT id, username, email, height, weight FROM users WHERE id = 2;

-- Xem tất cả menus (giới hạn 50 ký tự content)
SELECT id, user_id, date, LEFT(content, 50) as preview, total_calories 
FROM daily_menus 
ORDER BY date DESC;

-- Xem menu của user cụ thể
SELECT date, LEFT(content, 100) as preview 
FROM daily_menus 
WHERE user_id = 2 
ORDER BY date DESC;

-- Đếm số lượng menus theo user
SELECT user_id, COUNT(*) as total_menus 
FROM daily_menus 
GROUP BY user_id;

-- Xem thông tin chi tiết 1 menu
SELECT * FROM daily_menus WHERE id = 1;

-- Xóa menu cũ (nếu muốn)
DELETE FROM daily_menus WHERE date < '2025-12-01';

-- Thoát
\q
```

#### **Cách 2: Dùng Python Shell**

```bash
# Vào thư mục backend và bật venv
cd my-project/backend
source venv/bin/activate

# Chạy Python
python3
```

**Trong Python shell:**
```python
# Import models
from app import create_app, db
from app.models.user import User
from app.models.menu import DailyMenu

# Tạo app context
app = create_app()
with app.app_context():
    # Xem tất cả users
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}")
    
    # Lấy user cụ thể
    user = User.query.get(2)  # ID = 2
    print(f"Username: {user.username}")
    print(f"Height: {user.height}cm, Weight: {user.weight}kg")
    
    # Xem tất cả menus của user
    menus = DailyMenu.query.filter_by(user_id=2).all()
    for menu in menus:
        print(f"Date: {menu.date}, Preview: {menu.content[:50]}...")
    
    # Lấy menu theo ngày
    from datetime import date
    menu = DailyMenu.query.filter_by(user_id=2, date=date(2025, 12, 7)).first()
    if menu:
        print(menu.content)
    
    # Thoát
    exit()
```

#### **Cách 3: Dùng pgAdmin (GUI Tool)**

1. Tải pgAdmin: https://www.pgadmin.org/download/
2. Cài đặt và mở pgAdmin
3. Click "Add New Server"
4. **General tab:**
   - Name: `Flask Project`
5. **Connection tab:**
   - Host: `localhost`
   - Port: `5432`
   - Database: `flask_project`
   - Username: `flask_user`
   - Password: `password123`
6. Click "Save"
7. Explore: `Servers > Flask Project > Databases > flask_project > Schemas > public > Tables`

---

### 🛑 9. Dừng và Khởi động lại Server

#### **Dừng Server:**

**Dừng Backend (Terminal 1):**
```bash
# Trong terminal đang chạy python3 run.py
# Nhấn: Ctrl + C

# Kết quả:
# ^C
# KeyboardInterrupt
```

**Dừng Frontend (Terminal 2):**
```bash
# Trong terminal đang chạy http.server
# Nhấn: Ctrl + C
```

**Tắt môi trường ảo:**
```bash
# Trong terminal backend
deactivate

# Dấu (venv) sẽ biến mất
```

---

#### **Khởi động lại Server (Quy trình đầy đủ):**

**Terminal 1 - Backend:**
```bash
# 1. Vào thư mục backend
cd /home/lamvu/LenMenu/my-project/backend

# 2. Bật môi trường ảo
source venv/bin/activate

# 3. Chạy server
python3 run.py
```

**Terminal 2 - Frontend:**
```bash
# 1. Vào thư mục frontend
cd /home/lamvu/LenMenu/my-project/frontend

# 2. Chạy HTTP server
python3 -m http.server 8000
```

**🎯 Lưu ý:**
- Luôn chạy Backend trước, Frontend sau
- Nếu code backend thay đổi, nhấn Ctrl+C và chạy lại `python3 run.py`
- Nếu sửa file .env, phải restart backend
- Frontend không cần restart nếu chỉ sửa HTML/CSS/JS (chỉ cần refresh browser)

---

## 📂 Cấu trúc dự án chi tiết (Project Structure)

```
my-project/
├── README.md                   # 📖 Tài liệu hướng dẫn (File này)
│
├── frontend/                   # 🎨 Phần giao diện người dùng (Static Files)
│   ├── index.html              # Trang chủ
│   ├── login.html              # Trang đăng nhập
│   ├── register.html           # Trang đăng ký
│   ├── dashboard.html          # Trang quản lý thực đơn (Chính)
│   ├── test-session.html       # Test session (Dev only)
│   │
│   ├── static/                 # Thư mục chứa CSS, JS, Images
│   │   ├── css/
│   │   │   ├── style.css       # Style chung
│   │   │   ├── auth.css        # Style cho login/register
│   │   │   └── dashboard-new.css # Style cho dashboard
│   │   │
│   │   ├── js/
│   │   │   ├── api.js          # Config API endpoint
│   │   │   ├── auth.js         # Xử lý login/register
│   │   │   ├── main.js         # Logic chung
│   │   │   └── dashboard-new.js # Logic dashboard (Tạo menu, hiển thị)
│   │   │
│   │   └── img/                # Hình ảnh
│   │
│   └── templates/              # (Không dùng - Dự phòng)
│       └── base.html
│
└── backend/                    # ⚙️ Phần xử lý logic, database, API (Python)
    ├── .env                    # 🔐 File chứa biến môi trường (SECRET_KEY, API_KEY, DB_URL)
    ├── run.py                  # 🚀 File khởi chạy server (Entry point)
    ├── config.py               # ⚙️ Class cấu hình Flask App
    ├── requirements.txt        # 📦 Danh sách thư viện cần cài
    ├── create_db.py            # 🗄️ Script tạo database thủ công (Optional)
    ├── test_ai.py              # 🧪 Test Google AI API
    ├── test_api.py             # 🧪 Test các API endpoints
    ├── test_session.py         # 🧪 Test session login
    │
    ├── venv/                   # 📦 Môi trường ảo Python (Không commit lên Git)
    │
    ├── instance/               # 🗄️ Thư mục chứa database SQLite
    │   └── menu_app.db         # File database (Tự động tạo)
    │
    └── app/                    # 📁 Thư mục chính chứa code logic
        │
        ├── __init__.py         # 🏗️ Khởi tạo Flask App, Database, Extensions
        │                       #    - Tạo đối tượng db (SQLAlchemy)
        │                       #    - Cấu hình CORS, Login Manager
        │                       #    - Đăng ký các Blueprint (routes)
        │                       #    - Tự động tạo bảng (db.create_all)
        │
        ├── models/             # 🗂️ Định nghĩa cấu trúc Database (ORM Models)
        │   ├── __init__.py
        │   ├── user.py         # 👤 Model User (Bảng users)
        │   │                   #    - id, username, email, password_hash
        │   │                   #    - height, weight, age, gender
        │   │                   #    - activity_level, dietary_preferences, allergies
        │   │                   #    - Quan hệ: 1 User -> N Menus, N WeightLogs
        │   │
        │   ├── menu.py         # 📋 Model DailyMenu (Bảng daily_menus)
        │   │                   #    - id, user_id, date, content
        │   │                   #    - total_calories, created_at
        │   │                   #    - Unique constraint: (user_id, date)
        │   │
        │   ├── dish.py         # 🍽️ Model Dish (Bảng dishes) - Chưa dùng
        │   └── weight_log.py   # ⚖️ Model WeightLog (Bảng weight_logs) - Chưa dùng
        │
        ├── routes/             # 🛣️ Định nghĩa API Endpoints (Blueprint)
        │   ├── __init__.py
        │   │
        │   ├── main_routes.py  # 🏠 Routes trang chủ
        │   │                   #    GET / -> Redirect to frontend
        │   │
        │   ├── auth_routes.py  # 🔐 Routes xác thực (Blueprint: /api/auth)
        │   │                   #    POST /api/auth/register -> Đăng ký
        │   │                   #    POST /api/auth/login -> Đăng nhập
        │   │                   #    POST /api/auth/logout -> Đăng xuất
        │   │                   #    GET  /api/auth/me -> Lấy thông tin user hiện tại
        │   │
        │   └── menu_routes.py  # 📋 Routes thực đơn (Blueprint: /api/menu)
        │                       #    POST /api/menu/generate -> Tạo thực đơn bằng AI
        │                       #    GET  /api/menu/<date> -> Lấy thực đơn theo ngày
        │
        └── services/           # 🤖 Các dịch vụ bên ngoài
            ├── __init__.py
            └── ai_service.py   # 🧠 Gọi Google Gemini AI
                                #    - Hàm get_ai_response(prompt)
                                #    - Model: gemma-3-1b-it
```

---

## 🔄 Luồng hoạt động (Workflow)

### 1️⃣ **Đăng ký tài khoản**
```
User điền form → Frontend (register.html) 
→ JS gửi POST /api/auth/register 
→ Backend (auth_routes.py) 
→ Tạo User mới → Hash password → Lưu vào DB 
→ Trả JSON success
```

### 2️⃣ **Đăng nhập**
```
User nhập username/password → Frontend (login.html)
→ JS gửi POST /api/auth/login
→ Backend kiểm tra user.check_password()
→ Nếu đúng: login_user() → Tạo Session Cookie
→ Frontend lưu thông tin → Redirect to dashboard.html
```

### 3️⃣ **Tạo thực đơn AI**
```
User chọn ngày + điền thông tin sức khỏe → Dashboard
→ JS gửi POST /api/menu/generate (bao gồm date)
→ Backend (menu_routes.py):
  1. Nhận date từ request
  2. Cập nhật thông tin user (height, weight, age...)
  3. Tạo prompt chi tiết gửi cho AI
  4. Gọi ai_service.get_ai_response(prompt)
  5. AI trả về thực đơn 3 bữa (Sáng, Trưa, Tối)
  6. Kiểm tra DailyMenu cho ngày đã chọn:
     - Nếu có: Cập nhật nội dung mới
     - Nếu chưa: Tạo bản ghi mới với date đã chọn
  7. Lưu vào DB → Trả JSON (menu_content, date)
→ Frontend nhận JSON → Parse nội dung → Hiển thị lên giao diện
```

### 4️⃣ **Xem thực đơn theo ngày**
```
User chọn ngày khác → Dashboard
→ JS gửi GET /api/menu/2024-12-07
→ Backend query DailyMenu.query.filter_by(user_id, date)
→ Nếu có: Trả JSON menu
→ Nếu không: Trả 404
→ Frontend hiển thị hoặc hiện "Chưa có thực đơn"
```

---

## 🔑 Giải thích các file quan trọng

### 📄 `backend/run.py` (Entry Point)
```python
from app import create_app
app = create_app()
if __name__ == '__main__':
    app.run(debug=True)  # Chạy server ở chế độ debug
```
**Nhiệm vụ:** Điểm khởi đầu, gọi hàm `create_app()` và chạy server Flask.

---

### 📄 `backend/config.py` (Configuration)
```python
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')  # Đọc từ .env
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')  # Đọc DB URL từ .env
    SESSION_COOKIE_SAMESITE = 'Lax'  # Bảo mật cookie
```
**Nhiệm vụ:** Quản lý cấu hình toàn cục (Secret key, DB connection, Session settings).

---

### 📄 `backend/app/__init__.py` (Core Setup)
**Nhiệm vụ chính:**
1. **Khởi tạo Extensions:** `db`, `migrate`, `login_manager`, `CORS`
2. **Tạo Flask App:** Đọc config từ `Config` class
3. **Tự động tạo bảng:** `db.create_all()` trong `app_context`
4. **Đăng ký Blueprint:** `auth_bp`, `menu_bp`, `main_bp`

---

### 📄 `backend/app/services/ai_service.py` (AI Integration)
```python
def get_ai_response(prompt: str) -> str:
    model = genai.GenerativeModel('gemma-3-1b-it')
    response = model.generate_content(prompt)
    return response.text
```
**Nhiệm vụ:** Gọi Google Gemini AI với prompt, nhận câu trả lời về thực đơn.

---

### 📄 `frontend/static/js/dashboard-new.js` (Frontend Logic)
**Các hàm chính:**
- `loadMenuByDate(date)`: Gọi API lấy menu theo ngày
- `handleMenuFormSubmit()`: Gửi form tạo menu (kèm date đã chọn)
- `parseMenuContent()`: Parse AI response thành 3 bữa ăn
- `extractCalories()`: Trích xuất tổng calo từ text AI


Tác giả
Developed by: Lý Lâm Vũ & Châu Khang Duy