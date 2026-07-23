"use client";

import { PREDEFINED_PROFILES } from "@/lib/companyProfiles";
import { CompanyProfile } from "@/lib/types";

const CUSTOM_ID = "vlastiti";

const EMPTY_CUSTOM_PROFILE: CompanyProfile = {
  id: CUSTOM_ID,
  naziv: "Vlastiti profil",
  djelatnost: "",
  brojZaposlenih: "",
  zupanija: "",
  reference: "",
};

interface Props {
  selectedId: string;
  customProfile: CompanyProfile;
  onSelectId: (id: string) => void;
  onCustomProfileChange: (profile: CompanyProfile) => void;
  disabled?: boolean;
}

export { CUSTOM_ID, EMPTY_CUSTOM_PROFILE };

export default function ProfileSelector({
  selectedId,
  customProfile,
  onSelectId,
  onCustomProfileChange,
  disabled,
}: Props) {
  const isCustom = selectedId === CUSTOM_ID;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">Profil tvrtke</label>
      <select
        value={selectedId}
        disabled={disabled}
        onChange={(e) => onSelectId(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-tendra-purple focus:outline-none focus:ring-1 focus:ring-tendra-purple disabled:opacity-50"
      >
        {PREDEFINED_PROFILES.map((p) => (
          <option key={p.id} value={p.id}>
            {p.naziv}
          </option>
        ))}
        <option value={CUSTOM_ID}>Vlastiti profil...</option>
      </select>

      {isCustom && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <Field
            label="Djelatnost"
            value={customProfile.djelatnost}
            disabled={disabled}
            onChange={(v) => onCustomProfileChange({ ...customProfile, djelatnost: v })}
            placeholder="npr. prerada drva"
          />
          <Field
            label="Broj zaposlenih"
            value={customProfile.brojZaposlenih}
            disabled={disabled}
            onChange={(v) => onCustomProfileChange({ ...customProfile, brojZaposlenih: v })}
            placeholder="npr. 7"
          />
          <Field
            label="Županija"
            value={customProfile.zupanija}
            disabled={disabled}
            onChange={(v) => onCustomProfileChange({ ...customProfile, zupanija: v })}
            placeholder="npr. Varaždinska županija"
          />
          <Field
            label="Kratke reference"
            value={customProfile.reference}
            disabled={disabled}
            onChange={(v) => onCustomProfileChange({ ...customProfile, reference: v })}
            placeholder="npr. posluje 4 god., bez ranijih potpora"
            textarea
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  textarea?: boolean;
}) {
  const commonProps = {
    value,
    disabled,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className:
      "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-tendra-purple focus:outline-none focus:ring-1 focus:ring-tendra-purple disabled:opacity-50",
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {textarea ? <textarea rows={2} {...commonProps} /> : <input type="text" {...commonProps} />}
    </div>
  );
}
