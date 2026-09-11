export function safeCatalogText(value: string | null | undefined) {
  if (!value) return '';

  return value
    .replace(/الوكيل الحصري[^،.!؟]*/g, '')
    .replace(/وكيل حصري[^،.!؟]*/g, '')
    .replace(/منتجات? أصلية(?:\s*100٪|\s*100%)?/g, 'منتجات الكتالوج')
    .replace(/ضمان الوكيل(?: المعتمد)?/g, 'الضمان المكتوب للمنتج')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([،.!؟])/g, '$1')
    .trim();
}