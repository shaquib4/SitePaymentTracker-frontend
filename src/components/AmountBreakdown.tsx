import React from 'react';

interface AmountBreakdownProps {
  amount: number;
  requestedAmount?: number;
  approvedAmount?: number | null;
  status: string;
  variant?: 'card' | 'table';
  highlightColorClass?: string;
}

export const AmountBreakdown: React.FC<AmountBreakdownProps> = ({
  amount,
  requestedAmount,
  approvedAmount,
  status,
  variant = 'table',
  highlightColorClass = 'text-white',
}) => {
  const numericAmount = Number(amount) || 0;
  const numericRequested = Number(requestedAmount && requestedAmount > 0 ? requestedAmount : numericAmount) || 0;
  const isApprovedOrCompleted = status === 'Approved' || status === 'Completed';
  const effectiveApproved =
    approvedAmount != null
      ? Number(approvedAmount)
      : isApprovedOrCompleted
      ? numericAmount
      : null;

  const isAdjusted = effectiveApproved !== null && Math.abs(effectiveApproved - numericRequested) > 0.009;

  if (variant === 'card') {
    return (
      <div>
        <div className={`text-2xl font-black font-mono ${highlightColorClass}`}>
          ₹{(effectiveApproved !== null ? effectiveApproved : numericRequested).toLocaleString('en-IN')}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono mt-0.5">
          <span className="text-slate-400">
            Requested: <strong className="text-slate-200">₹{numericRequested.toLocaleString('en-IN')}</strong>
          </span>
          {effectiveApproved !== null ? (
            <span className={isAdjusted ? 'text-amber-300 font-semibold' : 'text-emerald-400 font-semibold'}>
              · Approved: ₹{effectiveApproved.toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="text-slate-500">· Approved: —</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono leading-tight">
      <div className={`font-bold text-sm ${highlightColorClass}`}>
        ₹{(effectiveApproved !== null ? effectiveApproved : numericRequested).toLocaleString('en-IN')}
      </div>
      <div className="text-[11px] text-slate-400 mt-0.5 space-y-0.5">
        <div>Req: ₹{numericRequested.toLocaleString('en-IN')}</div>
        {effectiveApproved !== null ? (
          <div className={isAdjusted ? 'text-amber-300 font-semibold' : 'text-emerald-400'}>
            Appr: ₹{effectiveApproved.toLocaleString('en-IN')}
          </div>
        ) : (
          <div className="text-slate-500">Appr: —</div>
        )}
      </div>
    </div>
  );
};
