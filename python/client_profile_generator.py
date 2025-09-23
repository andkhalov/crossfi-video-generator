#!/usr/bin/env python3
"""
Client Profile Generator
Создает профили клиентов на основе описания компании
"""

import os
import sys
import json
from anthropic import Anthropic

class ClientProfileGenerator:
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)

    def generate_profile(self, user_input: str) -> dict:
        """Генерирует профиль клиента по описанию"""
        
        prompt = f"""You are a brand strategist creating comprehensive client profiles for video advertising platforms.

USER INPUT: "{user_input}"

Based on this description, create a detailed client profile that will be used to customize video generation prompts and content strategy.

REQUIRED OUTPUT FORMAT (JSON):
{{
  "companyName": "Company Name",
  "industry": "Industry sector (e.g., DeFi, FinTech, E-commerce, SaaS, Healthcare)",
  "positioning": "Brand positioning statement (1-2 sentences)",
  
  "targetAudience": [
    "Primary audience group",
    "Secondary audience group", 
    "Tertiary audience group"
  ],
  
  "brandValues": [
    "Core value 1",
    "Core value 2",
    "Core value 3",
    "Core value 4"
  ],
  
  "contentStrategy": "viral|professional|educational|technical",
  "toneOfVoice": "friendly|professional|authoritative|playful|innovative|trustworthy",
  
  "stylePreferences": {{
    "videoStyle": "amateur|semi-professional|professional",
    "cameraWork": "handheld|stabilized|cinematic",
    "lighting": "natural|enhanced|studio",
    "colorPalette": "vibrant|muted|corporate|trendy",
    "musicStyle": "upbeat|ambient|corporate|trendy"
  }},
  
  "mainProducts": [
    "Main product/service 1",
    "Main product/service 2",
    "Main product/service 3"
  ],
  
  "competitiveAdvantages": [
    "Key advantage 1",
    "Key advantage 2", 
    "Key advantage 3"
  ],
  
  "uniqueFeatures": [
    "Unique feature 1",
    "Unique feature 2",
    "Unique feature 3"
  ]
}}

REQUIREMENTS:
- Make it realistic and comprehensive
- Ensure content strategy matches the industry
- Choose appropriate tone of voice for the brand
- Style preferences should align with target audience
- All arrays should have meaningful, specific entries
- Focus on what makes this brand unique

CONTENT STRATEGY GUIDELINES:
- viral: For brands wanting authentic, shareable, meme-worthy content
- professional: For established brands needing polished, corporate content  
- educational: For brands focusing on teaching and informing audience
- technical: For B2B or complex products requiring detailed explanations

TONE OF VOICE GUIDELINES:
- friendly: Approachable, conversational, warm
- professional: Polished, reliable, expertise-focused
- authoritative: Expert, confident, industry-leading
- playful: Fun, creative, engaging, youthful
- innovative: Cutting-edge, forward-thinking, disruptive
- trustworthy: Reliable, secure, dependable, honest

Create the comprehensive client profile now:"""

        response = self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2500,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        
        return self._parse_json_response(response.content[0].text)

    def _parse_json_response(self, response: str) -> dict:
        """Парсит JSON ответ от Claude"""
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
            json_str = response.strip()
        
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError as e:
            try:
                # Исправляем частые ошибки JSON
                fixed_json = re.sub(r',\s*}', '}', json_str)
                fixed_json = re.sub(r',\s*]', ']', fixed_json)
                result = json.loads(fixed_json)
                return result
            except:
                raise Exception(f"Не удалось распарсить JSON: {str(e)}")

def main():
    """Точка входа для CLI"""
    if len(sys.argv) < 2:
        print("Usage: python client_profile_generator.py <user_input>")
        sys.exit(1)
    
    user_input = sys.argv[1]
    
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("ANTHROPIC_API_KEY not found")
        sys.exit(1)
    
    generator = ClientProfileGenerator(api_key)
    
    try:
        result = generator.generate_profile(user_input)
        print("GENERATED_PROFILE:", json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        error_result = {
            "status": "failed",
            "error": str(e)
        }
        print("GENERATED_PROFILE:", json.dumps(error_result, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
