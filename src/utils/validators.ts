import validator from 'validator';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { differenceInYears } from 'date-fns';

export const isValidEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const isValidPhone = (phone: string, country: string = 'US'): boolean => {
  try {
    return isValidPhoneNumber(phone, country as any);
  } catch {
    return false;
  }
};

export const formatPhone = (phone: string, country: string = 'US'): string => {
  try {
    const parsed = parsePhoneNumber(phone, country as any);
    return parsed?.formatInternational() || phone;
  } catch {
    return phone;
  }
};

export const isValidAge = (dateOfBirth: string, minAge: number = 13): boolean => {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const age = differenceInYears(new Date(), dob);
  return age >= minAge;
};

export const isValidURL = (url: string): boolean => {
  return validator.isURL(url);
};

export const isValidCreditCard = (cardNumber: string): boolean => {
  return validator.isCreditCard(cardNumber);
};

export const isValidPostalCode = (code: string, country: string): boolean => {
  switch (country) {
    case 'US':
      return validator.isPostalCode(code, 'US');
    case 'CA':
      return validator.isPostalCode(code, 'CA');
    case 'GB':
      return validator.isPostalCode(code, 'GB');
    default:
      return code.length > 0;
  }
};

export const isValidEIN = (ein: string): boolean => {
  return /^\d{2}-\d{7}$/.test(ein);
};
