#!/usr/bin/env python3
"""
AI Content Generator for Products and Domains
Генерирует описания продуктов и доменов по пользовательскому вводу
"""

import os
import sys
import json
from anthropic import Anthropic
from typing import Dict, Any

class ContentGenerator:
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)

    def generate_product(self, user_input: str) -> Dict[str, Any]:
        """Генерирует описание продукта по пользовательскому вводу"""
        
        prompt = f"""You are a product manager for CrossFi ecosystem, creating detailed product descriptions for video advertising.

USER INPUT: "{user_input}"

Based on this input, create a comprehensive product description that follows this exact structure:

REQUIRED OUTPUT FORMAT (JSON):
{{
  "name": "Product Name",
  "category": "Product Category",
  "description": "Comprehensive description (2-3 sentences)",
  "key_features": [
    "Feature 1 - specific and actionable",
    "Feature 2 - user benefit focused", 
    "Feature 3 - technical capability",
    "Feature 4 - competitive advantage",
    "Feature 5 - ecosystem integration"
  ],
  "consumer_benefits": [
    "Benefit 1 - direct user value",
    "Benefit 2 - problem solved",
    "Benefit 3 - competitive advantage"
  ],
  "technical_specs": {{
    "spec1": "Technical detail 1",
    "spec2": "Technical detail 2", 
    "spec3": "Technical detail 3"
  }},
  "target_users": [
    "User group 1",
    "User group 2",
    "User group 3"
  ],
  "status": "Live"
}}

REQUIREMENTS:
- Make it realistic and believable for CrossFi ecosystem
- Focus on DeFi, crypto banking, or blockchain technology
- Ensure features are specific and measurable
- Benefits should solve real user problems
- Technical specs should be implementable

Create the product description now:"""

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        return self._parse_json_response(response.content[0].text)

    def generate_domain(self, user_input: str) -> Dict[str, Any]:
        """Генерирует описание домена по пользовательскому вводу"""
        
        prompt = f"""You are a creative director for CrossFi video advertising, creating domain styles for video generation.

USER INPUT: "{user_input}"

Based on this input, create a comprehensive domain description that follows this exact structure:

REQUIRED OUTPUT FORMAT (JSON):
{{
  "key": "domain_key_name",
  "title": "Domain Title",
  "concept": "Detailed concept description explaining the style, mood, and approach (3-4 sentences)",
  "locations": "Specific filming locations that fit this style (comma-separated)",
  "characters": "Character descriptions and archetypes for this domain style",
  "mood": "Emotional tone and atmosphere (comma-separated adjectives)",
  "shooting_features": "Visual style, camera work, lighting approach",
  "sample_dialogues": [
    "Example dialogue 1 in the domain style",
    "Example dialogue 2 showing character voice",
    "Example dialogue 3 with CrossFi integration"
  ],
  "length": [0.6, 0.3, 0.1],
  "rating": 8
}}

REQUIREMENTS:
- Make it unique and memorable for video content
- Ensure it fits CrossFi brand (financial technology, accessibility)
- Create specific visual and audio characteristics
- Include authentic dialogue examples
- Length array represents probability distribution for [8s, 16s, 24s] videos
- Rating should be 1-10 based on viral potential

Create the domain description now:"""

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8
        )
        
        return self._parse_json_response(response.content[0].text)

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Парсит JSON ответ от Claude с обработкой ошибок"""
        import re
        
        # Ищем JSON в ответе
        json_patterns = [
            r'```json\s*(.*?)\s*```',
            r'```\s*(.*?)\s*```',
            r'\{[\s\S]*\}'
        ]
        
        json_str = None
        for pattern in json_patterns:
            match = re.search(pattern, response, re.DOTALL)
            if match:
                json_str = match.group(1) if 'json' in pattern else match.group(0)
                break
        
        if not json_str:
            # Если JSON не найден, пробуем весь ответ
            json_str = response.strip()
        
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError as e:
            # Пробуем исправить частые ошибки JSON
            try:
                fixed_json = re.sub(r',\s*}', '}', json_str)  # Убираем trailing commas
                fixed_json = re.sub(r',\s*]', ']', fixed_json)
                result = json.loads(fixed_json)
                return result
            except:
                raise Exception(f"Не удалось распарсить JSON: {str(e)}\nОтвет: {response[:500]}...")

def main():
    """Точка входа для CLI"""
    if len(sys.argv) < 4:
        print("Usage: python content_generator.py <type> <user_input> <output_path>")
        print("Type: 'product' or 'domain'")
        sys.exit(1)
    
    content_type = sys.argv[1]  # 'product' или 'domain'
    user_input = sys.argv[2]
    output_path = sys.argv[3]
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("ANTHROPIC_API_KEY not found")
        sys.exit(1)
    
    generator = ContentGenerator(api_key)
    
    try:
        if content_type == 'product':
            result = generator.generate_product(user_input)
        elif content_type == 'domain':
            result = generator.generate_domain(user_input)
        else:
            raise ValueError("Type must be 'product' or 'domain'")
        
        # Выводим результат для Node.js API
        print("GENERATED_CONTENT:", json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "status": "failed",
            "error": str(e)
        }
        print("GENERATED_CONTENT:", json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
