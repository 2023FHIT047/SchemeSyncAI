import logging

logger = logging.getLogger(__name__)

class EligibilityEngine:
    """
    Deterministic rule-based eligibility evaluation engine.
    Compares user profile attributes against structured EligibilityRule instances.
    """

    @staticmethod
    def evaluate_rule(rule, user_profile):
        """
        Evaluates a single EligibilityRule against a UserProfile or dictionary of user attributes.
        Returns dict: { 'rule_id': id, 'attribute': str, 'description': str, 'status': 'PASSED'|'FAILED'|'MISSING_INFO', 'user_value': val, 'required_value': val, 'is_mandatory': bool, 'reason': str }
        """
        attr_name = rule.attribute.strip()
        
        # Extract user value from profile model or dict
        if isinstance(user_profile, dict):
            user_val = user_profile.get(attr_name, None)
        else:
            user_val = getattr(user_profile, attr_name, None)

        if user_val is None or user_val == '':
            return {
                'rule_id': rule.id,
                'attribute': attr_name,
                'description': rule.description or f"{attr_name} requirement",
                'status': 'MISSING_INFO',
                'user_value': None,
                'required_value': rule.value,
                'is_mandatory': rule.is_mandatory,
                'reason': f"User profile is missing attribute '{attr_name}'"
            }

        # Value parsing based on rule.value_type and operator
        op = rule.operator.upper().strip()
        req_val_str = str(rule.value).strip()
        val_type = rule.value_type.upper().strip()

        passed = False
        reason = ""

        try:
            if val_type == 'NUMBER':
                num_user = float(user_val)
                num_req = float(req_val_str)
                if op == '=':
                    passed = (num_user == num_req)
                elif op == '!=':
                    passed = (num_user != num_req)
                elif op == '>':
                    passed = (num_user > num_req)
                elif op == '<':
                    passed = (num_user < num_req)
                elif op == '>=':
                    passed = (num_user >= num_req)
                elif op == '<=':
                    passed = (num_user <= num_req)

            elif val_type == 'BOOLEAN':
                bool_user = bool(user_val) if not isinstance(user_val, str) else user_val.lower() in ('true', '1', 'yes')
                bool_req = req_val_str.lower() in ('true', '1', 'yes')
                if op == '=':
                    passed = (bool_user == bool_req)
                elif op == '!=':
                    passed = (bool_user != bool_req)

            elif val_type in ('LIST', 'STRING') or op in ('IN', 'NOT IN'):
                # Handle list / string matching
                req_list = [item.strip().lower() for item in req_val_str.split(',') if item.strip()]
                str_user = str(user_val).strip().lower()

                if op == '=':
                    passed = (str_user == req_val_str.lower())
                elif op == '!=':
                    passed = (str_user != req_val_str.lower())
                elif op == 'IN':
                    passed = (str_user in req_list or req_val_str.lower() == 'all india' or 'all' in req_list)
                elif op == 'NOT IN':
                    passed = (str_user not in req_list)

            if passed:
                status = 'PASSED'
                reason = f"Condition satisfied: {user_val} matches {op} {req_val_str}"
            else:
                status = 'FAILED'
                reason = f"Condition failed: {user_val} does not satisfy {op} {req_val_str}"

        except Exception as e:
            logger.error(f"Error evaluating rule {rule.id}: {e}")
            status = 'FAILED'
            reason = f"Evaluation error for rule value formatting ({str(e)})"

        return {
            'rule_id': rule.id,
            'attribute': attr_name,
            'description': rule.description or f"{attr_name} {op} {req_val_str}",
            'status': status,
            'user_value': user_val,
            'required_value': req_val_str,
            'is_mandatory': rule.is_mandatory,
            'reason': reason
        }

    @classmethod
    def evaluate_scheme(cls, scheme, user_profile):
        """
        Evaluates all rules of a scheme against user profile.
        Returns structured analysis breakdown.
        """
        rules = scheme.eligibility_rules.all()
        if not rules.exists():
            # If scheme has no strict DB rules defined yet, consider general eligibility check
            return {
                'scheme_id': scheme.scheme_id,
                'scheme_name': scheme.scheme_name,
                'is_eligible': True,
                'eligibility_score': 100,
                'summary': 'No explicit restriction rules configured. Open for general applicants.',
                'matched_conditions': [],
                'failed_conditions': [],
                'missing_information': []
            }

        matched = []
        failed = []
        missing = []

        mandatory_failed = False

        for rule in rules:
            result = cls.evaluate_rule(rule, user_profile)
            if result['status'] == 'PASSED':
                matched.append(result)
            elif result['status'] == 'FAILED':
                failed.append(result)
                if result['is_mandatory']:
                    mandatory_failed = True
            elif result['status'] == 'MISSING_INFO':
                missing.append(result)
                if result['is_mandatory']:
                    mandatory_failed = True

        total_rules = len(rules)
        passed_count = len(matched)
        score = int((passed_count / total_rules) * 100) if total_rules > 0 else 100
        is_eligible = not mandatory_failed and (len(failed) == 0)

        return {
            'scheme_id': scheme.scheme_id,
            'scheme_name': scheme.scheme_name,
            'is_eligible': is_eligible,
            'eligibility_score': score,
            'summary': f"Passed {passed_count} of {total_rules} conditions." + (" Meets all mandatory requirements." if is_eligible else " Does not meet mandatory requirements."),
            'matched_conditions': matched,
            'failed_conditions': failed,
            'missing_information': missing
        }
