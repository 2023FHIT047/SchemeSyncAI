import io
from datetime import datetime

from django.conf import settings
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

BRAND = colors.HexColor('#1a5490')
BRAND_LIGHT = colors.HexColor('#e8f0fa')
ACCENT = colors.HexColor('#0f7b4f')
GRAY = colors.HexColor('#5a6472')


def _wrap(text, style, max_width):
    return Paragraph(text or '', style)


def build_certificate_pdf(certificate, user_profile, analysis):
    """
    Renders a landscape A4 eligibility certificate and returns raw PDF bytes.

    certificate : EligibilityCertificate instance
    user_profile: UserProfile of the certificate holder
    analysis    : dict returned by EligibilityEngine.evaluate_scheme
    """
    scheme = certificate.scheme
    buf = io.BytesIO()
    page = landscape(A4)
    width, height = page
    c = canvas.Canvas(buf, pagesize=page)

    # Outer decorative border
    c.setStrokeColor(BRAND)
    c.setLineWidth(3)
    c.rect(12 * mm, 12 * mm, width - 24 * mm, height - 24 * mm)
    c.setLineWidth(1)
    c.setStrokeColor(colors.HexColor('#c9d6e5'))
    c.rect(16 * mm, 16 * mm, width - 32 * mm, height - 32 * mm)

    # Header band
    c.setFillColor(BRAND)
    c.rect(16 * mm, height - 46 * mm, width - 32 * mm, 30 * mm, stroke=0, fill=1)

    c.setFillColor(colors.white)
    c.setFont('Helvetica-Bold', 20)
    c.drawCentredString(width / 2, height - 33 * mm, 'CERTIFICATE OF ELIGIBILITY')
    c.setFont('Helvetica', 11)
    c.drawCentredString(width / 2, height - 41 * mm, 'Government Scheme Assistance Platform')

    # Body
    c.setFillColor(colors.black)
    holder_name = user_profile.full_name or certificate.user.get_full_name() or certificate.user.username
    issued_str = certificate.issued_at.strftime('%d %B %Y')

    body_style = ParagraphStyle(
        'body', fontName='Helvetica', fontSize=12.5, leading=19, alignment=1,
        textColor=colors.HexColor('#222222'),
    )
    body_html = (
        f'This is to certify that <b>{holder_name}</b> has been assessed against the '
        f'eligibility criteria of the scheme <b>{scheme.scheme_name}</b> and has been found '
        f'<b>FULLY ELIGIBLE</b> with an eligibility score of <b>{analysis.get("eligibility_score", 100)}%</b>.'
    )
    p = Paragraph(body_html, body_style)
    pw, ph = p.wrap(width - 70 * mm, 40 * mm)
    p.drawOn(c, 35 * mm, height - 46 * mm - 16 * mm - ph)

    # Scheme / holder details grid
    top = height - 46 * mm - 16 * mm - ph - 12 * mm
    left_col = 35 * mm
    right_col = width / 2 + 8 * mm

    label_style = ParagraphStyle('lbl', fontName='Helvetica-Bold', fontSize=9.5,
                                 leading=13, textColor=BRAND)
    value_style = ParagraphStyle('val', fontName='Helvetica', fontSize=10.5,
                                 leading=14, textColor=colors.HexColor('#222222'))

    dob = user_profile.date_of_birth.strftime('%d %b %Y') if user_profile.date_of_birth else '—'
    income = f'₹{user_profile.annual_family_income:,.0f}' if user_profile.annual_family_income is not None else '—'
    state = user_profile.state or '—'

    rows_left = [
        ('Certificate Holder', holder_name),
        ('Date of Birth', dob),
        ('State', state),
    ]
    rows_right = [
        ('Scheme ID', scheme.scheme_id),
        ('Ministry / Department', scheme.ministry),
        ('Date of Issue', issued_str),
    ]

    y = top
    for label, value in rows_left:
        c.setFont('Helvetica-Bold', 9.5)
        c.setFillColor(BRAND)
        c.drawString(left_col, y, label.upper())
        c.setFont('Helvetica', 10.5)
        c.setFillColor(colors.HexColor('#222222'))
        c.drawString(left_col, y - 5 * mm, str(value))
        y -= 13 * mm

    y = top
    for label, value in rows_right:
        c.setFont('Helvetica-Bold', 9.5)
        c.setFillColor(BRAND)
        c.drawString(right_col, y, label.upper())
        c.setFont('Helvetica', 10.5)
        c.setFillColor(colors.HexColor('#222222'))
        wrapped = _wrap(str(value), value_style, width / 2 - 45 * mm)
        wrapped.wrapOn(c, width / 2 - 45 * mm, 20 * mm)
        wrapped.drawOn(c, right_col, y - 5 * mm)
        y -= 13 * mm

    # Verification footer box
    ver_y = 34 * mm
    c.setFillColor(BRAND_LIGHT)
    c.setStrokeColor(BRAND)
    c.setLineWidth(1)
    c.roundRect(35 * mm, ver_y - 4 * mm, width - 70 * mm, 22 * mm, 3 * mm, stroke=1, fill=1)

    c.setFillColor(GRAY)
    c.setFont('Helvetica', 9)
    c.drawString(40 * mm, ver_y + 10 * mm, 'VERIFICATION ID')
    c.setFillColor(colors.HexColor('#222222'))
    c.setFont('Courier-Bold', 15)
    c.drawString(40 * mm, ver_y + 1 * mm, certificate.verification_id)

    front_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    c.setFillColor(GRAY)
    c.setFont('Helvetica', 8.5)
    c.drawRightString(width - 40 * mm, ver_y + 10 * mm, 'Verify authenticity at:')
    c.setFillColor(BRAND)
    c.setFont('Helvetica-Bold', 9)
    c.drawRightString(width - 40 * mm, ver_y + 1 * mm, f'{front_url}/verify-certificate/{certificate.verification_id}')

    # Disclaimer
    c.setFillColor(GRAY)
    c.setFont('Helvetica-Oblique', 8)
    c.drawCentredString(
        width / 2, 22 * mm,
        'This is a system-generated eligibility assessment based on the profile information provided. '
        'It does not guarantee final allotment, which is subject to official verification by the concerned authority.'
    )

    c.showPage()
    c.save()
    pdf_bytes = buf.getvalue()
    buf.close()
    return pdf_bytes
