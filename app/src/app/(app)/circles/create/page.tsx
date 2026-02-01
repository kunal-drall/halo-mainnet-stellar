"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FormData {
  name: string;
  contributionAmount: number;
  memberCount: number;
  startDate: string;
}

export default function CreateCirclePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    contributionAmount: 50,
    memberCount: 5,
    startDate: getDefaultStartDate(),
  });

  function getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default to 7 days from now
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create circle");
      }

      const data = await response.json();
      router.push(`/circles/${data.circle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const totalPoolSize = formData.contributionAmount * formData.memberCount;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/circles")}
          className="mb-4 p-0 h-auto"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Circles
        </Button>
        <h1 className="text-2xl font-bold text-white">Create a Circle</h1>
        <p className="text-neutral-400 mt-1">
          Set up a new lending circle for your community
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? "bg-white text-black"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-white/10 text-neutral-400"
              }`}
            >
              {s < step ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-0.5 mx-2 ${
                  s < step ? "bg-green-500" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <Card variant="glass" className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg text-white">
                Name Your Circle
              </CardTitle>
              <p className="text-neutral-400 text-sm mt-1">
                Choose a memorable name for your lending circle
              </p>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <Input
                label="Circle Name"
                placeholder="e.g., Family Savings, Friends Fund"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                hint="3-30 characters"
              />
            </CardContent>
          </>
        )}

        {/* Step 2: Parameters */}
        {step === 2 && (
          <>
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg text-white">
                Set Parameters
              </CardTitle>
              <p className="text-neutral-400 text-sm mt-1">
                Define contribution amounts and member count
              </p>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <Input
                type="number"
                label="Contribution Amount (USD)"
                placeholder="50"
                value={formData.contributionAmount}
                onChange={(e) =>
                  handleInputChange(
                    "contributionAmount",
                    parseInt(e.target.value) || 0
                  )
                }
                hint="$10 - $500 per period"
              />

              <Input
                type="number"
                label="Number of Members"
                placeholder="5"
                value={formData.memberCount}
                onChange={(e) =>
                  handleInputChange(
                    "memberCount",
                    parseInt(e.target.value) || 0
                  )
                }
                hint="3 - 10 members"
              />

              {/* Preview */}
              <div className="p-4 bg-white/5 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-3">
                  Circle Preview
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-neutral-500">Pool Size</div>
                    <div className="text-white font-medium">
                      ${totalPoolSize.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-500">Duration</div>
                    <div className="text-white font-medium">
                      {formData.memberCount} months
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <>
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg text-white">
                Review & Create
              </CardTitle>
              <p className="text-neutral-400 text-sm mt-1">
                Confirm your circle details and set the start date
              </p>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <Input
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                hint="At least 3 days from today"
              />

              {/* Summary */}
              <div className="p-4 bg-white/5 rounded-lg space-y-4">
                <h4 className="text-sm font-medium text-white">
                  Circle Summary
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Name</span>
                    <span className="text-white font-medium">
                      {formData.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Contribution</span>
                    <span className="text-white font-medium">
                      ${formData.contributionAmount}/month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Members</span>
                    <span className="text-white font-medium">
                      {formData.memberCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Pool Size</span>
                    <span className="text-white font-medium">
                      ${totalPoolSize.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Duration</span>
                    <span className="text-white font-medium">
                      {formData.memberCount} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Start Date</span>
                    <span className="text-white font-medium">
                      {new Date(formData.startDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  As the organizer, you will receive payout position #1. An
                  invite code will be generated for you to share with other
                  members.
                </p>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={step === 1 ? () => router.push("/circles") : prevStep}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 3 ? (
            <Button onClick={nextStep}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Circle"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
