#!/usr/bin/env python3
"""
CrossFi Video Generation Pipeline v2
Работает с профилями клиентов и данными из базы данных
"""

import os
import sys
import json
import time
import requests
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import random
import re
from anthropic import Anthropic
import fal_client
from moviepy.editor import VideoFileClip, concatenate_videoclips
from prompt_builder import PromptBuilder

class VideoGenerationPipelineV2:
    def __init__(self, api_keys: Dict[str, str]):
        """
        Инициализация пайплайна генерации видео v2
        """
        self.anthropic_client = Anthropic(api_key=api_keys['ANTHROPIC_API_KEY'])
        
        # Настройка fal_client
        os.environ['FAL_KEY'] = api_keys['FAL_KEY']
        self.fal_client = fal_client
        
        self.resemble_key = api_keys.get('RESEMBLE_AI_KEY')
        
        # Определяем пути относительно текущего скрипта
        script_dir = Path(__file__).parent.parent
        self.raw_video_dir = script_dir / "raw_video"
        self.ready_video_dir = script_dir / "ready_video"
        self.raw_video_dir.mkdir(exist_ok=True)
        self.ready_video_dir.mkdir(exist_ok=True)

    def _call_claude(self, prompt: str, max_tokens: int = 3000) -> str:
        """Вызов Claude API с обработкой ошибок"""
        max_retries = 3
        base_delay = 2
        
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    time.sleep(delay)
                
                response = self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=max_tokens,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7
                )
                return response.content[0].text
                
            except Exception as e:
                if "529" in str(e) or "overloaded" in str(e).lower():
                    if attempt < max_retries - 1:
                        continue
                    else:
                        raise Exception(f"API overloaded after {max_retries} attempts")
                else:
                    raise Exception(f"Claude API error: {str(e)}")

    def generate_scenario(self, domain_data: Dict[str, Any], product_data: Dict[str, Any], 
                         client_profile: Dict[str, Any], user_input: str = "", language: str = "Portuguese") -> str:
        """Генерация сценария для видео с учетом профиля клиента"""
        
        # Форматируем описание домена
        domain_description = self._format_domain_description(domain_data)
        
        # Используем PromptBuilder с параметрами клиента
        prompt_builder = PromptBuilder(language)
        scenario_prompt = prompt_builder.build_scenario_prompt_with_client(
            domain_description, 
            product_data,
            client_profile,
            user_input
        )
        
        return self._call_claude(scenario_prompt, max_tokens=3000)

    def _format_domain_description(self, domain: Dict[str, Any]) -> str:
        """Форматирование описания домена"""
        description = f"""
**{domain.get('title', 'Unknown Domain')}**
**Concept:** {domain.get('concept', '')}
**Locations:** {domain.get('locations', '')}
**Characters:** {domain.get('characters', '')}
**Mood:** {domain.get('mood', '')}
**Shooting Features:** {domain.get('shooting_features', '')}
**Sample Dialogues:**
{chr(10).join(f'* "{dialogue}"' for dialogue in domain.get('sample_dialogues', []))}
        """.strip()
        return description

    def determine_timing(self, scenario: str, domain_data: Dict[str, Any], client_profile: Dict[str, Any], language: str = "Portuguese") -> tuple:
        """Определение тайминга видео с вероятностным распределением"""
        base_probs = domain_data.get('length', [0.6, 0.3, 0.1])  # [8s, 16s, 24s]

        # Анализ сложности сценария
        scenario_lower = scenario.lower()
        complexity_score = 0
        
        complexity_markers = {
            'simple': ['simple', 'single', 'quick', 'moment', 'instant'],
            'moderate': ['then', 'setup', 'transition', 'realizes', 'discovers'],
            'complex': ['journey', 'multiple', 'elaborate', 'series', 'progression']
        }
        
        for level, keywords in complexity_markers.items():
            matches = sum(1 for keyword in keywords if keyword in scenario_lower)
            if level == 'moderate':
                complexity_score += matches * 1
            elif level == 'complex':
                complexity_score += matches * 2

        # Корректировка вероятностей
        adjusted_probs = base_probs.copy()
        
        if complexity_score <= 2:
            adjustment = 0.2
            adjusted_probs[0] = min(0.9, adjusted_probs[0] + adjustment)
            adjusted_probs[1] = max(0.05, adjusted_probs[1] - adjustment/2)
            adjusted_probs[2] = max(0.05, adjusted_probs[2] - adjustment/2)
        elif complexity_score >= 6:
            adjustment = 0.2
            adjusted_probs[0] = max(0.1, adjusted_probs[0] - adjustment)
            adjusted_probs[1] = min(0.6, adjusted_probs[1] + adjustment/2)
            adjusted_probs[2] = min(0.4, adjusted_probs[2] + adjustment/2)

        # Нормализация
        total = sum(adjusted_probs)
        if total > 0:
            adjusted_probs = [p/total for p in adjusted_probs]

        # Выбор длительности
        duration_options = [8, 16, 24]
        selected_duration = random.choices(duration_options, weights=adjusted_probs, k=1)[0]

        # Используем PromptBuilder для тайминга
        prompt_builder = PromptBuilder(language)
        print(f"Создаем промпт для тайминга...")
        timing_prompt = prompt_builder.build_timing_prompt_with_client(scenario, domain_data, client_profile, selected_duration, language)
        print(f"Отправляем запрос к Claude для тайминга...")
        
        timing_response = self._call_claude(timing_prompt, max_tokens=2500)
        print(f"Получен ответ для тайминга, длина: {len(timing_response)}")
        
        timing_breakdown = self._extract_timing_breakdown(timing_response)
        framing_context = self._extract_framing_context(timing_response, client_profile)
        print(f"Тайминг обработан успешно")
        
        return selected_duration, timing_breakdown, framing_context

    def _extract_timing_breakdown(self, timing_response: str) -> str:
        """Извлечение разбивки тайминга из ответа"""
        breakdown_patterns = [
            r'\*\*DETAILED SEGMENT BREAKDOWN:\*\*(.*?)(?=\*\*TECHNICAL|$)',
            r'DETAILED SEGMENT BREAKDOWN:(.*?)(?=\*\*|$)',
            r'\*\*SEGMENT BREAKDOWN:\*\*(.*?)(?=\*\*|$)'
        ]
        
        for pattern in breakdown_patterns:
            match = re.search(pattern, timing_response, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return timing_response

    def _extract_framing_context(self, timing_response: str, client_profile: Dict[str, Any]) -> str:
        """Извлечение контекста кадрирования"""
        framing_patterns = [
            r'\*\*FRAMING NARRATIVE:\*\*(.*?)(?=\*\*|$)',
            r'FRAMING NARRATIVE:(.*?)(?=\*\*|$)'
        ]
        
        for pattern in framing_patterns:
            match = re.search(pattern, timing_response, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return f"{client_profile.get('companyName', 'Brand')} adoption story showcasing brand transformation"

    def generate_veo3_prompts(self, scenario: str, timing: int, timing_breakdown: str, 
                             framing_context: str, domain_data: Dict[str, Any], 
                             client_profile: Dict[str, Any], language: str = "Portuguese") -> List[Dict[str, Any]]:
        """Генерация промптов для VEO3 с учетом профиля клиента"""
        camera_style = self._select_camera_style(domain_data, client_profile, scenario)
        
        # Используем PromptBuilder для VEO3 с профилем клиента
        prompt_builder = PromptBuilder(language)
        veo3_prompt = prompt_builder.build_veo3_prompt_with_client(
            scenario, 
            timing_breakdown, 
            camera_style,
            client_profile,
            language
        )
        
        veo3_response = self._call_claude(veo3_prompt, max_tokens=4000)
        prompts_list = self._parse_json_response(veo3_response)
        
        return self._validate_prompts(prompts_list)

    def _select_camera_style(self, domain_data: Dict[str, Any], client_profile: Dict[str, Any], scenario: str) -> str:
        """Выбор стиля камеры на основе профиля клиента и домена"""
        style_preferences = client_profile.get('stylePreferences', {})
        content_strategy = client_profile.get('contentStrategy', 'viral')
        
        # Базовый стиль из профиля клиента
        if content_strategy == 'professional':
            return 'professional'
        elif content_strategy == 'educational':
            return 'stabilized'
        elif content_strategy == 'technical':
            return 'professional'
        else:  # viral
            return style_preferences.get('cameraWork', 'handheld')

    def _parse_json_response(self, response: str) -> List[Dict[str, Any]]:
        """Парсинг JSON ответа от Claude"""
        json_patterns = [
            r'```json\s*(.*?)\s*```',
            r'```\s*(.*?)\s*```',
            r'\[[\s\S]*?\]',
            r'\{[\s\S]*?\}'
        ]
        
        json_str = None
        for pattern in json_patterns:
            match = re.search(pattern, response, re.DOTALL)
            if match:
                json_str = match.group(1) if 'json' in pattern else match.group(0)
                break
        
        if not json_str:
            json_str = response.strip()
            start_bracket = json_str.find('[')
            end_bracket = json_str.rfind(']')
            if start_bracket != -1 and end_bracket != -1:
                json_str = json_str[start_bracket:end_bracket+1]
        
        try:
            result = json.loads(json_str)
            if not isinstance(result, list):
                result = [result]
            return result
        except json.JSONDecodeError as e:
            raise Exception(f"JSON parsing failed: {str(e)}")

    def _validate_prompts(self, prompts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Валидация промптов"""
        validated_prompts = []
        
        for i, prompt_dict in enumerate(prompts):
            if "prompt" not in prompt_dict:
                continue
                
            enhanced_prompt = {
                "prompt": prompt_dict["prompt"],
                "aspect_ratio": prompt_dict.get("aspect_ratio", "9:16"),
                "duration": prompt_dict.get("duration", "8s"),
                "enhance_prompt": prompt_dict.get("enhance_prompt", True),
                "generate_audio": prompt_dict.get("generate_audio", True)
            }
            
            validated_prompts.append(enhanced_prompt)
            
        return validated_prompts

    def generate_video_segments(self, prompts: List[Dict[str, Any]], generation_id: str) -> List[str]:
        """Генерация видео сегментов через VEO3"""
        video_urls = []
        video_paths = []
        
        # Создаем директории
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        batch_dir = f"generation_{generation_id}_{timestamp}"
        raw_dir = self.raw_video_dir / batch_dir
        raw_dir.mkdir(parents=True, exist_ok=True)
        
        for i, segment in enumerate(prompts, start=1):
            print(f"Генерация сегмента {i}/{len(prompts)}...")
            
            fal_params = {
                "prompt": segment["prompt"],
                "aspect_ratio": segment.get("aspect_ratio", "16:9"),
                "duration": segment.get("duration", "8s"),
                "enhance_prompt": segment.get("enhance_prompt", True),
                "generate_audio": segment.get("generate_audio", True)
            }

            result = fal_client.subscribe(
                "fal-ai/veo3",
                arguments=fal_params,
                with_logs=True
            )
            url = self._extract_video_url(result)
            video_urls.append(url)

            if i < len(prompts):
                time.sleep(3)

        # Скачиваем видео
        for i, url in enumerate(video_urls, start=1):
            fname = f"segment_{i}.mp4"
            fpath = raw_dir / fname
            
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            with open(fpath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            video_paths.append(str(fpath))
            print(f"Сегмент {i} скачан: {fpath}")

        return video_paths

    def _extract_video_url(self, fal_result: Any) -> str:
        """Извлечение URL видео из результата fal.ai"""
        print(f"Fal result structure: {type(fal_result)}")
        print(f"Fal result content: {fal_result}")
        
        # Согласно документации, результат должен содержать video.url
        if isinstance(fal_result, dict):
            if 'video' in fal_result and isinstance(fal_result['video'], dict):
                if 'url' in fal_result['video']:
                    return fal_result['video']['url']
        
        # Fallback: рекурсивный поиск URL
        def search_url(obj):
            if isinstance(obj, str):
                if obj.startswith("http") and (".mp4" in obj or "fal.media" in obj):
                    return obj
            elif isinstance(obj, dict):
                for value in obj.values():
                    result = search_url(value)
                    if result:
                        return result
            elif isinstance(obj, list):
                for item in obj:
                    result = search_url(item)
                    if result:
                        return result
            return None
        
        url = search_url(fal_result)
        if not url:
            raise Exception(f"Video URL not found in fal.ai response: {fal_result}")
        return url

    def concatenate_videos(self, video_paths: List[str], generation_id: str) -> str:
        """Склейка видео сегментов"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        batch_dir = f"generation_{generation_id}_{timestamp}"
        ready_dir = self.ready_video_dir / batch_dir
        ready_dir.mkdir(parents=True, exist_ok=True)
        
        clips = [VideoFileClip(path) for path in video_paths]
        final_video = concatenate_videoclips(clips, method="compose")
        
        final_path = ready_dir / f"final_video_{timestamp}.mp4"
        final_video.write_videofile(
            str(final_path),
            codec="libx264",
            audio_codec="aac",
            temp_audiofile="temp-audio.m4a",
            remove_temp=True
        )
        
        # Освобождаем ресурсы
        for clip in clips:
            clip.close()
        final_video.close()
        
        return str(final_path)

def main():
    """Точка входа для CLI использования"""
    if len(sys.argv) < 2:
        print("Usage: python video_generator_v2.py <generation_data_json>")
        sys.exit(1)
    
    generation_data = json.loads(sys.argv[1])
    
    # Получаем API ключи из переменных окружения
    api_keys = {
        'ANTHROPIC_API_KEY': os.getenv('ANTHROPIC_API_KEY'),
        'FAL_KEY': os.getenv('FAL_KEY'),
        'RESEMBLE_AI_KEY': os.getenv('RESEMBLE_AI_KEY')
    }
    
    # Создаем пайплайн
    pipeline = VideoGenerationPipelineV2(api_keys)
    
    try:
        # Извлекаем данные
        domain_data = generation_data['domainData']
        product_data = generation_data['productData']
        client_profile = generation_data['clientProfile']
        generation_id = generation_data['generationId']
        user_input = generation_data['userInput']
        language = generation_data['language']
        
        print(f"Генерация для клиента: {client_profile['companyName']}")
        print(f"Домен: {domain_data.get('title', 'Unknown')}")
        print(f"Продукт: {product_data.get('name', 'Unknown')}")
        
        # Генерация сценария
        print("Генерация сценария...")
        scenario = pipeline.generate_scenario(domain_data, product_data, client_profile, user_input, language)
        print(f"Сценарий создан: {len(scenario)} символов")
        
        # Выводим промежуточный результат для интерфейса
        print("INTERMEDIATE_RESULT:", json.dumps({
            "step": "scenario",
            "scenario": scenario
        }, ensure_ascii=False))
        
        # Определение тайминга
        print("Определение тайминга...")
        try:
            duration, timing_breakdown, framing_context = pipeline.determine_timing(scenario, domain_data, client_profile, language)
            print(f"Выбрана длительность: {duration}s")
        except Exception as e:
            print(f"Ошибка на этапе определения тайминга: {e}")
            raise
        
        # Выводим промежуточный результат
        print("INTERMEDIATE_RESULT:", json.dumps({
            "step": "timing",
            "scenario": scenario,
            "timing": duration,
            "timing_breakdown": timing_breakdown
        }, ensure_ascii=False))
        
        # Генерация промптов
        print("Генерация промптов для VEO3...")
        prompts = pipeline.generate_veo3_prompts(scenario, duration, timing_breakdown, framing_context, domain_data, client_profile, language)
        print(f"Создано {len(prompts)} промптов")
        
        # Выводим промежуточный результат
        print("INTERMEDIATE_RESULT:", json.dumps({
            "step": "prompts",
            "scenario": scenario,
            "timing": duration,
            "timing_breakdown": timing_breakdown,
            "prompts": prompts
        }, ensure_ascii=False))
        
        # Генерация видео
        print("Генерация видео сегментов...")
        video_paths = pipeline.generate_video_segments(prompts, generation_id)
        
        # Выводим промежуточный результат после генерации видео
        print("INTERMEDIATE_RESULT:", json.dumps({
            "step": "videos",
            "scenario": scenario,
            "timing": duration,
            "timing_breakdown": timing_breakdown,
            "prompts": prompts,
            "video_segments": video_paths
        }, ensure_ascii=False))
        
        # Склейка видео
        print("Склейка финального видео...")
        final_video = pipeline.concatenate_videos(video_paths, generation_id)
        
        # Результат
        result = {
            "status": "completed",
            "scenario": scenario,
            "timing": duration,
            "timing_breakdown": timing_breakdown,
            "prompts": prompts,
            "video_segments": video_paths,
            "final_video": final_video
        }
        
        # Выводим результат для Node.js API
        print("GENERATION_RESULT:", json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "status": "failed",
            "error": str(e)
        }
        print("GENERATION_RESULT:", json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
