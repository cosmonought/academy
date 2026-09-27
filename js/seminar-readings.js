// Local files supplied for the seminar; displayed after enrollment is confirmed.
export const localReadings = Object.fromEntries(Object.entries({
  'session3.dean': 'Dean_Beyond Sexuality_selections.pdf',
  'session4.saketapoulou': 'Saketopoulous_Sexuality Beyond Consent_selections.pdf',
  'session5.malabou': 'Malabou_Pleasure Erased (English).pdf',
  'session6.berlant': 'Berlant_Desire Love.pdf',
  'session6.badiou': 'Badiou_In Praise of Love.pdf',
  'session7.copjec': 'october-books-joan-copcopjec_sex and euthanasia of reason.pdf',
  'session7.zupancic': 'Zupancic_What IS Sex.pdf',
  'session8.nancy': 'Nancy_Sexistence.pdf'
}).map(([key, file]) => [key, '/assets/' + encodeURIComponent(file)]));
