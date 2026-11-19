import { useEffect, useState, type FormEvent } from "react";
import type { ItemDraft, MaterialType } from "../api/types";
import { buildDraft, defaultUnit, readAsDataUrl, type FieldInput } from "../lib";

/** Replaces the form contents whenever a new object arrives (photo analysis). */
export interface Prefill {
  name: string;
  inputs: Record<string, FieldInput>;
  note: string;
  photo: string;
}

interface Props {
  types: MaterialType[];
  onAdd: (draft: ItemDraft) => void;
  prefill?: Prefill | null;
}

export function MaterialForm({ types, onAdd, prefill }: Props) {
  const [name, setName] = useState("");
  const [inputs, setInputs] = useState<Record<string, FieldInput>>({});
  const [deliveryOwn, setDeliveryOwn] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prefill) return;
    setName(prefill.name); setInputs(prefill.inputs); setNote(prefill.note); setPhoto(prefill.photo); setError(null);
  }, [prefill]);

  const type = types.find((t) => t.name === name);

  const setField = (key: string, patch: Partial<FieldInput>, unit = "") =>
    setInputs((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { value: "", unit }), ...patch } }));

  const reset = () => {
    setName(""); setInputs({}); setDeliveryOwn(false); setDeliveryDate(""); setNote(""); setPhoto(undefined);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!type) return setError("Bitte ein Material aus der Liste wählen");
    const draft = buildDraft(type, inputs, {
      delivery_own: deliveryOwn, delivery_date: deliveryDate || undefined, note, photo_data_url: photo,
    });
    if (typeof draft === "string") return setError(draft);
    setError(null);
    onAdd(draft);
    reset();
  };

  return (
    <form className="card form" onSubmit={onSubmit}>
      <label>
        Material
        <input list="material-names" value={name} placeholder={types[0]?.name} onChange={(e) => { setName(e.target.value); setInputs({}); }} />
        <datalist id="material-names">
          {types.map((t) => <option key={t.name} value={t.name}>{t.description}</option>)}
        </datalist>
      </label>
      {type && <p className="muted">{type.description}</p>}

      {type?.fields.map((f) => (
        <label key={f.key}>
          {f.label}{f.unit_label ? ` (${f.unit_label})` : ""}
          <span className="row">
            <input
              inputMode="decimal"
              value={inputs[f.key]?.value ?? ""}
              onChange={(e) => setField(f.key, { value: e.target.value }, defaultUnit(f))}
            />
            {f.units && (
              <select value={inputs[f.key]?.unit ?? defaultUnit(f)} onChange={(e) => setField(f.key, { unit: e.target.value }, defaultUnit(f))}>
                {Object.keys(f.units).map((u) => <option key={u}>{u}</option>)}
              </select>
            )}
          </span>
        </label>
      ))}

      <label className="check">
        <input type="checkbox" checked={deliveryOwn} onChange={(e) => setDeliveryOwn(e.target.checked)} />
        Eigene Anlieferung möglich (sonst: Abholung erforderlich)
      </label>
      <label>
        Lieferdatum (optional)
        <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
      </label>
      <label>
        Notiz
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <label>
        Foto (optional)
        <input type="file" accept="image/*" onChange={async (e) => {
          const file = e.target.files?.[0];
          setPhoto(file ? await readAsDataUrl(file) : undefined);
        }} />
      </label>
      {photo && <img className="preview" src={photo} alt="Vorschau" />}

      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">Zur Liste hinzufügen</button>
    </form>
  );
}
