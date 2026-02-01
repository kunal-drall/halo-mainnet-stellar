import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid-pattern">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F1A] via-[#0B0F1A] to-[#111827]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <Link href="/" className="text-xl font-bold text-white">
          Halo
        </Link>
      </header>

      {/* Content */}
      <main className="relative z-10 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
