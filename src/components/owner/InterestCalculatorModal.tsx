"use client";

import { useState, useMemo } from "react";
import { Calculator, Calendar, Landmark, Percent, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { calculateInterest, formatCurrency, formatDuration } from "@/lib/calculations";
import type { InterestMethod, CompoundFrequency } from "@/types";

export function InterestCalculatorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<InterestMethod>("shekda_simple");
  const [principal, setPrincipal] = useState<string>("");
  const [rate, setRate] = useState<string>("");
  const [frequency, setFrequency] = useState<CompoundFrequency>("quarterly");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [asOf, setAsOf] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const results = useMemo(() => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const start = new Date(startDate);
    const end = new Date(asOf);

    if (isNaN(p) || isNaN(r) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }

    return calculateInterest(
      {
        principal: p,
        startDate: start,
        method: method,
        shekdaRate: method.startsWith("shekda") ? r : 0,
        annualRate: method.startsWith("fd") ? r : 0,
        frequency: frequency,
      },
      end
    );
  }, [principal, rate, startDate, asOf, method, frequency]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Calculator className="h-4 w-4" />
        Interest Calculator
      </Button>

      <Modal open={isOpen} onClose={handleClose} title="Quick Interest Calculator">
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "shekda_simple", label: "Shekda Simple" },
              { id: "shekda_compound", label: "Shekda Compound" },
              { id: "fd_compound", label: "Bank FD" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id as InterestMethod)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  method === m.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Principal Amount"
              type="number"
              placeholder="e.g. 100000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              icon={<Landmark className="h-4 w-4 text-slate-400" />}
            />
            <Input
              label={method.startsWith("fd") ? "Annual Rate (%)" : "Shekda Rate (Monthly %)"}
              type="number"
              step="0.01"
              placeholder="e.g. 8.4"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              icon={<Percent className="h-4 w-4 text-slate-400" />}
            />

            {method === "fd_compound" && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Compounding Frequency
                </label>
                <div className="relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 text-slate-400" />
                   </div>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as CompoundFrequency)}
                    className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            )}

            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              icon={<Calendar className="h-4 w-4 text-slate-400" />}
            />
            <Input
              label="End Date (As Of)"
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              icon={<Calendar className="h-4 w-4 text-slate-400" />}
            />
          </div>

          {results && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-800">
                Calculation Breakdown
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                  <span className="text-slate-600 text-sm">Duration</span>
                  <span className="font-medium text-slate-900 text-sm">
                    {formatDuration(results.years, results.months, results.days)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                  <span className="text-slate-600 text-sm">Base Principal</span>
                  <span className="font-medium text-slate-900 text-sm">
                    {formatCurrency(parseFloat(principal))}
                  </span>
                </div>

                <div className="flex justify-between border-b border-emerald-100/50 pb-2">
                  <span className="text-slate-600 text-sm">Total Interest</span>
                  <span className="font-semibold text-emerald-700 text-sm">
                    + {formatCurrency(results.totalInterest)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-base font-bold text-slate-900">Grand Total</span>
                  <span className="text-xl font-bold text-emerald-600">
                    {formatCurrency(results.grandTotal)}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-center text-[10px] text-slate-400 italic leading-relaxed">
                * {method === "shekda_simple" ? "Simple monthly interest (30 days/month)" : 
                  method === "shekda_compound" ? "Compounded monthly" : 
                  `FD Compounded ${frequency.replace("_", " ")}`}
              </p>
            </div>
          )}

          {!results && (principal || rate) && (
            <div className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500 italic">
              Please enter valid values to see the calculation.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setPrincipal("");
                setRate("");
                setStartDate(new Date().toISOString().split("T")[0]);
                setAsOf(new Date().toISOString().split("T")[0]);
              }}
              variant="outline"
              className="text-slate-600 border-slate-200"
            >
              Reset
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
