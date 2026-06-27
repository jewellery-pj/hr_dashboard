import React from 'react';
import { OffTargetRow } from '../utils/offTarget';
import {
  OperationalSection,
  OperationalTableWrap,
  OperationalTable,
  OperationalThead,
  OperationalTh,
} from './OperationalLayout';

interface OffTargetPanelProps {
  title?: string;
  subtitle?: string;
  rows: OffTargetRow[];
  emptyLabel?: string;
  showEntity?: boolean;
  bodyClassName?: string;
}

export function OffTargetPanel({
  title = 'Off Target',
  subtitle,
  rows,
  emptyLabel,
  showEntity = true,
  bodyClassName = 'p-0',
}: OffTargetPanelProps) {
  const resolvedSubtitle = subtitle ?? (rows.length > 0 ? `${rows.length} metric(s)` : emptyLabel ?? 'All metrics on target');

  return (
    <OperationalSection title={title} subtitle={resolvedSubtitle} bodyClassName={bodyClassName}>
      <OperationalTableWrap>
        <OperationalTable>
          <OperationalThead>
            {showEntity && <OperationalTh>Entity</OperationalTh>}
            <OperationalTh>Metric</OperationalTh>
            <OperationalTh align="right">Now</OperationalTh>
            <OperationalTh align="right">Target</OperationalTh>
            <OperationalTh>Gap</OperationalTh>
          </OperationalThead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={showEntity ? 5 : 4} className="px-4 py-6 text-center text-sm text-slate-500">
                  {emptyLabel ?? 'No metrics off target'}
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id} className="border-t border-slate-100">
                  {showEntity && (
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">{row.entity ?? '—'}</td>
                  )}
                  <td className="px-4 py-3 text-sm font-bold text-slate-800">{row.metric}</td>
                  <td className="px-4 py-3 text-right text-sm font-black tabular-nums">{row.now}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{row.target}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-rose-700">{row.gap}</td>
                </tr>
              ))
            )}
          </tbody>
        </OperationalTable>
      </OperationalTableWrap>
    </OperationalSection>
  );
}
