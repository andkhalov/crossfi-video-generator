#!/usr/bin/env python3
"""
CrossFi Video Generation Pipeline
Переписанная версия из video_gen_v4.ipynb для веб-приложения
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

class VideoGenerationPipeline:
    def __init__(self, api_keys: Dict[str, str], schema_dir: str = "../schema", domains_file: str = "../domains_v6.json"):
        """
        Инициализация пайплайна генерации видео
        
        Args:
            api_keys: Словарь с API ключами (ANTHROPIC_API_KEY, FAL_KEY, RESEMBLE_AI_KEY)
            schema_dir: Директория с XML схемами промптов
            domains_file: Файл с доменами
        """
        self.anthropic_client = Anthropic(api_key=api_keys['ANTHROPIC_API_KEY'])
        
        # Настройка fal_client
        os.environ['FAL_KEY'] = api_keys['FAL_KEY']
        self.fal_client = fal_client
        
        self.resemble_key = api_keys.get('RESEMBLE_AI_KEY')
        
        # Определяем пути относительно текущего скрипта
        script_dir = Path(__file__).parent.parent  # Поднимаемся на уровень выше из python/
        self.schema_dir = script_dir / "schema"
        self.domains_file = script_dir / "domains_v6.json"
        
        print(f"Schema dir: {self.schema_dir}")
        print(f"Domains file: {self.domains_file}")
        
        # Настройки директорий
        self.raw_video_dir = script_dir / "raw_video"
        self.ready_video_dir = script_dir / "ready_video"
        self.raw_video_dir.mkdir(exist_ok=True)
        self.ready_video_dir.mkdir(exist_ok=True)
        
        # Загружаем промпты и домены
        self.prompts = self._load_prompts()
        self.domains = self._load_domains()

    def _load_prompts(self) -> Dict[str, str]:
        """Загрузка промптов из XML файлов"""
        prompt_files = {
            "scenario_creation": "scenario_creation_v4.xml",
            "timing_decision": "timing_decision_v4.xml", 
            "veo3_generation": "veo3_generation_v4.xml"
        }

        prompts = {}
        for prompt_id, filename in prompt_files.items():
            filepath = self.schema_dir / filename
            if filepath.exists():
                with open(filepath, "r", encoding="utf-8") as f:
                    prompts[prompt_id] = f.read().strip()
            else:
                print(f"Warning: Prompt file not found: {filepath}")
                
        return prompts

    def _load_domains(self) -> Dict[str, Dict[str, Any]]:
        """Загрузка доменов из JSON файла"""
        if self.domains_file.exists():
            with open(self.domains_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('domains', {})
        return {}

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

    def generate_scenario(self, domain_key: str, product_data: Dict[str, Any], user_input: str = "", language: str = "Portuguese") -> str:
        """Генерация сценария для видео"""
        if domain_key not in self.domains:
            raise ValueError(f"Domain '{domain_key}' not found")
        
        domain = self.domains[domain_key]
        domain_description = self._format_domain_description(domain)
        
        # Используем новый PromptBuilder вместо XML
        prompt_builder = PromptBuilder(language)
        scenario_prompt = prompt_builder.build_scenario_prompt(
            domain_description, 
            product_data, 
            user_input
        )
        
        return self._call_claude(scenario_prompt, max_tokens=3000)

    def _format_domain_description(self, domain: Dict[str, Any]) -> str:
        """Форматирование описания домена"""
        description = f"""
**{domain['title']}**
**Concept:** {domain['concept']}
**Locations:** {domain['locations']}
**Characters:** {domain['characters']}
**Mood:** {domain['mood']}
**Shooting Features:** {domain['shooting_features']}
**Sample Dialogues:**
{chr(10).join(f'* "{dialogue}"' for dialogue in domain['sample_dialogues'])}
        """.strip()
        return description

    def determine_timing(self, scenario: str, domain_key: str, language: str = "Portuguese") -> tuple:
        """Определение тайминга видео с вероятностным распределением"""
        domain = self.domains.get(domain_key, {})
        base_probs = domain.get('length', [0.6, 0.3, 0.1])  # [8s, 16s, 24s]

        # Специальные правила для доменов
        if domain_key == 'news_reports':
            base_probs = [0.0, 0.8, 0.2]  # Новости всегда мульти-сегмент
        elif domain_key == 'metamask_fox':
            base_probs = [0.7, 0.2, 0.1]  # Фокс предпочитает один сегмент

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
        
        if complexity_score <= 2:  # Простой сценарий
            adjustment = 0.2
            adjusted_probs[0] = min(0.9, adjusted_probs[0] + adjustment)
            adjusted_probs[1] = max(0.05, adjusted_probs[1] - adjustment/2)
            adjusted_probs[2] = max(0.05, adjusted_probs[2] - adjustment/2)
        elif complexity_score >= 6:  # Сложный сценарий
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

        # Используем новый PromptBuilder для тайминга
        prompt_builder = PromptBuilder(language)
        timing_prompt = prompt_builder.build_timing_prompt(scenario, domain_key, selected_duration)
        
        timing_response = self._call_claude(timing_prompt, max_tokens=2500)
        timing_breakdown = self._extract_timing_breakdown(timing_response)
        framing_context = self._extract_framing_context(timing_response)
        
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

    def _extract_framing_context(self, timing_response: str) -> str:
        """Извлечение контекста кадрирования"""
        framing_patterns = [
            r'\*\*FRAMING NARRATIVE:\*\*(.*?)(?=\*\*|$)',
            r'FRAMING NARRATIVE:(.*?)(?=\*\*|$)'
        ]
        
        for pattern in framing_patterns:
            match = re.search(pattern, timing_response, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return "CrossFi adoption story showcasing financial transformation"

    def generate_veo3_prompts(self, scenario: str, timing: int, timing_breakdown: str, 
                             framing_context: str, domain_key: str, language: str = "Portuguese") -> List[Dict[str, Any]]:
        """Генерация промптов для VEO3"""
        camera_style = self._select_camera_style(domain_key, scenario)
        
        # Используем новый PromptBuilder для VEO3
        prompt_builder = PromptBuilder(language)
        veo3_prompt = prompt_builder.build_veo3_prompt(
            scenario, 
            timing_breakdown, 
            camera_style, 
            language
        )
        
        veo3_response = self._call_claude(veo3_prompt, max_tokens=4000)
        prompts_list = self._parse_json_response(veo3_response)
        enhanced_prompts = self._enhance_prompts_with_framing(
            prompts_list, framing_context, timing, domain_key
        )
        
        return self._validate_prompts(enhanced_prompts)

    def _select_camera_style(self, domain_key: str, scenario: str) -> str:
        """Выбор стиля камеры на основе домена и сценария"""
        camera_mappings = {
            'easy_to_use': {'default': 'selfie'},
            'metamask_fox': {'default': 'selfie'},
            'elite_tears': {'default': 'security'},
            'news_reports': {'default': 'professional'},
            'money_proverbs': {'default': 'livestream'}
        }
        
        domain_cameras = camera_mappings.get(domain_key, {'default': 'selfie'})
        return domain_cameras['default']

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

    def _enhance_prompts_with_framing(self, prompts: List[Dict[str, Any]], 
                                    framing_context: str, duration: int, domain_key: str) -> List[Dict[str, Any]]:
        """Улучшение промптов с контекстом кадрирования"""
        if domain_key == 'news_reports' and len(prompts) > 1:
            news_segments = [
                {"location": "Professional news studio", "character": "news anchor"},
                {"location": "Field reporting location", "character": "field reporter"},  
                {"location": "Expert interview setup", "character": "expert analyst"}
            ]

            enhanced_prompts = []
            for i, prompt_dict in enumerate(prompts):
                if i < len(news_segments):
                    segment_info = news_segments[i]
                    enhanced_prompt = prompt_dict.copy()
                    enhanced_prompt["prompt"] = self._inject_news_location(
                        prompt_dict["prompt"], segment_info, i+1, len(prompts)
                    )
                    enhanced_prompts.append(enhanced_prompt)
            return enhanced_prompts
        
        if duration <= 8 or len(prompts) <= 1:
            return prompts
        
        enhanced_prompts = []
        for i, prompt_dict in enumerate(prompts):
            prompt_text = prompt_dict["prompt"]
            
            if not prompt_text.startswith("Frame:"):
                segment_context = f"Segment {i+1} of {len(prompts)}: {framing_context}"
                enhanced_prompt = f"Frame: {segment_context}\n{prompt_text}"
                prompt_dict["prompt"] = enhanced_prompt
            
            enhanced_prompts.append(prompt_dict)
        
        return enhanced_prompts

    def _inject_news_location(self, original_prompt: str, segment_info: Dict[str, str], 
                            segment_num: int, total_segments: int) -> str:
        """Инжекция локации для новостного сегмента"""
        lines = original_prompt.split('\n')
        new_lines = []

        for line in lines:
            if line.startswith("Frame:"):
                new_lines.append(f"Frame: News segment {segment_num}/{total_segments} - {segment_info['location']}")
            elif line.startswith("Character:"):
                if segment_num == 1:
                    new_lines.append("Character: Professional news anchor in navy suit behind studio desk")
                elif segment_num == 2:
                    new_lines.append("Character: Field reporter with microphone in business casual attire")
                else:
                    new_lines.append("Character: Expert analyst or citizen being interviewed")
            elif line.startswith("Location:"):
                new_lines.append(f"Location: {segment_info['location']}")
            else:
                new_lines.append(line)

        return '\n'.join(new_lines)

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

    def generate_video_segments(self, prompts: List[Dict[str, Any]], 
                              generation_id: str) -> List[str]:
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
                time.sleep(3)  # Задержка между запросами

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

    def enhance_audio(self, video_path: str) -> str:
        """Улучшение качества звука через Resemble.ai"""
        if not self.resemble_key:
            print("Resemble.ai key not provided, skipping audio enhancement")
            return video_path
        
        # TODO: Реализовать интеграцию с Resemble.ai
        print("Audio enhancement not implemented yet")
        return video_path

def main():
    """Точка входа для CLI использования"""
    if len(sys.argv) < 4:
        print("Usage: python video_generator.py <domain_key> <product_data_json> <generation_id> [user_input] [language]")
        sys.exit(1)
    
    domain_key = sys.argv[1]
    product_data = json.loads(sys.argv[2])
    generation_id = sys.argv[3]
    user_input = sys.argv[4] if len(sys.argv) > 4 else ""
    language = sys.argv[5] if len(sys.argv) > 5 else "Portuguese"
    
    # Получаем API ключи из переменных окружения
    api_keys = {
        'ANTHROPIC_API_KEY': os.getenv('ANTHROPIC_API_KEY'),
        'FAL_KEY': os.getenv('FAL_KEY'),
        'RESEMBLE_AI_KEY': os.getenv('RESEMBLE_AI_KEY')
    }
    
    # Создаем пайплайн
    pipeline = VideoGenerationPipeline(api_keys)
    
    try:
        # Генерация сценария
        print("Генерация сценария...")
        scenario = pipeline.generate_scenario(domain_key, product_data, user_input, language)
        print(f"Сценарий создан: {len(scenario)} символов")
        
        # Выводим промежуточный результат для интерфейса
        print("INTERMEDIATE_RESULT:", json.dumps({
            "step": "scenario",
            "scenario": scenario
        }, ensure_ascii=False))
        
        # Определение тайминга
        print("Определение тайминга...")
        duration, timing_breakdown, framing_context = pipeline.determine_timing(scenario, domain_key, language)
        print(f"Выбрана длительность: {duration}s")
        
        # Выводим промежуточный результат
        print("INTERMEDIATE_RESULT:", json.dumps({
            "step": "timing",
            "scenario": scenario,
            "timing": duration,
            "timing_breakdown": timing_breakdown
        }, ensure_ascii=False))
        
        # Генерация промптов
        print("Генерация промптов для VEO3...")
        prompts = pipeline.generate_veo3_prompts(scenario, duration, timing_breakdown, framing_context, domain_key, language)
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
        print(json.dumps(error_result, ensure_ascii=False, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
