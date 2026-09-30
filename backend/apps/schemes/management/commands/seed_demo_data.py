from django.core.management.base import BaseCommand
from apps.schemes.models import GovernmentScheme
from apps.eligibility.models import EligibilityRule
from apps.documents.models import RequiredDocument

class Command(BaseCommand):
    help = 'Seeds database with verified realistic sample government schemes for Farmers, Education, and Women & Child Welfare.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding initial government scheme demo data...'))

        schemes_data = [
            # FARMER & AGRICULTURE SCHEMES
            {
                "scheme_id": "pm-kisan",
                "scheme_name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
                "category": "FARMER",
                "subcategory": "Income Support",
                "ministry": "Ministry of Agriculture & Farmers Welfare",
                "scheme_type": "CENTRAL",
                "applicable_state": "All India",
                "short_description": "Direct income support of ₹6,000 per year in 3 equal installments to small and landholding farmer families across India.",
                "detailed_description": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a Central Sector scheme to augment the financial needs of landholding farmers. Under the Scheme an amount of ₹6,000/- per year is transferred in three 4-monthly installments of ₹2,000/- directly into the bank accounts of the beneficiaries.",
                "objective": "To supplement the financial needs of landholding farmers for procuring agricultural inputs and domestic expenses.",
                "benefits": "₹6,000 per year transferred directly to bank account via DBT in 3 installments.",
                "benefit_type": "FINANCIAL",
                "benefit_amount": "₹6,000 / year",
                "application_mode": "ONLINE",
                "application_link": "https://pmkisan.gov.in/",
                "official_website": "https://pmkisan.gov.in/",
                "helpline": "155261 / 011-24300606",
                "email": "pmkisan-ict@gov.in",
                "scheme_status": "ACTIVE",
                "launch_year": 2019,
                "is_demo_data": True,
                "rules": [
                    {"attribute": "is_farmer", "operator": "=", "value": "True", "value_type": "BOOLEAN", "description": "Applicant must be a farmer", "is_mandatory": True},
                    {"attribute": "land_ownership", "operator": "=", "value": "True", "value_type": "BOOLEAN", "description": "Applicant family must own cultivable land", "is_mandatory": True},
                    {"attribute": "age", "operator": ">=", "value": "18", "value_type": "NUMBER", "description": "Applicant age must be at least 18 years", "is_mandatory": True},
                ],
                "documents": [
                    {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Mandatory for identity verification and direct benefit transfer."},
                    {"document_name": "7/12 Land Record Extract / Jamabandi", "is_mandatory": True, "description": "Official land title document proving land ownership."},
                    {"document_name": "Savings Bank Account Passbook", "is_mandatory": True, "description": "Aadhaar-linked bank account for DBT payment."},
                ]
            },
            {
                "scheme_id": "pm-fasal-bima",
                "scheme_name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
                "category": "FARMER",
                "subcategory": "Crop Insurance",
                "ministry": "Ministry of Agriculture & Farmers Welfare",
                "scheme_type": "JOINT",
                "applicable_state": "All India",
                "short_description": "Comprehensive crop insurance cover against non-preventable natural risks from pre-sowing to post-harvest.",
                "detailed_description": "PMFBY provides a comprehensive insurance cover against failure of the crop thus helping in stabilizing the income of the farmers. Farmers pay a uniform premium of only 2% for Kharif and 1.5% for Rabi crops.",
                "objective": "To provide insurance coverage and financial support to farmers in the event of failure of notified crops due to natural calamities.",
                "benefits": "Financial protection against crop loss with low premium (1.5% - 2%) and fast claims settlement.",
                "benefit_type": "SUBSIDY",
                "benefit_amount": "Up to 98% Premium Subsidy",
                "application_mode": "HYBRID",
                "application_link": "https://pmfby.gov.in/",
                "official_website": "https://pmfby.gov.in/",
                "helpline": "1800 180 1551",
                "email": "helpdesk-pmfby@gov.in",
                "scheme_status": "ACTIVE",
                "launch_year": 2016,
                "is_demo_data": True,
                "rules": [
                    {"attribute": "is_farmer", "operator": "=", "value": "True", "value_type": "BOOLEAN", "description": "Must be a cultivating farmer (Sharecroppers & Tenant farmers included)", "is_mandatory": True},
                    {"attribute": "age", "operator": ">=", "value": "18", "value_type": "NUMBER", "description": "Minimum age of 18 years", "is_mandatory": True},
                ],
                "documents": [
                    {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Identity proof."},
                    {"document_name": "Land Possession Certificate / Sowing Certificate", "is_mandatory": True, "description": "Proof of crop sown issued by Gram Sevak/Patwari."},
                    {"document_name": "Bank Account Details", "is_mandatory": True, "description": "For claim payout credit."},
                ]
            },
            
            # EDUCATION & STUDENT SCHEMES
            {
                "scheme_id": "post-matric-scholarship",
                "scheme_name": "Post-Matric Scholarship Scheme for SC/ST/OBC Students",
                "category": "EDUCATION",
                "subcategory": "Higher Education Financial Aid",
                "ministry": "Ministry of Social Justice and Empowerment",
                "scheme_type": "JOINT",
                "applicable_state": "All India",
                "short_description": "Financial assistance covering 100% compulsory non-refundable fees and monthly maintenance allowance for post-secondary education.",
                "detailed_description": "Post Matric Scholarship scheme provides financial assistance to SC, ST, and OBC students studying at post-matriculation or post-secondary stage to enable them to complete their education.",
                "objective": "To significantly increase the Gross Enrolment Ratio (GER) of marginalized students in higher education.",
                "benefits": "Complete tuition fee reimbursement + monthly maintenance allowance up to ₹1,200/month.",
                "benefit_type": "SCHOLARSHIP",
                "benefit_amount": "100% Fee Reimbursement + Monthly Allowance",
                "application_mode": "ONLINE",
                "application_link": "https://scholarships.gov.in/",
                "official_website": "https://scholarships.gov.in/",
                "helpline": "0120-6619540",
                "email": "helpdesk@nsp.gov.in",
                "scheme_status": "ACTIVE",
                "launch_year": 2006,
                "is_demo_data": True,
                "rules": [
                    {"attribute": "is_student", "operator": "=", "value": "True", "value_type": "BOOLEAN", "description": "Applicant must be a currently enrolled student", "is_mandatory": True},
                    {"attribute": "caste_category", "operator": "IN", "value": "SC, ST, OBC, EWS", "value_type": "LIST", "description": "Reserved for SC, ST, OBC, or EWS categories", "is_mandatory": True},
                    {"attribute": "annual_family_income", "operator": "<=", "value": "250000", "value_type": "NUMBER", "description": "Annual family income must not exceed ₹2,50,000", "is_mandatory": True},
                ],
                "documents": [
                    {"document_name": "Caste Certificate", "is_mandatory": True, "description": "Issued by competent authority (Tahsildar / SDO)."},
                    {"document_name": "Income Certificate", "is_mandatory": True, "description": "Current financial year family income certificate."},
                    {"document_name": "Mark Sheet of Last Qualifying Examination", "is_mandatory": True, "description": "10th or 12th exam passing certificate."},
                    {"document_name": "College Admission Fee Receipt", "is_mandatory": True, "description": "Receipt proving current year academic enrolment."},
                ]
            },
            {
                "scheme_id": "central-sector-scholarship",
                "scheme_name": "Central Sector Scheme of Top Class Education for Merit Students",
                "category": "EDUCATION",
                "subcategory": "Merit Scholarship",
                "ministry": "Ministry of Education",
                "scheme_type": "CENTRAL",
                "applicable_state": "All India",
                "short_description": "Merit-cum-means scholarship of ₹12,000 to ₹20,000 per annum for meritorious college students in top 80th percentile.",
                "detailed_description": "Provides financial assistance to meritorious students from low income families to meet a part of their day-to-day expenses while pursuing higher studies.",
                "objective": "To support meritorious students with financial assistance for university education.",
                "benefits": "₹12,000 per annum for Graduation years, ₹20,000 per annum for Post-Graduation years.",
                "benefit_type": "SCHOLARSHIP",
                "benefit_amount": "Up to ₹20,000 / year",
                "application_mode": "ONLINE",
                "application_link": "https://scholarships.gov.in/",
                "official_website": "https://scholarships.gov.in/",
                "helpline": "0120-6619540",
                "email": "helpdesk@nsp.gov.in",
                "scheme_status": "ACTIVE",
                "launch_year": 2008,
                "is_demo_data": True,
                "rules": [
                    {"attribute": "is_student", "operator": "=", "value": "True", "value_type": "BOOLEAN", "description": "Must be currently enrolled in college/university", "is_mandatory": True},
                    {"attribute": "annual_family_income", "operator": "<=", "value": "450000", "value_type": "NUMBER", "description": "Annual family income limit is ₹4,50,000 per year", "is_mandatory": True},
                    {"attribute": "age", "operator": "<=", "value": "25", "value_type": "NUMBER", "description": "Maximum age limit is 25 years", "is_mandatory": False},
                ],
                "documents": [
                    {"document_name": "Class 12th Passing Certificate", "is_mandatory": True, "description": "Proving 80th percentile score in state/CBSE board."},
                    {"document_name": "Income Certificate", "is_mandatory": True, "description": "Issued by authorized Govt official."},
                    {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Identity proof."},
                ]
            },

            # WOMEN & CHILD WELFARE SCHEMES
            {
                "scheme_id": "sukanya-samriddhi",
                "scheme_name": "Sukanya Samriddhi Yojana (SSY)",
                "category": "WOMEN_CHILD",
                "subcategory": "Girl Child Savings & Prosperity",
                "ministry": "Ministry of Women and Child Development",
                "scheme_type": "CENTRAL",
                "applicable_state": "All India",
                "short_description": "High-interest tax-free small savings scheme for the education and marriage expense of girl children below 10 years of age.",
                "detailed_description": "Sukanya Samriddhi Yojana is a small deposit scheme for the girl child launched as a part of Beti Bachao Beti Padhao campaign. Offers highest interest rates (approx 8.2%) with 80C tax exemption.",
                "objective": "To ensure financial security and empowerment for girl children in India.",
                "benefits": "Highest sovereign-backed tax-free interest rate (8.2% p.a.) with partial withdrawal for higher education.",
                "benefit_type": "FINANCIAL",
                "benefit_amount": "Up to ₹1.5 Lakh annual tax-free savings",
                "application_mode": "HYBRID",
                "application_link": "https://www.indiapost.gov.in/",
                "official_website": "https://wcd.nic.in/",
                "helpline": "1800 11 6117",
                "email": "webmaster-wcd@nic.in",
                "scheme_status": "ACTIVE",
                "launch_year": 2015,
                "is_demo_data": True,
                "rules": [
                    {"attribute": "gender", "operator": "=", "value": "FEMALE", "value_type": "STRING", "description": "Beneficiary must be a girl child", "is_mandatory": True},
                    {"attribute": "age", "operator": "<=", "value": "10", "value_type": "NUMBER", "description": "Girl child age must be under 10 years at account opening", "is_mandatory": True},
                ],
                "documents": [
                    {"document_name": "Birth Certificate of Girl Child", "is_mandatory": True, "description": "Official municipal/hospital birth certificate."},
                    {"document_name": "Parent / Guardian Aadhaar Card", "is_mandatory": True, "description": "Identity and address proof of guardian."},
                    {"document_name": "Passport Size Photographs", "is_mandatory": True, "description": "Child and parent photos."},
                ]
            },
            {
                "scheme_id": "pmmvy-scheme",
                "scheme_name": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
                "category": "WOMEN_CHILD",
                "subcategory": "Maternal Health & Nutrition",
                "ministry": "Ministry of Women and Child Development",
                "scheme_type": "CENTRAL",
                "applicable_state": "All India",
                "short_description": "Direct cash incentive of ₹5,000 to pregnant women and lactating mothers for first living child, plus ₹6,000 for second girl child.",
                "detailed_description": "PMMVY provides partial compensation for the wage loss in terms of cash incentive so that women can take adequate rest before and after delivery of the first child.",
                "objective": "To promote healthcare seeking behavior and nutritional support for pregnant and lactating mothers.",
                "benefits": "Direct cash transfer of ₹5,000 in bank account upon ANC registration & child vaccination.",
                "benefit_type": "FINANCIAL",
                "benefit_amount": "₹5,000 - ₹6,000 Cash Transfer",
                "application_mode": "ONLINE",
                "application_link": "https://pmmvy.wcd.gov.in/",
                "official_website": "https://pmmvy.wcd.gov.in/",
                "helpline": "011-23382393",
                "email": "pmmvy-wcd@nic.in",
                "scheme_status": "ACTIVE",
                "launch_year": 2017,
                "is_demo_data": True,
                "rules": [
                    {"attribute": "gender", "operator": "=", "value": "FEMALE", "value_type": "STRING", "description": "Beneficiary must be female", "is_mandatory": True},
                    {"attribute": "age", "operator": ">=", "value": "19", "value_type": "NUMBER", "description": "Minimum age of 19 years", "is_mandatory": True},
                ],
                "documents": [
                    {"document_name": "MCP Card (Mother and Child Protection Card)", "is_mandatory": True, "description": "Registered at Anganwadi or Govt hospital."},
                    {"document_name": "Aadhaar Card of Mother", "is_mandatory": True, "description": "Identity proof."},
                    {"document_name": "Bank Passbook of Mother", "is_mandatory": True, "description": "Must be linked to Aadhaar for DBT."},
                ]
            },
            {
                "scheme_id": "ladli-behna-maharashtra",
                "scheme_name": "Mukhyamantri Majhi Ladki Bahin Yojana",
                "category": "WOMEN_CHILD",
                "subcategory": "Women Financial Independence",
                "ministry": "Department of Women and Child Development, Maharashtra",
                "scheme_type": "STATE",
                "applicable_state": "Maharashtra",
                "short_description": "Monthly financial assistance of ₹1,500 directly transferred to eligible women aged 21 to 65 in Maharashtra.",
                "detailed_description": "State scheme providing monthly financial independence and nutrition support to married, widowed, divorced, and destitute women in Maharashtra state.",
                "objective": "To empower women economically and ensure health and nutrition dignity.",
                "benefits": "₹1,500 monthly cash assistance directly transferred into bank account.",
                "benefit_type": "FINANCIAL",
                "benefit_amount": "₹1,500 / month",
                "application_mode": "ONLINE",
                "application_link": "https://ladlibahin.maharashtra.gov.in/",
                "official_website": "https://ladlibahin.maharashtra.gov.in/",
                "helpline": "181",
                "email": "ladli.bahin@maharashtra.gov.in",
                "scheme_status": "ACTIVE",
                "launch_year": 2024,
                "is_demo_data": True,
                "rules": [
                    {"attribute": "gender", "operator": "=", "value": "FEMALE", "value_type": "STRING", "description": "Must be female applicant", "is_mandatory": True},
                    {"attribute": "state", "operator": "=", "value": "Maharashtra", "value_type": "STRING", "description": "Must be resident of Maharashtra", "is_mandatory": True},
                    {"attribute": "age", "operator": ">=", "value": "21", "value_type": "NUMBER", "description": "Minimum age of 21 years", "is_mandatory": True},
                    {"attribute": "age", "operator": "<=", "value": "65", "value_type": "NUMBER", "description": "Maximum age of 65 years", "is_mandatory": True},
                    {"attribute": "annual_family_income", "operator": "<=", "value": "250000", "value_type": "NUMBER", "description": "Annual family income must not exceed ₹2.5 Lakhs", "is_mandatory": True},
                ],
                "documents": [
                    {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Identity and Maharashtra address proof."},
                    {"document_name": "Domicile Certificate of Maharashtra", "is_mandatory": True, "description": "Or 15-year old Ration Card/Voter ID in Maharashtra."},
                    {"document_name": "Income Certificate / Yellow or Orange Ration Card", "is_mandatory": True, "description": "Proving income below ₹2.5 Lakhs."},
                ]
            },
            {
                "scheme_id": "pm-vishwakarma-artisan",
                "scheme_name": "PM Vishwakarma Scheme for Artisans & Women Craftsmen",
                "category": "FARMER",
                "subcategory": "Artisan & Livelihood Support",
                "ministry": "Ministry of Micro, Small and Medium Enterprises",
                "scheme_type": "CENTRAL",
                "applicable_state": "All India",
                "short_description": "End-to-end support for traditional artisans, tailors, and weavers including ₹15,000 toolkit digital voucher and ₹3 Lakh collateral-free loan at 5%.",
                "detailed_description": "PM Vishwakarma offers recognition, skill training, ₹15,000 tool kit incentive, and subsidized loans up to ₹3,00,000 for 18 traditional trades including tailoring, basket weaving, and carpentry.",
                "objective": "To strengthen and nurture traditional artisans and craftsmen.",
                "benefits": "₹15,000 Toolkit Incentive + ₹3,00,000 Collateral-free Credit at 5% interest rate + Skill stipend ₹500/day.",
                "benefit_type": "LOAN",
                "benefit_amount": "₹15,000 Tool Voucher + ₹3 Lakh Loan at 5%",
                "application_mode": "ONLINE",
                "application_link": "https://pmvishwakarma.gov.in/",
                "official_website": "https://pmvishwakarma.gov.in/",
                "helpline": "1800 267 7777",
                "email": "pm-vishwakarma@gov.in",
                "scheme_status": "ACTIVE",
                "launch_year": 2023,
                "is_demo_data": True,
                "rules": [
                    {"attribute": "age", "operator": ">=", "value": "18", "value_type": "NUMBER", "description": "Minimum age of 18 years", "is_mandatory": True},
                    {"attribute": "occupation", "operator": "IN", "value": "Farmer, Self-Employed, Daily Wage Labourer, Small Business / Artisan, Homemaker", "value_type": "LIST", "description": "Must be engaged in traditional artisan / hands-on craft trade", "is_mandatory": True},
                ],
                "documents": [
                    {"document_name": "Aadhaar Card", "is_mandatory": True, "description": "Identity proof."},
                    {"document_name": "Bank Passbook", "is_mandatory": True, "description": "Account details for toolkit voucher credit."},
                    {"document_name": "Ration Card", "is_mandatory": True, "description": "Family verification."},
                ]
            }
        ]

        created_count = 0
        for s_data in schemes_data:
            rules_data = s_data.pop('rules', [])
            docs_data = s_data.pop('documents', [])

            scheme, created = GovernmentScheme.objects.update_or_create(
                scheme_id=s_data['scheme_id'],
                defaults=s_data
            )
            if created:
                created_count += 1

            # Clear and recreate rules
            scheme.eligibility_rules.all().delete()
            for r in rules_data:
                EligibilityRule.objects.create(scheme=scheme, **r)

            # Clear and recreate documents
            scheme.required_documents.all().delete()
            for d in docs_data:
                RequiredDocument.objects.create(scheme=scheme, **d)

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(schemes_data)} government schemes! ({created_count} newly created)'))
