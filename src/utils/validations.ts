// utils/validators.ts
export const isValidPhone = (phone: string) => /^\d{10}$/.test(phone);
