export function getAudioUploadErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const message = raw.toLocaleLowerCase('ar')

  if (message.includes('10 mb') || message.includes('10mb') || message.includes('file size') || message.includes('payload too large')) {
    return 'حجم التسجيل أكبر من الحد المسموح. سجّلي مقطعًا أقصر ثم أعيدي المحاولة.'
  }
  if (message.includes('429') || message.includes('too many') || message.includes('rate')) {
    return 'تم تجاوز عدد محاولات رفع التسجيل. انتظري قليلاً ثم أعيدي المحاولة.'
  }
  if (message.includes('not authorized') || message.includes('unauthorized') || message.includes('غير مصرح')) {
    return 'تعذر التحقق من صلاحية رفع التسجيل. أعيدي تسجيل الدخول ثم حاولِ مرة أخرى.'
  }
  if (message.includes('mime') || message.includes('content type') || message.includes('content-type') || message.includes('not supported')) {
    return 'صيغة التسجيل غير مدعومة. أعيدي التسجيل من متصفح حديث مثل Chrome.'
  }
  if (message.includes('network') || message.includes('failed to fetch') || message.includes('timeout')) {
    return 'تعذر رفع التسجيل بسبب مشكلة في الاتصال. تحققي من الإنترنت ثم أعيدي المحاولة.'
  }

  return 'تعذر حفظ التسجيل الصوتي. تحققي من الاتصال وأعيدي المحاولة.'
}
