#!/usr/bin/env python3
"""
Audio Enhancement using Resemble.ai
Основано на коде из sound_cleaner.ipynb
"""

import os
import sys
import json
import time
import requests
import tempfile
from pathlib import Path
from moviepy.editor import VideoFileClip, AudioFileClip

def enhance_audio(video_path: str, generation_id: str):
    """
    Улучшение звука видео через Resemble.ai
    """
    print(f"Начинаем улучшение звука для: {video_path}")
    
    # Проверяем наличие API ключа
    resemble_key = os.getenv('RESEMBLE_AI_KEY')
    if not resemble_key:
        print("Resemble.ai ключ не найден, пропускаем улучшение звука")
        return video_path
    
    try:
        # Создаем временную директорию
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            audio_path = temp_path / "original.wav"
            enhanced_path = temp_path / "enhanced.wav"
            
            print("Извлекаем аудио из видео...")
            
            # Извлекаем аудио
            with VideoFileClip(video_path) as video_clip:
                if video_clip.audio is None:
                    print("Видео не содержит аудио дорожки")
                    return video_path
                    
                video_clip.audio.write_audiofile(
                    str(audio_path), 
                    logger=None,
                    verbose=False
                )
            
            print("Отправляем аудио в Resemble.ai...")
            
            # Отправляем в Resemble.ai
            headers = {"Authorization": f"Bearer {resemble_key}"}
            
            with open(audio_path, 'rb') as audio_file:
                files = {
                    "audio_file": ("audio.wav", audio_file, "audio/wav"),
                }
                
                response = requests.post(
                    "https://app.resemble.ai/api/v2/audio_enhancements",
                    headers=headers,
                    files=files,
                    timeout=120
                )
                response.raise_for_status()
                
                job_id = response.json()["uuid"]
                print(f"Задача создана: {job_id}")
            
            # Ожидаем завершения
            print("Ожидаем завершения обработки...")
            
            while True:
                status_response = requests.get(
                    f"https://app.resemble.ai/api/v2/audio_enhancements/{job_id}",
                    headers=headers,
                    timeout=60
                )
                status_response.raise_for_status()
                
                status_data = status_response.json()
                status = status_data.get("status")
                
                if status == "completed":
                    enhanced_url = status_data["enhanced_audio_url"]
                    print(f"Обработка завершена: {enhanced_url}")
                    break
                elif status == "failed":
                    raise Exception(f"Resemble.ai обработка провалилась: {status_data.get('error_message')}")
                
                time.sleep(5)
            
            # Скачиваем улучшенное аудио
            print("Скачиваем улучшенное аудио...")
            
            enhanced_response = requests.get(enhanced_url, stream=True, timeout=120)
            enhanced_response.raise_for_status()
            
            with open(enhanced_path, 'wb') as f:
                for chunk in enhanced_response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            print("Создаем видео с улучшенным звуком...")
            
            # Создаем новое видео с улучшенным звуком
            video_file = Path(video_path)
            enhanced_video_path = video_file.parent / f"{video_file.stem}_enhanced{video_file.suffix}"
            
            with VideoFileClip(video_path) as video:
                enhanced_audio = AudioFileClip(str(enhanced_path))
                final_video = video.set_audio(enhanced_audio)
                
                final_video.write_videofile(
                    str(enhanced_video_path),
                    codec="libx264",
                    audio_codec="aac",
                    temp_audiofile=str(temp_path / "temp-audio.m4a"),
                    remove_temp=True,
                    logger=None,
                    verbose=False
                )
                
                enhanced_audio.close()
                final_video.close()
            
            print(f"Улучшенное видео сохранено: {enhanced_video_path}")
            
            return str(enhanced_video_path)
            
    except Exception as e:
        print(f"Ошибка улучшения звука: {e}")
        return video_path

def main():
    """Точка входа для CLI"""
    if len(sys.argv) < 3:
        print("Usage: python audio_enhancer.py <video_path> <generation_id>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    generation_id = sys.argv[2]
    
    try:
        enhanced_video = enhance_audio(video_path, generation_id)
        
        result = {
            "status": "completed",
            "original_video": video_path,
            "enhanced_video": enhanced_video
        }
        
        print("ENHANCED_RESULT:", json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "status": "failed",
            "error": str(e)
        }
        print("ENHANCED_RESULT:", json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()


