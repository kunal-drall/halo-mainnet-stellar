"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signTransaction } from "@stellar/freighter-api";

interface FormData {
  name: string;
  contributionAmount: number;
  memberCount: number;
  startDate: string;
}

interface CreateResult {
  circle: { id: string; name: string };
  inviteCode: string;
  inviteLink: string;
  onChainTxHash?: string;
}

export default function CreateCirclePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    contributionAmount: 50,
    memberCount: 5,
    startDate: getDefaultStartDate(),
  });

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep1 = () => {
    if (!formData.name || formData.name.length < 3) {
      setError("Circle name must be at least 3 characters");
      return false;
    }
    if (formData.name.length > 30) {
      setError("Circle name must be 30 characters or less");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (formData.contributionAmount < 10) {
      setError("Minimum contribution is $10");
      return false;
    }
    if (formData.contributionAmount > 500) {
      setError("Maximum contribution is $500");
      return false;
    }
    if (formData.memberCount < 3) {
      setError("Minimum 3 members required");
      return false;
    }
    if (formData.memberCount > 10) {
      setError("Maximum 10 members allowed");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const startDate = new Date(formData.startDate);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);

    if (startDate < minDate) {
      setError("Start date must be at least 3 days from now");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/circles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          contributionAmount: formData.contributionAmount,
          memberCount: formData.memberCount,
          startDate: new Date(formData.startDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (response.status === 428 && data.requiresIdentityBinding && data.identityTransactionXdr) {
        const identitySignResult = await signTransaction(data.identityTransactionXdr, {
          networkPassphrase: "Test SDF Network ; September 2015",
        });

        if (!identitySignResult.signedTxXdr) {
          throw new Error("Identity binding cancelled. This is required before creating a circle.");
        }

        const identitySubmitResponse = await fetch("/api/stellar/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signedXdr: identitySignResult.signedTxXdr }),
        });

        if (!identitySubmitResponse.ok) {
          const identityError = await identitySubmitResponse.json();
          throw new Error(identityError.error || "Failed to bind identity on-chain");
        }

        const retryResponse = await fetch("/api/circles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            contributionAmount: formData.contributionAmount,
            memberCount: formData.memberCount,
            startDate: new Date(formData.startDate).toISOString(),
          }),
        });

        if (!retryResponse.ok) {
          const retryData = await retryResponse.json();
          throw new Error(retryData.error || "Failed to create circle after identity binding");
        }

        Object.assign(data, await retryResponse.json());
      } else if (!response.ok) {
        throw new Error(data.error || "Failed to create circle");
      }

      if (!data.transactionXdr) {
        throw new Error("Server did not return a transaction to sign");
      }

      const signResult = await signTransaction(data.transactionXdr, {
        networkPassphrase: "Test SDF Network ; September 2015",
      });

      if (!signResult.signedTxXdr) {
        throw new Error("Transaction signing was cancelled. Circle creation requires an on-chain transaction.");
      }

      const submitResponse = await fetch("/api/stellar/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedXdr: signResult.signedTxXdr }),
      });

      if (!submitResponse.ok) {
        const submitError = await submitResponse.json();
        throw new Error(submitError.error || "Failed to submit on-chain transaction");
      }

      const submitData = await submitResponse.json();

      setCreateResult({
        circle: data.circle,
        inviteCode: data.inviteCode,
        inviteLink: data.inviteLink || `${window.location.origin}/circles/join/${data.inviteCode}`,
        onChainTxHash: submitData.hash,
      });
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (createResult?.inviteCode) {
      navigator.clipboard.writeText(createResult.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyInviteLink = () => {
    if (createResult?.inviteLink) {
      navigator.clipboard.writeText(createResult.inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalPoolSize = formData.contributionAmount * formData.memberCount;

  const stepLabels = ["Name", "Amount", "Settings", "Review"];

  // Success state (step 5)
  if (step === 5 && createResult) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card-base p-8 text-center">
          {/* Checkmark */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2DD4A0]/15 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#2DD4A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-[family-name:var(--font-display)] text-[#EDEDED] mb-2">
            Circle Created!
          </h1>
          <p className="text-[#787E88] text-sm mb-8">
            Share the invite code with your friends to join &ldquo;{createResult.circle.name}&rdquo;
          </p>

          {/* Invite Code */}
          <div className="mb-6">
            <p className="text-sm text-[#787E88] mb-2">Invite Code</p>
            <div className="card-raised p-6">
              <p className="text-3xl font-mono font-bold text-[#EDEDED] tracking-wider">
                {createResult.inviteCode}
              </p>
            </div>
          </div>

          {/* Copy Buttons */}
          <div className="flex gap-3 mb-8">
            <button className="btn btn-outline flex-1" onClick={copyInviteCode}>
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-[#2DD4A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Code
                </>
              )}
            </button>
            <button className="btn btn-outline flex-1" onClick={copyInviteLink}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy Link
            </button>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-xl mb-8 text-left">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#D4A843] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-[#D4A843] font-medium text-sm">What&apos;s next?</p>
                <p className="text-[#D4A843]/70 text-sm mt-1">
                  Share the invite code with {formData.memberCount - 1} friends. Once all members join, the circle will automatically start on {new Date(formData.startDate).toLocaleDateString()}.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              className="btn btn-outline flex-1"
              onClick={() => router.push("/circles")}
            >
              Back to Circles
            </button>
            <button
              className="btn btn-accent flex-1"
              onClick={() => router.push(`/circles/${createResult.circle.id}`)}
            >
              View Circle
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/circles")}
          className="btn btn-ghost btn-sm mb-4 px-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Circles
        </button>
        <h1 className="text-2xl font-[family-name:var(--font-display)] text-[#EDEDED]">
          Create a Circle
        </h1>
        <p className="text-[#787E88] text-sm mt-1">
          Set up a new lending circle for your community
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8 gap-1">
        {stepLabels.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s === step
                      ? "bg-[#D4A843] text-[#080B12]"
                      : s < step
                      ? "bg-[#2DD4A0] text-[#080B12]"
                      : "bg-[#161B24] text-[#545963] border border-white/[0.06]"
                  }`}
                >
                  {s < step ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                <span className={`text-xs ${s === step ? "text-[#D4A843]" : "text-[#545963]"}`}>
                  {label}
                </span>
              </div>
              {s < 4 && (
                <div
                  className={`w-10 h-0.5 mx-1.5 mb-4 ${
                    s < step ? "bg-[#2DD4A0]" : "bg-white/[0.06]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Card */}
      <div className="card-base p-6">
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-[family-name:var(--font-display)] text-[#EDEDED] mb-1">
              Name Your Circle
            </h2>
            <p className="text-[#787E88] text-sm mb-6">
              Choose a memorable name for your lending circle
            </p>
            <div className="space-y-2">
              <label className="text-sm text-[#787E88]">Circle Name</label>
              <input
                className="input"
                placeholder="e.g., Family Savings, Friends Fund"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              <p className="text-xs text-[#545963]">3-30 characters</p>
            </div>
          </div>
        )}

        {/* Step 2: Contribution Amount */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-[family-name:var(--font-display)] text-[#EDEDED] mb-1">
              Set Contribution
            </h2>
            <p className="text-[#787E88] text-sm mb-6">
              Define contribution amounts and frequency
            </p>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm text-[#787E88]">Contribution Amount (USD)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="50"
                  value={formData.contributionAmount}
                  onChange={(e) =>
                    handleInputChange("contributionAmount", parseInt(e.target.value) || 0)
                  }
                />
                <p className="text-xs text-[#545963]">$10 - $500 per period</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Member Count + Settings */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-[family-name:var(--font-display)] text-[#EDEDED] mb-1">
              Members &amp; Settings
            </h2>
            <p className="text-[#787E88] text-sm mb-6">
              Set member count and start date
            </p>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm text-[#787E88]">Number of Members</label>
                <input
                  type="number"
                  className="input"
                  placeholder="5"
                  value={formData.memberCount}
                  onChange={(e) =>
                    handleInputChange("memberCount", parseInt(e.target.value) || 0)
                  }
                />
                <p className="text-xs text-[#545963]">3 - 10 members</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#787E88]">Start Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
                <p className="text-xs text-[#545963]">At least 3 days from today</p>
              </div>

              {/* Preview */}
              <div className="card-raised p-4">
                <h4 className="text-sm font-medium text-[#EDEDED] mb-3">Circle Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[#545963] text-xs">Pool Size</div>
                    <div className="text-[#EDEDED] font-medium">${totalPoolSize.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[#545963] text-xs">Duration</div>
                    <div className="text-[#EDEDED] font-medium">{formData.memberCount} months</div>
                  </div>
                  <div>
                    <div className="text-[#545963] text-xs">Escrow Required</div>
                    <div className="text-[#EDEDED] font-medium">${formData.contributionAmount} USDC</div>
                  </div>
                  <div>
                    <div className="text-[#545963] text-xs">Collateral</div>
                    <div className="text-[#2DD4A0] font-medium">100%</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-[#D4A843] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[#D4A843]/80 text-xs">
                    Each member deposits ${formData.contributionAmount} USDC as escrow (100% collateral) when joining. This protects all members and is returned after circle completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-[family-name:var(--font-display)] text-[#EDEDED] mb-1">
              Review &amp; Confirm
            </h2>
            <p className="text-[#787E88] text-sm mb-6">
              Confirm your circle details before creating
            </p>

            <div className="card-raised p-4 space-y-3">
              <h4 className="text-sm font-medium text-[#EDEDED]">Circle Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#787E88]">Name</span>
                  <span className="text-[#EDEDED] font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787E88]">Contribution</span>
                  <span className="text-[#EDEDED] font-medium">${formData.contributionAmount}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787E88]">Members</span>
                  <span className="text-[#EDEDED] font-medium">{formData.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787E88]">Pool Size</span>
                  <span className="text-[#EDEDED] font-medium">${totalPoolSize.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787E88]">Duration</span>
                  <span className="text-[#EDEDED] font-medium">{formData.memberCount} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#787E88]">Start Date</span>
                  <span className="text-[#EDEDED] font-medium">
                    {new Date(formData.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="border-t border-white/[0.06] pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-[#787E88]">Escrow Deposit</span>
                    <span className="text-[#2DD4A0] font-medium">${formData.contributionAmount} USDC</span>
                  </div>
                  <p className="text-[#545963] text-xs mt-1">
                    100% collateral - returned after circle completion
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-lg mt-5">
              <p className="text-[#D4A843] text-sm">
                As the organizer, you will receive payout position #1. An invite code will be generated for you to share with other members. Each member must deposit escrow when joining.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/[0.06]">
          <button
            className="btn btn-ghost"
            onClick={step === 1 ? () => router.push("/circles") : prevStep}
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 4 ? (
            <button className="btn btn-accent" onClick={nextStep}>
              Next
            </button>
          ) : (
            <button
              className="btn btn-accent"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Circle"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
