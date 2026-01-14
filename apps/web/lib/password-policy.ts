import { z } from "zod";

export const defaultPasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

export type PasswordPolicy = typeof defaultPasswordPolicy;

const passwordPolicySchema = z.object({
  minLength: z.number().int().min(6).max(64),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSpecial: z.boolean(),
});

export function resolvePasswordPolicy(raw?: string | null) {
  if (!raw) return defaultPasswordPolicy;
  try {
    const parsed = JSON.parse(raw);
    const result = passwordPolicySchema.partial().safeParse(parsed);
    if (!result.success) return defaultPasswordPolicy;
    return {
      ...defaultPasswordPolicy,
      ...result.data,
    };
  } catch {
    return defaultPasswordPolicy;
  }
}

export function validatePasswordWithPolicy(password: string, policy: PasswordPolicy) {
  if (!password) return "Access key required";
  if (password.length < policy.minLength) {
    return `Key entropy too low (min ${policy.minLength} chars)`;
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return "Requires uppercase signal";
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    return "Requires lowercase signal";
  }
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    return "Requires numeric signal";
  }
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    return "Requires special signal";
  }
  return null;
}

export function buildPasswordRequirements(policy: PasswordPolicy, value: string) {
  return [
    { label: `${policy.minLength}+ Characters`, valid: value.length >= policy.minLength },
    { label: "Uppercase", valid: !policy.requireUppercase || /[A-Z]/.test(value) },
    { label: "Lowercase", valid: !policy.requireLowercase || /[a-z]/.test(value) },
    { label: "Number", valid: !policy.requireNumber || /[0-9]/.test(value) },
    { label: "Special", valid: !policy.requireSpecial || /[^A-Za-z0-9]/.test(value) },
  ];
}
