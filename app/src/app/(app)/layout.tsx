import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { WalletDisplay } from "@/components/layout/wallet-display";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Sidebar - Desktop */}
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-[#0B0F1A]/80 backdrop-blur-md border-b border-white/10">
          <span className="text-xl font-bold text-white">Halo</span>
          <WalletDisplay />
        </header>

        {/* Desktop Header with Wallet */}
        <header className="hidden lg:flex sticky top-0 z-40 items-center justify-end h-16 px-8 bg-[#0B0F1A]/80 backdrop-blur-md border-b border-white/10">
          <WalletDisplay />
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
