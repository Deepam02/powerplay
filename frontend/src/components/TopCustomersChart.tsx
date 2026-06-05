import type { SummaryData } from '../types';

interface Props {
  customers: SummaryData['top5Customers'];
}

export function TopCustomersChart({ customers }: Props) {
  if (customers.length === 0) return null;

  const max = Math.max(...customers.map((c) => c.totalBilled));
  const BAR_MAX = 280;
  const ROW_H = 36;
  const LABEL_W = 130;
  const VALUE_W = 80;
  const SVG_W = LABEL_W + BAR_MAX + VALUE_W + 20;
  const SVG_H = customers.length * ROW_H + 10;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full"
      role="img"
      aria-label="Top 5 customers by total billed"
    >
      {customers.map((c, i) => {
        const barW = max === 0 ? 0 : (c.totalBilled / max) * BAR_MAX;
        const y = i * ROW_H + 6;
        return (
          <g key={c._id}>
            <text
              x={LABEL_W - 8}
              y={y + 14}
              textAnchor="end"
              fontSize={11}
              fill="#374151"
              className="font-medium"
            >
              {c.customerName.length > 18
                ? c.customerName.slice(0, 17) + '…'
                : c.customerName}
            </text>
            <rect
              x={LABEL_W}
              y={y}
              width={barW}
              height={20}
              rx={4}
              fill="#818cf8"
            />
            <text
              x={LABEL_W + barW + 8}
              y={y + 14}
              fontSize={10}
              fill="#6b7280"
            >
              ₹{(c.totalBilled / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}
    </svg>
  );
}
