"use client";

import { useState, useMemo } from "react";
import { Calculator, Calendar, Landmark, Percent } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { calculateInterest, formatCurrency, formatDuration } from "@/lib/calculations";

export function InterestCalculatorModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [principal, setPrincipal] = useState<string>("");
  const [shekdaRate, setShekdaRate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [asOf, setAsOf] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const results = useMemo(() => {
    const p = parseFloat(principal);
    const r = parseFloat(shekdaRate);
    const start = new Date(startDate);
    const end = new Date(asOf);

    if (isNaN(p) || isNaN(r) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null;
    }

    return calculateInterest(p, r, start, end);
  }, [principal, shekdaRate, startDate, asOf]);

  const handleClose = () => {
    setIsOpen(false);
    // Reset fields if desired, but keeping them might be useful for quick adjustments
  };

  return (
    <>
     <Button
  variant="secondary" // Use an allowed type like "secondary", "ghost", or "default"
  onClick={() => setIsOpen(true)}
  className="flex items-center gap-2"
>


      <Modal open={isOpen} onClose={handleClose} title="Quick Interest Calculator">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Principal Amount"
              type="number"
              placeholder="e.g. 10000"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              icon={<Landmark className="h-4 w-4 text-slate-400" />}
            />
            <Input
              label="Shekda Rate (Monthly %)"
              type="number"
              step="0.01"
              placeholder="e.g. 2.0"
              value={shekdaRate}
              onChange={(e) => setShekdaRate(e.target.value)}
              icon={<Percent className="h-4 w-4 text-slate-400" />}
            />
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

              <p className="mt-4 text-center text-[10px] text-slate-400">
                * Based on monthly shekda rate (30 days per month for partial calculation).
              </p>
            </div>
          )}

          {!results && (principal || shekdaRate) && (
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
                setShekdaRate("");
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
