"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { trackLeadGeneration } from "@/lib/gtag";

const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Ad soyad en az 2 karakter olmalıdır")
    .max(100, "Ad soyad en fazla 100 karakter olabilir"),
  company: z
    .string()
    .min(2, "Şirket adı en az 2 karakter olmalıdır")
    .max(100, "Şirket adı en fazla 100 karakter olabilir"),
  email: z
    .string()
    .email("Geçerli bir e-posta adresi giriniz"),
  phone: z
    .string()
    .min(10, "Telefon numarası en az 10 karakter olmalıdır")
    .max(20, "Telefon numarası en fazla 20 karakter olabilir")
    .optional()
    .or(z.literal("")),
  message: z
    .string()
    .min(20, "Mesajınız en az 20 karakter olmalıdır")
    .max(2000, "Mesajınız en fazla 2000 karakter olabilir"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactForm() {
  const t = useTranslations("contact.form");
  const locale = useLocale();
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setSubmitStatus("loading");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        reset();
        trackLeadGeneration("contact_form");
        setTimeout(() => setSubmitStatus("idle"), 6000);
      } else {
        setSubmitStatus("error");
        setTimeout(() => setSubmitStatus("idle"), 5000);
      }
    } catch {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }
  };

  if (submitStatus === "success") {
    return (
      <div
        className="flex flex-col items-center justify-center text-center p-12 rounded-xl"
        style={{
          backgroundColor: "rgba(0, 179, 54, 0.05)",
          border: "1px solid rgba(0, 179, 54, 0.2)",
        }}
      >
        <CheckCircle2
          className="w-16 h-16 mb-4"
          style={{ color: "#00b336" }}
          aria-hidden="true"
        />
        <h3
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--color-on-surface)" }}
        >
          {locale === "tr" ? "Mesajınız İletildi!" : "Message Sent!"}
        </h3>
        <p style={{ color: "var(--color-on-surface-variant)" }}>
          {t("success")}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="İletişim formu"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name */}
        <div>
          <label
            htmlFor="contact-name"
            className="block text-sm font-medium mb-2"
            style={{
              fontFamily: "var(--font-family-label)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            {t("name")} <span aria-label="zorunlu alan" style={{ color: "#ff4444" }}>*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            className={`form-input ${errors.name ? "error" : ""}`}
            aria-describedby={errors.name ? "name-error" : undefined}
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p
              id="name-error"
              role="alert"
              className="mt-1.5 text-xs flex items-center gap-1"
              style={{ color: "#ff4444" }}
            >
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Company */}
        <div>
          <label
            htmlFor="contact-company"
            className="block text-sm font-medium mb-2"
            style={{
              fontFamily: "var(--font-family-label)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            {t("company")} <span aria-label="zorunlu alan" style={{ color: "#ff4444" }}>*</span>
          </label>
          <input
            id="contact-company"
            type="text"
            autoComplete="organization"
            placeholder={t("companyPlaceholder")}
            className={`form-input ${errors.company ? "error" : ""}`}
            aria-describedby={errors.company ? "company-error" : undefined}
            aria-invalid={!!errors.company}
            {...register("company")}
          />
          {errors.company && (
            <p
              id="company-error"
              role="alert"
              className="mt-1.5 text-xs flex items-center gap-1"
              style={{ color: "#ff4444" }}
            >
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {errors.company.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="contact-email"
            className="block text-sm font-medium mb-2"
            style={{
              fontFamily: "var(--font-family-label)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            {t("email")} <span aria-label="zorunlu alan" style={{ color: "#ff4444" }}>*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className={`form-input ${errors.email ? "error" : ""}`}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="mt-1.5 text-xs flex items-center gap-1"
              style={{ color: "#ff4444" }}
            >
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="contact-phone"
            className="block text-sm font-medium mb-2"
            style={{
              fontFamily: "var(--font-family-label)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            {t("phone")}
          </label>
          <input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            className={`form-input ${errors.phone ? "error" : ""}`}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && (
            <p
              id="phone-error"
              role="alert"
              className="mt-1.5 text-xs flex items-center gap-1"
              style={{ color: "#ff4444" }}
            >
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Message */}
        <div className="sm:col-span-2">
          <label
            htmlFor="contact-message"
            className="block text-sm font-medium mb-2"
            style={{
              fontFamily: "var(--font-family-label)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            {t("message")} <span aria-label="zorunlu alan" style={{ color: "#ff4444" }}>*</span>
          </label>
          <textarea
            id="contact-message"
            rows={5}
            placeholder={t("messagePlaceholder")}
            className={`form-input resize-none ${errors.message ? "error" : ""}`}
            aria-describedby={errors.message ? "message-error" : undefined}
            aria-invalid={!!errors.message}
            style={{ resize: "vertical" }}
            {...register("message")}
          />
          {errors.message && (
            <p
              id="message-error"
              role="alert"
              className="mt-1.5 text-xs flex items-center gap-1"
              style={{ color: "#ff4444" }}
            >
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {errors.message.message}
            </p>
          )}
        </div>
      </div>

      {/* Error Status */}
      {submitStatus === "error" && (
        <div
          className="mt-4 p-4 rounded flex items-center gap-2 text-sm"
          role="alert"
          style={{
            backgroundColor: "rgba(255, 68, 68, 0.1)",
            border: "1px solid rgba(255, 68, 68, 0.2)",
            color: "#ff4444",
          }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          {t("error")}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitStatus === "loading"}
        className="btn-primary mt-6 w-full sm:w-auto justify-center text-sm px-8 py-3"
        style={{
          opacity: submitStatus === "loading" ? 0.7 : 1,
          cursor: submitStatus === "loading" ? "not-allowed" : "pointer",
        }}
        aria-busy={submitStatus === "loading"}
      >
        {submitStatus === "loading" ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {t("sending")}
          </>
        ) : (
          <>
            <Send className="w-4 h-4" aria-hidden="true" />
            {t("submit")}
          </>
        )}
      </button>
    </form>
  );
}
