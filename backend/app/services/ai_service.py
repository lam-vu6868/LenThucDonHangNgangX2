# backend/app/services/ai_service.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load API Key từ .env
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("❌ Lỗi: Không tìm thấy GEMINI_API_KEY trong file .env")

# Cấu hình Gemini API
genai.configure(api_key=api_key, transport='rest')

# Khởi tạo model
MODEL_NAME = 'models/gemma-3-1b-it'

def get_ai_response(prompt: str) -> str:
    """
    Gửi câu hỏi đến Gemini AI và nhận câu trả lời
    
    Args:
        prompt: Câu hỏi hoặc yêu cầu gửi tới AI
        
    Returns:
        str: Câu trả lời từ AI
    """
    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"❌ Lỗi khi gọi AI: {str(e)}"
