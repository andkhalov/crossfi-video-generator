#!/usr/bin/env python3
"""
Structured Prompt Builder for CrossFi Video Generation
Заменяет XML промпты на структурированные промпты с параметрами
"""

from typing import Dict, Any

class PromptBuilder:
    def __init__(self, language: str = "Portuguese"):
        self.language = language
        self.language_configs = {
            "English": {
                "voice_instruction": "all dialogs, speech, any pronounced words MUST be in English",
                "song_instruction": "all songs, lyrics, poetry any art verbal content MUST be in English",
                "sample_phrases": ["It worked!", "CrossFi is amazing!", "So easy to use!"]
            },
            "Portuguese": {
                "voice_instruction": "all dialogs, speech, any pronounced words MUST be in Brazilian Portuguese language",
                "song_instruction": "all songs, lirycs, poetry any art verbal content MUST be in Brazilian Portuguese language",
                "sample_phrases": ["Funcionou!", "CrossFi é incrível!", "Muito fácil de usar!"]
            },
            "Vietnamese": {
                "voice_instruction": "all dialogs, speech, any pronounced words MUST be in Vietnamese",
                "song_instruction": "all songs, lyrics, poetry any art verbal content MUST be in Vietnamese",
                "sample_phrases": ["Nó hoạt động!", "CrossFi thật tuyệt vời!", "Rất dễ sử dụng!"]
            },
            "Spanish": {
                "voice_instruction": "all dialogs, speech, any pronounced words MUST be in Spanish",
                "song_instruction": "all songs, lyrics, poetry any art verbal content MUST be in Spanish",
                "sample_phrases": ["¡Funcionó!", "¡CrossFi es increíble!", "¡Muy fácil de usar!"]
            },
            "Russian": {
                "voice_instruction": "all dialogs, speech, any pronounced words MUST be in Russian",
                "song_instruction": "all songs, lyrics, poetry any art verbal content MUST be in Russian",
                "sample_phrases": ["Работает!", "CrossFi потрясающий!", "Очень просто использовать!"]
            },
            "Klingon": {
                "voice_instruction": "all dialogs, speech, any pronounced words MUST be in Klingon",
                "song_instruction": "all songs, lyrics, poetry any art verbal content MUST be in Klingon",
                "sample_phrases": ["vagh!", "CrossFi nugh!", "naDev law'!"]
            },
            "Sanskrit": {
                "voice_instruction": "all dialogs, speech, any pronounced words MUST be in Sanskrit",
                "song_instruction": "all songs, lyrics, poetry any art verbal content MUST be in Sanskrit",
                "sample_phrases": ["कार्यं सिद्धम्!", "CrossFi अद्भुतम्!", "अतीव सुलभम्!"]
            }
        }

    def build_scenario_prompt(self, domain_description: str, product_data: Dict[str, Any], user_input: str = "") -> str:
        """Создает структурированный промпт для генерации сценария"""
        
        lang_config = self.language_configs.get(self.language, self.language_configs["Portuguese"])
        
        # Форматируем описание продукта
        product_description = self._format_product_description(product_data)
        
        prompt = f"""You are an expert content strategist for CrossFi App, creating compelling video scenarios where CrossFi naturally solves real-world payment problems.

LANGUAGE REQUIREMENTS:
- {lang_config['voice_instruction']}
- {lang_config['song_instruction']}
- Use authentic, natural speech patterns for {self.language}

CROSSFI PRODUCT CONTEXT:
{product_description}

DOMAIN STYLE AND CONTEXT:
{domain_description}

USER REQUIREMENTS:
{user_input if user_input else "No specific requirements provided"}

CONTENT PHILOSOPHY:
Create stories where CrossFi happens to be the solution, not an advertisement. The production style must match narrative context - from amateur phone videos to professional broadcasts.

YOUR TASK:
Create a detailed video scenario that:

1. ANALYZES the domain style and determines production context (Amateur/Semi-Pro/Professional)
2. CREATES a specific character with clear motivation (not generic user)
3. IDENTIFIES a natural moment where CrossFi solves a real problem
4. DEVELOPS authentic dialogue in {self.language} that feels natural
5. ENSURES the story is shareable and viral-worthy

REQUIREMENTS:
- Focus on human reactions, not app interface
- Use natural {self.language} speech patterns
- Create curiosity through story, not explanation
- Make it feel accidentally viral, not scripted
- Include specific visual and audio details

OUTPUT FORMAT:
Provide a detailed scenario including:
- Production context and camera style
- Character description and motivation
- Setting and environment
- Story progression with natural CrossFi integration
- Authentic dialogue in {self.language}
- Visual and audio specifications

Create the scenario now:"""

        return prompt

    def build_timing_prompt(self, scenario: str, domain_key: str, selected_duration: int) -> str:
        """Создает промпт для определения тайминга"""
        
        lang_config = self.language_configs.get(self.language, self.language_configs["Portuguese"])
        
        prompt = f"""You are a video timing specialist optimizing scenarios for viral short-form content.

LANGUAGE: {self.language}
- {lang_config['voice_instruction']}

SCENARIO TO ANALYZE:
{scenario}

DOMAIN CONTEXT: {domain_key}
PRE-SELECTED DURATION: {selected_duration} seconds

YOUR TASK:
Create a detailed timing breakdown for the {selected_duration}-second video that maintains authenticity while ensuring character consistency.

DURATION OPTIONS:
- 8 seconds (1 segment): Single authentic moment, best for character consistency
- 16 seconds (2 segments): Setup + payoff, moderate risk of character drift  
- 24 seconds (3 segments): Full story arc, highest risk but maximum impact

REQUIREMENTS:
1. Break down the scenario into {selected_duration // 8} segments of 8 seconds each
2. Ensure each segment advances the story (no repetition)
3. Plan natural cut points and camera angles
4. Maintain character consistency across segments
5. Keep dialogue authentic in {self.language}

OUTPUT FORMAT:
Provide detailed segment breakdown:

SEGMENT 1 (0-8s):
- Scene description and camera angle
- Character action and motivation
- Dialogue in {self.language} (max 15 words)
- Visual and audio details

[Continue for each 8-second segment...]

CONSISTENCY REQUIREMENTS:
- Identical character description across all segments
- Environmental anchors for visual continuity
- Natural story progression without repetition

Create the timing breakdown now:"""

        return prompt

    def build_scenario_prompt_with_client(self, domain_description: str, product_data: Dict[str, Any], 
                                         client_profile: Dict[str, Any], user_input: str = "") -> str:
        """Создает промпт для генерации сценария с учетом профиля клиента"""
        
        lang_config = self.language_configs.get(self.language, self.language_configs["Portuguese"])
        
        # Форматируем описание продукта
        product_description = self._format_product_description(product_data)
        
        # Форматируем профиль клиента
        client_description = self._format_client_profile(client_profile)
        
        prompt = f"""You are an expert content strategist creating compelling video scenarios for {client_profile['companyName']}.

VIDEO LANGUAGE REQUIREMENTS:
- All dialogue, speech, and spoken content in the video MUST be in {self.language}
- {lang_config['voice_instruction']}
- {lang_config['song_instruction']}
- Use authentic, natural speech patterns for {self.language}
- Cultural context should be appropriate for {self.language} speakers

IMPORTANT: Write the scenario description in English, but all dialogue examples and spoken content should be written directly in {self.language} with natural expressions.

CLIENT PROFILE:
{client_description}

PRODUCT CONTEXT:
{product_description}

DOMAIN STYLE AND CONTEXT:
{domain_description}

USER REQUIREMENTS:
{user_input if user_input else "No specific requirements provided"}

CONTENT STRATEGY: {client_profile['contentStrategy']}
TONE OF VOICE: {client_profile['toneOfVoice']}

YOUR TASK:
Create a detailed video scenario that aligns with {client_profile['companyName']}'s brand values and content strategy.

The scenario should:
1. Reflect the {client_profile['contentStrategy']} content strategy
2. Use {client_profile['toneOfVoice']} tone of voice
3. Appeal to the target audience: {', '.join(client_profile['targetAudience'])}
4. Showcase the brand values: {', '.join(client_profile['brandValues'])}
5. Integrate the product naturally in the context
6. Match the domain style and mood

Create the scenario now:"""

        return prompt

    def build_timing_prompt_with_client(self, scenario: str, domain_data: Dict[str, Any], 
                                       client_profile: Dict[str, Any], selected_duration: int, language: str) -> str:
        """Создает промпт для определения тайминга с учетом профиля клиента"""
        
        lang_config = self.language_configs.get(self.language, self.language_configs["Portuguese"])
        
        prompt = f"""You are a video timing specialist optimizing scenarios for {client_profile['companyName']}'s content strategy.

VIDEO LANGUAGE: {self.language}
- All spoken content in the video will be in {self.language}
- {lang_config['voice_instruction']}

IMPORTANT: Write this timing analysis in English, but include actual dialogue examples in {self.language} with authentic expressions.

CLIENT CONTEXT:
- Company: {client_profile['companyName']} ({client_profile['industry']})
- Content Strategy: {client_profile['contentStrategy']}
- Tone: {client_profile['toneOfVoice']}
- Target Audience: {', '.join(client_profile['targetAudience'])}

SCENARIO TO ANALYZE:
{scenario}

DOMAIN CONTEXT: {domain_data.get('key', 'unknown')}
PRE-SELECTED DURATION: {selected_duration} seconds

YOUR TASK:
Create a detailed timing breakdown for the {selected_duration}-second video that aligns with {client_profile['companyName']}'s brand strategy.

CONTENT STRATEGY ALIGNMENT:
- {client_profile['contentStrategy']}: Adapt timing to match this strategy
- {client_profile['toneOfVoice']}: Ensure pacing matches this tone
- Visual style should reflect {client_profile.get('stylePreferences', {}).get('videoStyle', 'amateur')} approach

REQUIREMENTS:
1. Break down the scenario into {selected_duration // 8} segments of 8 seconds each
2. Ensure each segment advances the story for {client_profile['companyName']}
3. Plan natural cut points and camera angles
4. Keep dialogue authentic in {self.language}
5. Align with {client_profile['contentStrategy']} content strategy

OUTPUT FORMAT:
Provide detailed segment breakdown:

SEGMENT 1 (0-8s):
- Scene description and camera angle
- Character action and motivation  
- Dialogue in {self.language} (max 15 words)
- Brand alignment with {client_profile['companyName']}

[Continue for each 8-second segment...]

Create the timing breakdown now:"""

        return prompt

    def build_veo3_prompt_with_client(self, scenario: str, timing_breakdown: str, camera_style: str, 
                                    client_profile: Dict[str, Any], language: str) -> str:
        """Создает промпт для VEO3 с учетом профиля клиента"""
        
        lang_config = self.language_configs.get(self.language, self.language_configs["Portuguese"])
        style_prefs = client_profile.get('stylePreferences', {})
        
        prompt = f"""You are a VEO3 prompt specialist creating video generation prompts for {client_profile['companyName']}.

LANGUAGE: {self.language}
- {lang_config['voice_instruction']}

CLIENT BRAND CONTEXT:
- Company: {client_profile['companyName']}
- Industry: {client_profile['industry']}
- Content Strategy: {client_profile['contentStrategy']}
- Tone: {client_profile['toneOfVoice']}
- Visual Style: {style_prefs.get('videoStyle', 'amateur')}
- Camera Work: {style_prefs.get('cameraWork', 'handheld')}
- Lighting: {style_prefs.get('lighting', 'natural')}
- Color Palette: {style_prefs.get('colorPalette', 'vibrant')}

SCENARIO:
{scenario}

TIMING BREAKDOWN:
{timing_breakdown}

CAMERA STYLE: {camera_style}

YOUR TASK:
Convert the scenario into precise VEO3 prompts that reflect {client_profile['companyName']}'s brand identity and visual preferences.

OUTPUT FORMAT:
Return a JSON array of prompts that maintain brand consistency:

[
  {{
    "prompt": "Frame: [Context]\\nCharacter: [Description]\\nLocation: [Setting]\\nCamera Style: {camera_style}\\nAction: [8s action]\\nLighting: {style_prefs.get('lighting', 'natural')}\\nMood: {client_profile['toneOfVoice']}\\nDialogue: [Natural {self.language} speech]",
    "aspect_ratio": "9:16",
    "duration": "8s",
    "enhance_prompt": false,
    "generate_audio": true
  }}
]

Ensure the content aligns with {client_profile['companyName']}'s {client_profile['contentStrategy']} strategy and {client_profile['toneOfVoice']} tone.

Create the VEO3 prompts now:"""

        return prompt

    def build_veo3_prompt(self, scenario: str, timing_breakdown: str, camera_style: str, language: str) -> str:
        """Создает промпт для генерации VEO3 промптов"""
        
        lang_config = self.language_configs.get(self.language, self.language_configs["Portuguese"])
        
        prompt = f"""You are a VEO3 prompt specialist creating detailed video generation prompts that maintain visual consistency across segments.

LANGUAGE: {self.language}
- {lang_config['voice_instruction']}
- Use natural {self.language} speech patterns and authentic expressions

SCENARIO:
{scenario}

TIMING BREAKDOWN:
{timing_breakdown}

CAMERA STYLE: {camera_style}

YOUR TASK:
Convert the scenario and timing into precise VEO3 prompts that maintain character and environmental consistency.

VEO3 TECHNICAL REQUIREMENTS:
- Character descriptions must be WORD-FOR-WORD identical across segments
- Use 2-3 simple visual markers for consistency
- Each segment must advance story, not repeat
- Focus on visual storytelling, not UI demonstration

CONSISTENCY RULES:
1. Character description: EXACT same wording in all segments
2. Location anchors: 3-5 environmental constants
3. Camera style: {camera_style} maintained throughout
4. Visual markers: Key recognizable elements

OUTPUT FORMAT:
Return a JSON array of prompts:

[
  {{
    "prompt": "Frame: [Segment context]\\nCharacter: [IDENTICAL description]\\nLocation: [Specific setting]\\nCamera Style: {camera_style}\\nAction: [What happens in 8s]\\nLighting: [Visual mood]\\nMood: [Emotional state]\\nDialogue: [Natural {self.language} speech]",
    "aspect_ratio": "9:16",
    "duration": "8s",
    "enhance_prompt": false,
    "generate_audio": true
  }}
]

CRITICAL: Ensure character descriptions are IDENTICAL across all segments for VEO3 consistency.

Create the VEO3 prompts now:"""

        return prompt

    def _format_product_description(self, product_data: Dict[str, Any]) -> str:
        """Форматирует описание продукта для промпта"""
        
        description = f"""
PRODUCT: {product_data.get('name', 'CrossFi App')}
CATEGORY: {product_data.get('category', 'Crypto Banking Solution')}
DESCRIPTION: {product_data.get('description', 'Comprehensive crypto banking application')}
"""
        
        if 'key_features' in product_data:
            description += f"\nKEY FEATURES:\n"
            for feature in product_data['key_features'][:5]:  # Ограничиваем до 5 фич
                description += f"- {feature}\n"
        
        if 'consumer_benefits' in product_data:
            description += f"\nCONSUMER BENEFITS:\n"
            for benefit in product_data['consumer_benefits'][:3]:  # Ограничиваем до 3 преимуществ
                description += f"- {benefit}\n"
        
        return description.strip()

    def _format_client_profile(self, client_profile: Dict[str, Any]) -> str:
        """Форматирует профиль клиента для промпта"""
        
        description = f"""
COMPANY: {client_profile.get('companyName', 'Unknown Company')}
INDUSTRY: {client_profile.get('industry', 'Unknown Industry')}
POSITIONING: {client_profile.get('positioning', '')}

TARGET AUDIENCE:
{chr(10).join(f'- {audience}' for audience in client_profile.get('targetAudience', []))}

BRAND VALUES:
{chr(10).join(f'- {value}' for value in client_profile.get('brandValues', []))}

MAIN PRODUCTS/SERVICES:
{chr(10).join(f'- {product}' for product in client_profile.get('mainProducts', []))}

COMPETITIVE ADVANTAGES:
{chr(10).join(f'- {advantage}' for advantage in client_profile.get('competitiveAdvantages', []))}

UNIQUE FEATURES:
{chr(10).join(f'- {feature}' for feature in client_profile.get('uniqueFeatures', []))}
        """.strip()
        
        return description

def get_available_languages():
    """Возвращает список доступных языков"""
    return [
        {"code": "English", "name": "English", "flag": "🇺🇸"},
        {"code": "Portuguese", "name": "Português (Brasil)", "flag": "🇧🇷"},
        {"code": "Vietnamese", "name": "Tiếng Việt", "flag": "🇻🇳"},
        {"code": "Spanish", "name": "Español", "flag": "🇪🇸"},
        {"code": "Russian", "name": "Русский", "flag": "🇷🇺"},
        {"code": "Klingon", "name": "tlhIngan Hol", "flag": "🖖"},
        {"code": "Sanskrit", "name": "संस्कृतम्", "flag": "🕉️"}
    ]
