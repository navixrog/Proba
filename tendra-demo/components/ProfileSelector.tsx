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

export function isCustomProfileComplete(profile: CompanyProfile): boolean {
  return Boolean(profile.djelatnost.trim() && profile.brojZaposlenih.trim() && profile.zupanija.trim());
}

interface Props {
  selectedId: string;
  customProfile: CompanyProfile;
  onSelectId: (id: string) => void;
  onCustomProfileChange: (profile: CompanyProfile) => void;
  disabled?: boolean;
  showValidation?: boolean;
}

export { CUSTOM_ID, EMPTY_CUSTOM_PROFILE };

export default function ProfileSelector({
  selectedId,
  customProfile,
  onSelectId,
  onCustomProfileChange,
  disabled,
  showValidation,
}: Props) {
  const isCustom = selectedId === CUSTOM_ID;
  const predefined = PREDEFINED_PROFILES.find((p) => p.id === selectedId);

  return (
    <div className="space-y-3">
      <label htmlFor="profile-select" className="block text-sm font-semibold text-slate-700">
        Profil tvrtke
      </label>
      <select
        id="profile-select"
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

      {isCustom ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Djelatnost"
              required
              value={customProfile.djelatnost}
              disabled={disabled}
              invalid={showValidation && !customProfile.djelatnost.trim()}
              onChange={(v) => onCustomProfileChange({ ...customProfile, djelatnost: v })}
              placeholder="npr. prerada drva"
            />
            <Field
              label="Broj zaposlenih"
              required
              value={customProfile.brojZaposlenih}
              disabled={disabled}
              invalid={showValidation && !customProfile.brojZaposlenih.trim()}
              onChange={(v) => onCustomProfileChange({ ...customProfile, brojZaposlenih: v })}
              placeholder="npr. 7"
            />
            <Field
              label="Županija"
              required
              value={customProfile.zupanija}
              disabled={disabled}
              invalid={showValidation && !customProfile.zupanija.trim()}
              onChange={(v) => onCustomProfileChange({ ...customProfile, zupanija: v })}
              placeholder="npr. Varaždinska županija"
            />
            <Field
              label="Kratke reference (nije obavezno)"
              value={customProfile.reference}
              disabled={disabled}
              onChange={(v) => onCustomProfileChange({ ...customProfile, reference: v })}
              placeholder="npr. posluje 4 god., bez ranijih potpora"
              textarea
            />
          </div>
          {showValidation && !isCustomProfileComplete(customProfile) && (
            <p className="mt-3 text-xs font-medium text-tendra-red">
              Popunite djelatnost, broj zaposlenih i županiju prije analize.
            </p>
          )}
        </div>
      ) : (
        predefined && (
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <ProfileRow label="Djelatnost" value={predefined.djelatnost} />
            <ProfileRow label="Broj zaposlenih" value={predefined.brojZaposlenih} />
            <ProfileRow label="Županija" value={predefined.zupanija} />
            <ProfileRow label="Reference" value={predefined.reference} />
          </dl>
        )
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
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
  required,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  textarea?: boolean;
  required?: boolean;
  invalid?: boolean;
}) {
  const id = `custom-profile-${label.replace(/\s+/g, "-").toLowerCase()}`;
  const commonProps = {
    id,
    value,
    disabled,
    placeholder,
    "aria-required": required,
    "aria-invalid": invalid,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(e.target.value),
    className: `w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 disabled:opacity-50 ${
      invalid
        ? "border-tendra-red focus:border-tendra-red focus:ring-tendra-red"
        : "border-slate-300 focus:border-tendra-purple focus:ring-tendra-purple"
    }`,
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-500">
        {label}
        {required && <span className="text-tendra-red"> *</span>}
      </label>
      {textarea ? <textarea rows={2} {...commonProps} /> : <input type="text" {...commonProps} />}
    </div>
  );
}
