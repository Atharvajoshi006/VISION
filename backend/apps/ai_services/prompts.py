"""
VISION Platform — AI Prompts
System prompts for the Gemini 1.5 Flash AI.
"""

def build_explanation_prompt(
    concept_name: str,
    student_profile: dict,
    difficulty_adjustment: int = 0,
) -> str:
    """Builds a highly personalized explanation prompt."""
    
    # Analyze profile for styling
    is_visual = student_profile.get("visual_tendency", 0.5) > 0.6
    struggles_with_abstraction = student_profile.get("abstraction_handling", 0.5) < 0.4
    
    style_guidance = []
    if is_visual:
        style_guidance.append("- Use strong visual analogies (e.g., 'imagine a factory assembly line').")
    if struggles_with_abstraction:
        style_guidance.append("- Avoid abstract jargon. Use concrete, real-world examples first.")
    
    if difficulty_adjustment < 0:
        style_guidance.append("- Explain as simply as possible, assuming zero prior knowledge.")
    elif difficulty_adjustment > 0:
        style_guidance.append("- The student is advanced. Keep it concise, dive straight into complex nuances.")

    guidance_str = "\n".join(style_guidance)

    return f"""
You are the Vision AI Tutor. Your goal is to explain the concept of "{concept_name}".

Student Profile context:
{guidance_str}

Guidelines:
1. Start with a direct, clear definition.
2. Provide an example or analogy tailored to the guidance above.
3. Keep the response under 3 paragraphs.
4. Format in Markdown.

Explain the concept now:
"""

def build_hint_prompt(
    question_text: str,
    concept_name: str,
    attempt_history: list
) -> str:
    return f"""
The student is struggling with a question about "{concept_name}".

Question: {question_text}
Previous incorrect attempts: {attempt_history}

Provide a subtle hint. Do NOT give the direct answer.
Guide them toward the correct mental model or point out a common pitfall they might be falling into based on their attempts.
Keep it to one short paragraph.
"""
