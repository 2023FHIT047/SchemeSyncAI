from apps.eligibility.engine import EligibilityEngine

class RecommendationService:
    """
    Hybrid Scheme Recommendation Engine.
    Combines User Profile attributes + Structured Eligibility Rules + Category matching.
    """

    @classmethod
    def get_recommendations(cls, user_profile, schemes_queryset, limit=10):
        """
        Ranks schemes for a user profile based on eligibility rules and metadata score.
        """
        ranked_schemes = []

        for scheme in schemes_queryset:
            analysis = EligibilityEngine.evaluate_scheme(scheme, user_profile)
            
            # Base score from eligibility engine
            score = analysis['eligibility_score']

            # Boost score if category aligns with occupation/status
            if user_profile.is_farmer and scheme.category == 'FARMER':
                score += 15
            if user_profile.is_student and scheme.category == 'EDUCATION':
                score += 15
            if user_profile.gender == 'FEMALE' and scheme.category == 'WOMEN_CHILD':
                score += 15

            # Boost score for state match
            if scheme.applicable_state in ('All India', user_profile.state):
                score += 10

            ranked_schemes.append({
                'scheme': scheme,
                'relevance_score': min(score, 100),
                'is_eligible': analysis['is_eligible'],
                'eligibility_summary': analysis['summary'],
                'matched_conditions': len(analysis['matched_conditions']),
                'failed_conditions': len(analysis['failed_conditions'])
            })

        # Sort by eligibility first, then score descending
        ranked_schemes.sort(key=lambda x: (x['is_eligible'], x['relevance_score']), reverse=True)
        return ranked_schemes[:limit]
