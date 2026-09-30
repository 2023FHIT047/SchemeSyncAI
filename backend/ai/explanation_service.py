class ExplanationService:
    """
    Translates structured eligibility outputs into natural, empathetic citizen explanations.
    """

    @classmethod
    def generate_explanation(cls, analysis_dict):
        """
        Takes output of EligibilityEngine.evaluate_scheme and produces a clear explanation.
        """
        scheme_name = analysis_dict.get('scheme_name', 'Government Scheme')
        is_eligible = analysis_dict.get('is_eligible', False)
        matched = analysis_dict.get('matched_conditions', [])
        failed = analysis_dict.get('failed_conditions', [])
        missing = analysis_dict.get('missing_information', [])

        lines = []

        if is_eligible:
            lines.append(f"🎉 Great news! You meet all mandatory eligibility criteria for **{scheme_name}**.")
        else:
            lines.append(f"⚠️ You currently do not meet all criteria for **{scheme_name}**.")

        if matched:
            lines.append("\n✅ Matched Conditions:")
            for item in matched:
                lines.append(f"  • {item['description']} (Your value: {item['user_value']})")

        if failed:
            lines.append("\n❌ Unmet Criteria:")
            for item in failed:
                lines.append(f"  • {item['description']} (Your value: {item['user_value']}, Required: {item['required_value']})")

        if missing:
            lines.append("\nℹ️ Missing Profile Information:")
            for item in missing:
                lines.append(f"  • {item['attribute'].replace('_', ' ').title()} needs to be completed in your profile.")

        lines.append("\n💡 Next Step: Update your profile or review the official government portal link for complete guidelines.")

        return "\n".join(lines)
