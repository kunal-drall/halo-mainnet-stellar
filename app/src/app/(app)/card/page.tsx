import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Halo Card | Halo Protocol",
  description: "The crypto-native credit card powered by your on-chain credit score",
};

export default function CardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-2xl font-[family-name:var(--font-display)] text-[#EDEDED]">
        Halo Card
      </h1>

      {/* Coming Soon Card */}
      <div className="card-base dot-grid p-10 lg:p-16 flex flex-col items-center text-center">
        {/* Icon — credit card */}
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
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
          />
        </svg>

        <h2 className="font-[family-name:var(--font-display)] text-xl text-[#EDEDED] mt-4">
          Coming Soon
        </h2>

        <p className="text-[#787E88] text-sm mt-2 max-w-md text-center">
          A crypto-native credit card backed by your Halo credit score.
        </p>

        <button className="btn btn-outline mt-6">
          Notify Me
        </button>
      </div>
    </div>
  );
}
