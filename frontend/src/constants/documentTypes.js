export const DOCUMENT_TYPE_META = {
  AADHAAR: { label: 'Aadhaar Card', icon: '🪪' },
  PAN_CARD: { label: 'PAN Card', icon: '💳' },
  INCOME_CERTIFICATE: { label: 'Income Certificate', icon: '📋' },
  RATION_CARD: { label: 'Ration Card', icon: '🏠' },
  LAND_RECORD: { label: 'Land Record (7/12)', icon: '🌾' },
  CASTE_CERTIFICATE: { label: 'Caste Certificate', icon: '🏷️' },
  DOMICILE_CERTIFICATE: { label: 'Domicile Certificate', icon: '📍' },
  BIRTH_CERTIFICATE: { label: 'Birth Certificate', icon: '👶' },
  DISABILITY_CERTIFICATE: { label: 'Disability Certificate', icon: '♿' },
  EDUCATION_MARKSHEET: { label: 'Marksheet', icon: '🎓' },
  BANK_PASSBOOK: { label: 'Bank Passbook', icon: '🏦' },
  GENERAL: { label: 'Other Document', icon: '📄' },
};

export const getDocTypeMeta = (type) =>
  DOCUMENT_TYPE_META[type] || { label: type ? type.replace(/_/g, ' ') : 'Document', icon: '📄' };
