"use client";

import React from "react";
import { AddressDisplay } from "./address-display";

interface Contract {
  name: string;
  address: string;
  description: string;
}

interface ContractTableProps {
  contracts: Contract[];
}

export function ContractTable({ contracts }: ContractTableProps) {
  return (
    <div className="bg-[#111827] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header row — desktop only */}
      <div className="hidden md:grid md:grid-cols-[1fr_1.5fr_100px] px-6 py-3 border-b border-white/[0.08]">
        <span className="text-xs uppercase tracking-wider text-neutral-500">
          Contract
        </span>
        <span className="text-xs uppercase tracking-wider text-neutral-500">
          Address
        </span>
        <span className="text-xs uppercase tracking-wider text-neutral-500 text-right">
          Status
        </span>
      </div>

      {/* Rows */}
      {contracts.map((contract, index) => {
        const stellarExpertUrl = `https://stellar.expert/explorer/testnet/contract/${contract.address}`;

        return (
          <div
            key={contract.address}
            className={`group px-6 py-4 transition-colors duration-150 hover:bg-white/[0.03] ${
              index < contracts.length - 1 ? "border-b border-white/[0.08]" : ""
            }`}
          >
            {/* Desktop layout */}
            <div className="hidden md:grid md:grid-cols-[1fr_1.5fr_100px] items-center">
              <div className="transition-transform duration-150 group-hover:translate-x-1">
                <span className="font-semibold text-white text-sm">
                  {contract.name}
                </span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {contract.description}
                </p>
              </div>

              <div className="min-w-0">
                <AddressDisplay
                  address={contract.address}
                  href={stellarExpertUrl}
                />
              </div>

              <div className="flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-400">Active</span>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="md:hidden relative">
              <div className="flex items-start justify-between">
                <div className="transition-transform duration-150 group-hover:translate-x-1">
                  <span className="font-semibold text-white text-sm">
                    {contract.name}
                  </span>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {contract.description}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/10 shrink-0 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">
                    Active
                  </span>
                </span>
              </div>

              <div className="mt-2">
                <AddressDisplay
                  address={contract.address}
                  href={stellarExpertUrl}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
