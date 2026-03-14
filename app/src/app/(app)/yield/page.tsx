import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yield Vault | Halo Protocol",
  description: "Earn yield on your USDC deposits through community lending circles",
};

export default function YieldPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-2xl font-[family-name:var(--font-display)] text-[#EDEDED]">
        Yield Vault
      </h1>

      {/* Coming Soon Card */}
      <div className="card-base dot-grid p-10 lg:p-16 flex flex-col items-center text-center">
        {/* Icon */}
        <svg
          className="w-12 h-12 text-[#D4A843] opacity-40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2 20l4-4m0 0l4-4m-4 4l4 4m-4-4l-4-4m8-4l4-4m0 0l4 4m-4-4v12"
          />
        </svg>

        <h2 className="font-[family-name:var(--font-display)] text-xl text-[#EDEDED] mt-4">
          Coming Soon
        </h2>

        <p className="text-[#787E88] text-sm mt-2 max-w-md text-center">
          Earn yield on your USDC deposits through community-powered lending circles.
        </p>

        <button className="btn btn-outline mt-6">
          Notify Me
        </button>
      </div>
    </div>
  );
}
