import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class ChatbotService:
    """
    Modular AI Chatbot service using Gemini API.
    Ensures responses are strictly grounded in verified government scheme data context.
    """

    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')

    def generate_response(self, user_query, context_schemes=None, user_profile_summary=""):
        """
        Generates a natural-language answer using Gemini API with strictly constrained context.
        """
        context_str = ""
        if context_schemes:
            context_str += "VERIFIED GOVERNMENT SCHEME KNOWLEDGE BASE:\n"
            for s in context_schemes:
                context_str += f"- Scheme Name: {s.scheme_name}\n"
                context_str += f"  Category: {s.get_category_display()}\n"
                context_str += f"  Ministry: {s.ministry}\n"
                context_str += f"  Benefits: {s.benefits} ({s.benefit_amount})\n"
                context_str += f"  Short Description: {s.short_description}\n"
                context_str += f"  Official Application Link: {s.application_link}\n\n"

        prompt = f"""You are an AI Government Scheme Assistant for Indian citizens.
Answer the citizen's query based ONLY on the provided verified government schemes context below.
Rules:
1. Do NOT invent or hallucinate any government scheme that is not in the knowledge base.
2. If the user's question cannot be answered using the provided context, state clearly: "I could not find a verified scheme matching your query in our official database. Please consult the official government portal."
3. Always direct users to official government application sources.
4. Keep responses respectful, concise, and easy to understand.

User Profile Context: {user_profile_summary or 'General Citizen'}

{context_str}

User Query: {user_query}
"""

        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                return {
                    'answer': response.text,
                    'source': 'Gemini LLM (Grounded Context)',
                    'is_fallback': False
                }
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}. Falling back to structured response.")

        # Fallback response when GEMINI_API_KEY is not configured or fails h
        if context_schemes and len(context_schemes) > 0:
            scheme_list = ", ".join([s.scheme_name for s in context_schemes[:3]])
            fallback = f"Based on your query '{user_query}', here are relevant schemes from our database: {scheme_list}. Please view their full details for official application links and eligibility criteria."
        else:
            fallback = f"I am searching our database for '{user_query}'. Please browse the Scheme Explorer or filter by category (Farmers, Education, Women & Child) to view verified schemes."

        return {
            'answer': fallback,
            'source': 'Rule-Based Knowledge Retrieval (Configure GEMINI_API_KEY for LLM generation)',
            'is_fallback': True
        }
