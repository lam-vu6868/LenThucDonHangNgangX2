# 🍽️ AI Meal Planner - Lên Thực Đơn Dinh Dưỡng Thông Minh

Ứng dụng web tự động tạo thực đơn ăn uống hàng ngày dựa trên thông tin sức khỏe người dùng, sử dụng AI (Google Gemini).

## 🎯 Tính năng
- Đăng ký/Đăng nhập tài khoản
- Quản lý thông tin sức khỏe (chiều cao, cân nặng, BMI)
- Tạo thực đơn tự động bằng AI (3 bữa/ngày)
- Xem và cập nhật thực đơn theo từng ngày

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
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Bước 3: Tạo Database

```bash
sudo -u postgres psql
```

Chạy các lệnh SQL:
```sql
CREATE USER flask_user WITH PASSWORD 'password123';
CREATE DATABASE flask_project;
ALTER DATABASE flask_project OWNER TO flask_user;
GRANT ALL PRIVILEGES ON DATABASE flask_project TO flask_user;
\q
```

### Bước 4: Setup Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Bước 5: Tạo file .env

Tạo file `.env` trong thư mục `backend/`:

```env
SECRET_KEY=dev
DATABASE_URL=postgresql://flask_user:password123@localhost:5432/flask_project
GEMINI_API_KEY=your_google_ai_key_here
```

**Lấy API Key:** https://aistudio.google.com/apikey

### Bước 6: Chạy ứng dụng

```bash
cd backend
source venv/bin/activate
python3 run.py
```

**Truy cập:** http://localhost:5000

---

## 🌐 Sử dụng

1. Đăng ký tài khoản tại `/register.html`
2. Đăng nhập tại `/login.html`
3. Vào Dashboard, nhập thông tin sức khỏe
4. Nhấn "Tạo Thực Đơn" → AI tạo thực đơn tự động
5. Xem thực đơn theo từng ngày

---

## 📁 Cấu trúc dự án

```
my-project/
├── frontend/              # Giao diện người dùng
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   └── static/            # CSS, JS, Images
└── backend/               # API & Database
    ├── run.py             # Entry point
    ├── config.py          # Cấu hình
    ├── requirements.txt
    ├── .env               # Biến môi trường
    └── app/
        ├── models/        # Database models
        ├── routes/        # API endpoints
        └── services/      # AI service
```

---

## 🔍 Quản lý Database

Kết nối PostgreSQL:
```bash
PGPASSWORD=password123 psql -h localhost -U flask_user -d flask_project
```

Các lệnh hữu ích:
```sql
\dt                          -- Xem bảng
SELECT * FROM users;         -- Xem users
SELECT * FROM daily_menus;   -- Xem menus
\q                           -- Thoát
```

---

## 🛑 Dừng/Khởi động lại

**Dừng:** Nhấn `Ctrl+C` ở cả 2 terminal

**Khởi động lại:**
```bash
cd backend && source venv/bin/activate && python3 run.py 
hoặc
cd /home/lamvu/LenMenu/my-project/backend && source venv/bin/activate && python run.py 
```

---

## 👥 Tác giả

Developed by: **Lý Lâm Vũ** & **Châu Khang Duy**
