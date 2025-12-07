import os
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Load Key
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Lỗi: Không tìm thấy API Key trong file .env")
    exit()

# 2. Cấu hình REST (Bắt buộc cho máy ảo của bạn)
genai.configure(api_key=api_key, transport='rest')

# 3. Model đã chốt (Gemma 3)
model_name = 'models/gemma-3-1b-it'

print(f"🚀 Đang kiểm tra kết nối tới model: {model_name}...")
print("-" * 50)

try:
    # Khởi tạo model
    model = genai.GenerativeModel(model_name)
    
    # Gửi tin nhắn test
    response = model.generate_content("Xin chào, hãy xác nhận bạn đang hoạt động tốt bằng 1 câu ngắn gọn.")
    
    # In kết quả
    print("✅ KẾT QUẢ TRẢ VỀ:")
    print(response.text)
    print("-" * 50)
    print("🎉 Test thành công! Model hoạt động ổn định.")

except Exception as e:
    print(f"❌ Lỗi rồi: {e}")