import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center"
    >
      <div className="mx-auto max-w-md space-y-6">
        {/* Error Code */}
        <h1 className="text-8xl font-extrabold tracking-tighter text-primary/20 select-none">
          404
        </h1>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            الصفحة غير موجودة
          </h2>
          <p className="text-muted-foreground">
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تم نقلها
            أو حذفها أو أن الرابط غير صحيح.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
