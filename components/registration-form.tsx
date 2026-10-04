"use client";

import { useState } from "react";
import { registrationSchema, type Registrant } from "@/lib/registrants";
import { registerParticipant } from "@/lib/api-client";

type Props = {
  eventId: string;
  onSuccess: (registrant: Registrant) => void;
};

type FieldErrors = Partial<Record<"name" | "email" | "phone", string>>;

export function RegistrationForm({ eventId, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const parsed = registrationSchema.safeParse({ name, email, phone });
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !fe[key]) fe[key] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    try {
      const registrant = await registerParticipant({
        event_id: eventId,
        ...parsed.data,
        institution: null,
      });
      onSuccess(registrant);
      setName("");
      setEmail("");
      setPhone("");
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Registrasi gagal. Coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Field
        label="Nama Lengkap"
        error={errors.name}
        value={name}
        onChange={setName}
        placeholder="Contoh: Ayu Lestari"
        autoComplete="name"
      />
      <Field
        label="Email"
        type="email"
        error={errors.email}
        value={email}
        onChange={setEmail}
        placeholder="nama@email.com"
        autoComplete="email"
      />
      <Field
        label="No. Telepon"
        type="tel"
        error={errors.phone}
        value={phone}
        onChange={setPhone}
        placeholder="08xxxxxxxxxx"
        autoComplete="tel"
      />

      {serverError && (
        <p className="inline-block rounded-sm border-2 border-ink bg-tangerine px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-ink">
          ⚠ {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="brutal-btn-magenta w-full text-base sm:text-lg"
      >
        {submitting ? "Mencap tiket..." : "Daftar & Cetak Tiket"}
        <span aria-hidden>→</span>
      </button>

      <p className="text-xs text-ink/50">
        Dengan mendaftar, kamu setuju tiket hanya dipakai sekali saat check-in.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="brutal-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`brutal-input ${
          error ? "ring-4 ring-magenta/30 focus:ring-magenta/60" : ""
        }`}
        aria-invalid={!!error}
      />
      {error && (
        <p className="mt-2 inline-block rounded-sm border-2 border-ink bg-tangerine px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wider text-ink">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}