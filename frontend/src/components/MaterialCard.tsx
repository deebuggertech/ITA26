import type { ReactNode } from "react";
import { describeDimensions } from "../lib";

export interface CardItem {
  material: string;
  length_cm?: number | null;
  width_cm?: number | null;
  thickness_cm?: number | null;
  diameter_cm?: number | null;
  weight_kg?: number | null;
  quantity: number;
  remaining?: number;
  delivery_own: boolean;
  delivery_date?: string | null;
  note: string;
  photo?: string | null;
  supplier_name?: string;
}

interface Props {
  item: CardItem;
  badge?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

/** Shared by supplier staging list, offer result and the Regnauer dashboard. */
export function MaterialCard({ item, badge, actions, footer }: Props) {
  const dims = describeDimensions({
    length_cm: item.length_cm ?? null, width_cm: item.width_cm ?? null, thickness_cm: item.thickness_cm ?? null,
    diameter_cm: item.diameter_cm ?? null, weight_kg: item.weight_kg ?? null,
  });
  return (
    <article className="card item">
      {item.photo && <img className="thumb" src={item.photo} alt={item.material} />}
      <div className="item-body">
        <div className="item-head">
          <strong>{item.quantity} × {item.material}</strong>
          {badge}
        </div>
        <div className="muted">
          {[dims, item.supplier_name,
            item.remaining !== undefined && item.remaining !== item.quantity ? `${item.remaining} übrig` : ""]
            .filter(Boolean).join(" · ")}
        </div>
        <div className="muted">
          {item.delivery_own ? "Eigene Anlieferung möglich" : "Abholung erforderlich"}
          {item.delivery_date ? ` · ${item.delivery_date}` : ""}
        </div>
        {item.note && <div>{item.note}</div>}
        {footer}
      </div>
      {actions && <div className="item-actions">{actions}</div>}
    </article>
  );
}
