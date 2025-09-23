#!/usr/bin/env python3
"""
Тест fal_client для проверки работы с VEO3
"""

import os
import fal_client
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv('../.env')

def test_fal_client():
    """Тестируем работу fal_client с простым промптом"""
    
    # Проверяем API ключ
    fal_key = os.getenv('FAL_KEY')
    if not fal_key:
        print("❌ FAL_KEY не найден в .env файле")
        return
    
    print(f"✅ FAL_KEY найден: {fal_key[:10]}...")
    
    # Устанавливаем API ключ
    os.environ['FAL_KEY'] = fal_key
    
    print("🎬 Тестируем генерацию видео через VEO3...")
    
    try:
        # Простой тестовый промпт
        test_params = {
            "prompt": "A person using a smartphone to make a payment, looking happy and satisfied. Modern cafe setting with natural lighting.",
            "aspect_ratio": "16:9",
            "duration": "8s",
            "enhance_prompt": True,
            "generate_audio": True
        }
        
        print("📝 Отправляем запрос к VEO3...")
        print(f"Промпт: {test_params['prompt']}")
        
        # Используем subscribe для ожидания результата
        result = fal_client.subscribe(
            "fal-ai/veo3",
            arguments=test_params,
            with_logs=True
        )
        
        print("✅ Результат получен!")
        print(f"Тип результата: {type(result)}")
        print(f"Содержимое: {result}")
        
        # Извлекаем URL видео
        if isinstance(result, dict) and 'video' in result:
            video_url = result['video']['url']
            print(f"🎥 URL видео: {video_url}")
        else:
            print("❌ Неожиданная структура ответа")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    test_fal_client()
