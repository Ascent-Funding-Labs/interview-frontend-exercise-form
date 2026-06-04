import React, { useState, useEffect, useRef, useCallback } from 'react';
import './UserRegistrationForm.css';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { z } from 'zod';
import { debounce, isEmpty, pick, omit } from 'lodash';
import { format, parseISO, differenceInYears } from 'date-fns';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import validator from 'validator';
import axios from 'axios';
import { toast } from 'react-toastify';
import { userValidationSchema } from './schemas/userSchema';
import { isValidEmail, formatPhone, isValidAge } from './utils/validators';
import { checkEmailAvailability, submitRegistration } from './utils/api';
import { showSuccess, showError } from './utils/notifications';
import { useFormValidation } from './hooks/useFormValidation';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type SecurityQuestion = {
  question: string;
  answer: string;
};

enum AccountType {
  Personal = 'personal',
  Business = 'business',
  Enterprise = 'enterprise'
}

export const UserRegistrationForm: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');

  const [address, setAddress] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    jobTitle: '',
    department: '',
    employeeId: '',
    yearsAtCompany: '',
    workEmail: '',
    workPhone: ''
  });

  const [billing_same_as_address, set_billing_same_as_address] = useState(true);
  const [billing_address, set_billing_address] = useState('');
  const [billing_address2, set_billing_address2] = useState('');
  const [billing_country, set_billing_country] = useState('');
  const [billing_state, set_billing_state] = useState('');
  const [billing_city, set_billing_city] = useState('');
  const [billing_zip, set_billing_zip] = useState('');

  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactEmail, setEmergencyContactEmail] = useState('');

  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);

  const [accountType, setAccountType] = useState<AccountType>(AccountType.Personal);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessSize, setBusinessSize] = useState('');
  const [industry, setIndustry] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');

  const [enterpriseId, setEnterpriseId] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [contractDuration, setContractDuration] = useState('');
  const [seatCount, setSeatCount] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [phoneError, setPhoneError] = useState('');
  const [dateOfBirthError, setDateOfBirthError] = useState('');

  const [addressError, setAddressError] = useState('');
  const [zipCodeError, setZipCodeError] = useState('');

  const [companyErrors, setCompanyErrors] = useState({
    companyName: '',
    jobTitle: '',
    workEmail: ''
  });

  const [billing_errors, set_billing_errors] = useState({
    billing_address: '',
    billing_zip: ''
  });

  const [emergencyErrors, setEmergencyErrors] = useState<Record<string, string>>({});

  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  const [termsError, setTermsError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [showAddressSection, setShowAddressSection] = useState(true);
  const [showCompanySection, setShowCompanySection] = useState(true);
  const [showBillingSection, setShowBillingSection] = useState(true);
  const [showEmergencySection, setShowEmergencySection] = useState(true);

  const [passwordStrength, setPasswordStrength] = useState(0);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors: rhfErrors },
    control,
    watch,
    setValue: rhfSetValue,
    reset: rhfReset,
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
    }
  });

  const formValidation = useFormValidation({
    firstName: '',
    lastName: '',
    email: '',
  });

  const debouncedCheckEmail = useCallback(
    debounce(async (emailValue: string) => {
      if (!emailValue) return;
      const available = await checkEmailAvailability(emailValue);
      console.log('Email available:', available);
    }, 500),
    []
  );

  const watchedFirstName = watch('firstName');
  const watchedEmail = watch('email');

  const validateFirstName = (value: string) => {
    if (!value) {
      setFirstNameError('First name is required');
      return false;
    }
    if (value.length < 2) {
      setFirstNameError('First name must be at least 2 characters');
      return false;
    }
    setFirstNameError('');
    return true;
  };

  const validateLastName = (value: string) => {
    if (!value || value.trim() === '') {
      setLastNameError('Last name is required');
      return false;
    } else if (value.length < 2) {
      setLastNameError('Last name must be at least 2 characters');
      return false;
    } else if (value.length > 50) {
      setLastNameError('Last name is too long');
      return false;
    } else {
      setLastNameError('');
      return true;
    }
  };

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('Password is required');
      setPasswordStrength(0);
      return false;
    }

    let strength = 0;

    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      setPasswordStrength(1);
      return false;
    }
    strength++;

    if (!/[A-Z]/.test(value)) {
      setPasswordError('Password must contain at least one uppercase letter');
      setPasswordStrength(strength);
      return false;
    }
    strength++;

    if (!/[a-z]/.test(value)) {
      setPasswordError('Password must contain at least one lowercase letter');
      setPasswordStrength(strength);
      return false;
    }
    strength++;

    if (!/[0-9]/.test(value)) {
      setPasswordError('Password must contain at least one number');
      setPasswordStrength(strength);
      return false;
    }
    strength++;

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      setPasswordError('Password must contain at least one special character');
      setPasswordStrength(strength);
      return false;
    }
    strength = 5;

    setPasswordError('');
    setPasswordStrength(strength);
    return true;
  };

  // Confirm password - just one of many validation patterns
  const validateConfirmPassword = (value: string) => {
    if (value !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  function validatePhone(value: string) {
    if (value && !/^\d{10}$/.test(value.replace(/\D/g, ''))) {
      setPhoneError('Phone number must be 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  }

  const validateDateOfBirth = (value: string) => {
    if (!value) return true;

    const date = new Date(value);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();

    if (age < 13) {
      setDateOfBirthError('You must be at least 13 years old');
      return false;
    }
    if (age > 120) {
      setDateOfBirthError('Please enter a valid date');
      return false;
    }
    setDateOfBirthError('');
    return true;
  };

  const validateAddress = (value: string) => {
    if (!value && accountType !== AccountType.Personal) {
      setAddressError('Address is required for business accounts');
      return false;
    }
    setAddressError('');
    return true;
  };

  const validateZipCode = (value: string) => {
    if (country === 'us' && value && !/^\d{5}(-\d{4})?$/.test(value)) {
      setZipCodeError('Please enter a valid US ZIP code');
      return false;
    }
    if (country === 'ca' && value && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(value)) {
      setZipCodeError('Please enter a valid Canadian postal code');
      return false;
    }
    setZipCodeError('');
    return true;
  };

  const validateCompanyInfo = () => {
    const errors = { companyName: '', jobTitle: '', workEmail: '' };
    let isValid = true;

    if (accountType !== AccountType.Personal) {
      if (!companyInfo.companyName) {
        errors.companyName = 'Company name is required';
        isValid = false;
      }
      if (!companyInfo.jobTitle) {
        errors.jobTitle = 'Job title is required';
        isValid = false;
      }
      if (companyInfo.workEmail) {
        const re = /\S+@\S+\.\S+/;
        if (!re.test(companyInfo.workEmail)) {
          errors.workEmail = 'Invalid work email';
          isValid = false;
        }
      }
    }

    setCompanyErrors(errors);
    return isValid;
  };

  const validate_billing = () => {
    const errors = { billing_address: '', billing_zip: '' };
    let valid = true;

    if (!billing_same_as_address) {
      if (!billing_address) {
        errors.billing_address = 'Billing address is required';
        valid = false;
      }
      if (!billing_zip) {
        errors.billing_zip = 'Billing ZIP is required';
        valid = false;
      }
    }

    set_billing_errors(errors);
    return valid;
  };

  const validateEmergencyContact = () => {
    const errors: Record<string, string> = {};

    if (!emergencyContactName) {
      errors.name = 'Emergency contact name is required';
    }
    if (!emergencyContactPhone) {
      errors.phone = 'Emergency contact phone is required';
    } else {
      const cleaned = emergencyContactPhone.replace(/[^0-9]/g, '');
      if (cleaned.length < 10) {
        errors.phone = 'Invalid phone number';
      }
    }
    if (!emergencyContactRelation) {
      errors.relation = 'Please specify the relationship';
    }
    if (emergencyContactEmail) {
      const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;
      if (!emailPattern.test(emergencyContactEmail)) {
        errors.email = 'Invalid email format';
      }
    }

    setEmergencyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (!email || emailError) {
      setEmailAvailable(null);
      return;
    }

    setEmailChecking(true);
    const timer = setTimeout(async () => {
      await new Promise(resolve => setTimeout(resolve, 800));

      const takenEmails = ['test@test.com', 'admin@admin.com', 'user@user.com'];
      const isAvailable = !takenEmails.includes(email.toLowerCase());

      setEmailAvailable(isAvailable);
      setEmailChecking(false);

      if (!isAvailable) {
        setEmailError('This email is already registered');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, emailError]);

  const [lastAutosave, setLastAutosave] = useState<Date | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const interval = setInterval(() => {
      // if (hasUnsavedChanges) {
      //   saveAsDraft();
      //   setLastAutosave(new Date());
      // }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const [fieldInteractions, setFieldInteractions] = useState<Record<string, number>>({});

  const trackFieldFocus = (fieldName: string) => {
    setFieldInteractions(prev => ({
      ...prev,
      [fieldName]: (prev[fieldName] || 0) + 1
    }));
  };

  const trackFormAbandonment = () => {
    // analytics.track('form_abandoned', { fields: fieldInteractions });
  };

  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [loadingAddressSuggestions, setLoadingAddressSuggestions] = useState(false);

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    // const response = await axios.get(`/api/address-autocomplete?q=${query}`);
    // setAddressSuggestions(response.data.suggestions);
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirstName(e.target.value);
    validateFirstName(e.target.value);
  };

  const handleCompanyChange = (field: string, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handle_billing_change = (field: string, value: string) => {
    if (field === 'billing_address') set_billing_address(value);
    if (field === 'billing_address2') set_billing_address2(value);
    if (field === 'billing_country') set_billing_country(value);
    if (field === 'billing_state') set_billing_state(value);
    if (field === 'billing_city') set_billing_city(value);
    if (field === 'billing_zip') set_billing_zip(value);
  };

  const updateSecurityQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...securityQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setSecurityQuestions(updated);
  };

  const handleSaveDraft = async () => {
    setSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('Draft saved!');
    } catch (e) {
      alert('Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    let isValid = true;

    if (!validateFirstName(firstName)) isValid = false;
    if (!validateLastName(lastName)) isValid = false;
    if (!validateEmail(email)) isValid = false;
    if (!validatePassword(password)) isValid = false;
    if (!validateConfirmPassword(confirmPassword)) isValid = false;
    if (!validatePhone(phone)) isValid = false;
    if (!validateDateOfBirth(dateOfBirth)) isValid = false;
    if (!validateAddress(address)) isValid = false;
    if (!validateZipCode(zipCode)) isValid = false;
    if (!validateCompanyInfo()) isValid = false;
    if (!validate_billing()) isValid = false;
    if (!validateEmergencyContact()) isValid = false;

    let hasSecurityQuestionError = false;
    securityQuestions.forEach((sq, idx) => {
      if (!sq.question || !sq.answer) {
        hasSecurityQuestionError = true;
      }
    });
    if (hasSecurityQuestionError && accountType !== AccountType.Personal) {
      isValid = false;
    }

    if (!agreeToTerms) {
      setTermsError('You must agree to the terms and conditions');
      isValid = false;
    } else {
      setTermsError('');
    }

    if (!agreeToPrivacy) {
      isValid = false;
    }

    if (accountType === AccountType.Business) {
      if (!businessName || !taxId) {
        isValid = false;
      }
    }

    if (accountType === AccountType.Enterprise) {
      if (!enterpriseId || !primaryContact || !seatCount) {
        isValid = false;
      }
    }

    if (emailAvailable === false) {
      isValid = false;
    }

    if (!isValid) {
      setSubmitError('Please fix the errors above before submitting');
      if (firstNameRef.current) {
        firstNameRef.current.focus();
      }
      return;
    }

    setSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitSuccess(true);

      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

    } catch (error) {
      setSubmitError('Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const shouldShowBusinessFields = accountType === AccountType.Business;
  const shouldShowEnterpriseFields = accountType === AccountType.Enterprise;

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="registration-form">
        {submitError && <div className="error-banner">{submitError}</div>}
        {submitSuccess && <div className="success-banner">Registration successful!</div>}

        <div className="form-section">
          <h2>Account Type</h2>
          <div className="account-type-selector">
            <div
              className={`account-type-card ${accountType === AccountType.Personal ? 'selected' : ''}`}
              onClick={() => setAccountType(AccountType.Personal)}
            >
              <h4>Personal</h4>
              <p>For individual users</p>
            </div>
            <div
              className={`account-type-card ${accountType === AccountType.Business ? 'selected' : ''}`}
              onClick={() => setAccountType(AccountType.Business)}
            >
              <h4>Business</h4>
              <p>For small businesses</p>
            </div>
            <div
              className={`account-type-card ${accountType === AccountType.Enterprise ? 'selected' : ''}`}
              onClick={() => setAccountType(AccountType.Enterprise)}
            >
              <h4>Enterprise</h4>
              <p>For large organizations</p>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Personal Information</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name <span className="required-asterisk">*</span></label>
              <input
                id="firstName"
                ref={firstNameRef}
                type="text"
                value={firstName}
                onChange={handleFirstNameChange}
                className={firstNameError ? 'input-error' : ''}
              />
              {firstNameError && <span className="error-text">{firstNameError}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name <span className="required-asterisk">*</span></label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  validateLastName(e.target.value);
                }}
                className={lastNameError ? 'input-error' : ''}
              />
              {lastNameError && <span className="error-text">{lastNameError}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address <span className="required-asterisk">*</span></label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              className={emailError ? 'input-error' : ''}
            />
            {emailChecking && <span className="field-validating">Checking availability...</span>}
            {!emailChecking && emailAvailable === true && !emailError && (
              <span className="success-text">✓ Email available</span>
            )}
            {emailError && <span className="error-text">{emailError}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  validatePhone(e.target.value);
                }}
                placeholder="(555) 123-4567"
                className={phoneError ? 'input-error' : ''}
              />
              {phoneError && <span className="error-text">{phoneError}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  validateDateOfBirth(e.target.value);
                }}
                className={dateOfBirthError ? 'input-error' : ''}
              />
              {dateOfBirthError && <span className="error-text">{dateOfBirthError}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Gender (Optional)</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={(e) => setGender(e.target.value)}
                />
                Male
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={(e) => setGender(e.target.value)}
                />
                Female
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={gender === 'other'}
                  onChange={(e) => setGender(e.target.value)}
                />
                Other
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="prefer_not_to_say"
                  checked={gender === 'prefer_not_to_say'}
                  onChange={(e) => setGender(e.target.value)}
                />
                Prefer not to say
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-toggle" onClick={() => setShowAddressSection(!showAddressSection)}>
            <h2>Address</h2>
            <span className="toggle-icon">{showAddressSection ? '▼' : '▶'}</span>
          </div>

          {showAddressSection && (
            <>
              <div className="form-group">
                <label htmlFor="address">Street Address</label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={addressError ? 'input-error' : ''}
                />
                {addressError && <span className="error-text">{addressError}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="address2">Address Line 2 (Optional)</label>
                <input
                  id="address2"
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="">Select a country</option>
                  <option value="us">United States</option>
                  <option value="ca">Canada</option>
                  <option value="uk">United Kingdom</option>
                  <option value="au">Australia</option>
                  <option value="de">Germany</option>
                  <option value="fr">France</option>
                  <option value="jp">Japan</option>
                  <option value="in">India</option>
                </select>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label htmlFor="state">State/Province</label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="zipCode">ZIP / Postal Code</label>
                  <input
                    id="zipCode"
                    type="text"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value);
                      validateZipCode(e.target.value);
                    }}
                    className={zipCodeError ? 'input-error' : ''}
                  />
                  {zipCodeError && <span className="error-text">{zipCodeError}</span>}
                </div>
              </div>
            </>
          )}
        </div>

        {accountType !== AccountType.Personal && (
          <div className="form-section">
            <div className="section-toggle" onClick={() => setShowCompanySection(!showCompanySection)}>
              <h2>Company Information</h2>
              <span className="toggle-icon">{showCompanySection ? '▼' : '▶'}</span>
            </div>

            {showCompanySection && (
              <>
                <div className="form-group">
                  <label htmlFor="companyName">Company Name <span className="required-asterisk">*</span></label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) => handleCompanyChange('companyName', e.target.value)}
                    className={companyErrors.companyName ? 'input-error' : ''}
                  />
                  {companyErrors.companyName && <span className="error-text">{companyErrors.companyName}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="jobTitle">Job Title <span className="required-asterisk">*</span></label>
                    <input
                      id="jobTitle"
                      type="text"
                      value={companyInfo.jobTitle}
                      onChange={(e) => handleCompanyChange('jobTitle', e.target.value)}
                      className={companyErrors.jobTitle ? 'input-error' : ''}
                    />
                    {companyErrors.jobTitle && <span className="error-text">{companyErrors.jobTitle}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="department">Department</label>
                    <input
                      id="department"
                      type="text"
                      value={companyInfo.department}
                      onChange={(e) => handleCompanyChange('department', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employeeId">Employee ID</label>
                    <input
                      id="employeeId"
                      type="text"
                      value={companyInfo.employeeId}
                      onChange={(e) => handleCompanyChange('employeeId', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="yearsAtCompany">Years at Company</label>
                    <input
                      id="yearsAtCompany"
                      type="number"
                      min="0"
                      value={companyInfo.yearsAtCompany}
                      onChange={(e) => handleCompanyChange('yearsAtCompany', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="workEmail">Work Email</label>
                    <input
                      id="workEmail"
                      type="email"
                      value={companyInfo.workEmail}
                      onChange={(e) => handleCompanyChange('workEmail', e.target.value)}
                      className={companyErrors.workEmail ? 'input-error' : ''}
                    />
                    {companyErrors.workEmail && <span className="error-text">{companyErrors.workEmail}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="workPhone">Work Phone</label>
                    <input
                      id="workPhone"
                      type="tel"
                      value={companyInfo.workPhone}
                      onChange={(e) => handleCompanyChange('workPhone', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {shouldShowBusinessFields && (
          <div className="form-section">
            <h2>Business Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessName">Legal Business Name</label>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="taxId">Tax ID / EIN</label>
                <input
                  id="taxId"
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="businessSize">Business Size</label>
                <select
                  id="businessSize"
                  value={businessSize}
                  onChange={(e) => setBusinessSize(e.target.value)}
                >
                  <option value="">Select size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="industry">Industry</label>
                <select
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                >
                  <option value="">Select industry...</option>
                  <option value="tech">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="annualRevenue">Annual Revenue (Optional)</label>
              <select
                id="annualRevenue"
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
              >
                <option value="">Prefer not to say</option>
                <option value="<1m">Less than $1M</option>
                <option value="1m-10m">$1M - $10M</option>
                <option value="10m-50m">$10M - $50M</option>
                <option value="50m+">$50M+</option>
              </select>
            </div>
          </div>
        )}

        {shouldShowEnterpriseFields && (
          <div className="form-section">
            <h2>Enterprise Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="enterpriseId">Enterprise ID</label>
                <input
                  id="enterpriseId"
                  type="text"
                  value={enterpriseId}
                  onChange={(e) => setEnterpriseId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="primaryContact">Primary Contact</label>
                <input
                  id="primaryContact"
                  type="text"
                  value={primaryContact}
                  onChange={(e) => setPrimaryContact(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contractDuration">Contract Duration</label>
                <select
                  id="contractDuration"
                  value={contractDuration}
                  onChange={(e) => setContractDuration(e.target.value)}
                >
                  <option value="">Select duration...</option>
                  <option value="1y">1 Year</option>
                  <option value="2y">2 Years</option>
                  <option value="3y">3 Years</option>
                  <option value="5y">5 Years</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="seatCount">Seat Count</label>
                <input
                  id="seatCount"
                  type="number"
                  min="50"
                  value={seatCount}
                  onChange={(e) => setSeatCount(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="customDomain">Custom Domain (Optional)</label>
              <input
                id="customDomain"
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="yourcompany.com"
              />
            </div>
          </div>
        )}

        <div className="form-section">
          <div className="section-toggle" onClick={() => setShowBillingSection(!showBillingSection)}>
            <h2>Billing Address</h2>
            <span className="toggle-icon">{showBillingSection ? '▼' : '▶'}</span>
          </div>

          {showBillingSection && (
            <>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={billing_same_as_address}
                    onChange={(e) => set_billing_same_as_address(e.target.checked)}
                  />
                  <span>Billing address is same as primary address</span>
                </label>
              </div>

              {!billing_same_as_address && (
                <div className="address-card">
                  <div className="form-group">
                    <label htmlFor="billing_address">Billing Address</label>
                    <input
                      id="billing_address"
                      type="text"
                      value={billing_address}
                      onChange={(e) => handle_billing_change('billing_address', e.target.value)}
                      className={billing_errors.billing_address ? 'input-error' : ''}
                    />
                    {billing_errors.billing_address && <span className="error-text">{billing_errors.billing_address}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="billing_address2">Billing Address Line 2</label>
                    <input
                      id="billing_address2"
                      type="text"
                      value={billing_address2}
                      onChange={(e) => handle_billing_change('billing_address2', e.target.value)}
                    />
                  </div>

                  <div className="form-row-3">
                    <div className="form-group">
                      <label htmlFor="billing_city">City</label>
                      <input
                        id="billing_city"
                        type="text"
                        value={billing_city}
                        onChange={(e) => handle_billing_change('billing_city', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="billing_state">State</label>
                      <input
                        id="billing_state"
                        type="text"
                        value={billing_state}
                        onChange={(e) => handle_billing_change('billing_state', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="billing_zip">ZIP Code</label>
                      <input
                        id="billing_zip"
                        type="text"
                        value={billing_zip}
                        onChange={(e) => handle_billing_change('billing_zip', e.target.value)}
                        className={billing_errors.billing_zip ? 'input-error' : ''}
                      />
                      {billing_errors.billing_zip && <span className="error-text">{billing_errors.billing_zip}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="billing_country">Country</label>
                    <select
                      id="billing_country"
                      value={billing_country}
                      onChange={(e) => handle_billing_change('billing_country', e.target.value)}
                    >
                      <option value="">Select a country</option>
                      <option value="us">United States</option>
                      <option value="ca">Canada</option>
                      <option value="uk">United Kingdom</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="form-section">
          <div className="section-toggle" onClick={() => setShowEmergencySection(!showEmergencySection)}>
            <h2>Emergency Contact</h2>
            <span className="toggle-icon">{showEmergencySection ? '▼' : '▶'}</span>
          </div>

          {showEmergencySection && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ecName">Contact Name</label>
                  <input
                    id="ecName"
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className={emergencyErrors.name ? 'input-error' : ''}
                  />
                  {emergencyErrors.name && <span className="error-text">{emergencyErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="ecRelation">Relationship</label>
                  <select
                    id="ecRelation"
                    value={emergencyContactRelation}
                    onChange={(e) => setEmergencyContactRelation(e.target.value)}
                    className={emergencyErrors.relation ? 'input-error' : ''}
                  >
                    <option value="">Select...</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                  {emergencyErrors.relation && <span className="error-text">{emergencyErrors.relation}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ecPhone">Phone Number</label>
                  <input
                    id="ecPhone"
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className={emergencyErrors.phone ? 'input-error' : ''}
                  />
                  {emergencyErrors.phone && <span className="error-text">{emergencyErrors.phone}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="ecEmail">Email (Optional)</label>
                  <input
                    id="ecEmail"
                    type="email"
                    value={emergencyContactEmail}
                    onChange={(e) => setEmergencyContactEmail(e.target.value)}
                    className={emergencyErrors.email ? 'input-error' : ''}
                  />
                  {emergencyErrors.email && <span className="error-text">{emergencyErrors.email}</span>}
                </div>
              </div>
            </>
          )}
        </div>

        {accountType !== AccountType.Personal && (
          <div className="form-section">
            <h2>Security Questions</h2>
            <p className="help-text">Please answer all three security questions for account recovery.</p>

            {securityQuestions.map((sq, index) => (
              <div key={index} className="security-question">
                <h3>Security Question {index + 1}</h3>
                <div className="form-group">
                  <label>Question</label>
                  <select
                    value={sq.question}
                    onChange={(e) => updateSecurityQuestion(index, 'question', e.target.value)}
                  >
                    <option value="">Select a question...</option>
                    <option value="pet">What was the name of your first pet?</option>
                    <option value="school">What was the name of your elementary school?</option>
                    <option value="city">In what city were you born?</option>
                    <option value="mother">What is your mother's maiden name?</option>
                    <option value="car">What was your first car?</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Answer</label>
                  <input
                    type="text"
                    value={sq.answer}
                    onChange={(e) => updateSecurityQuestion(index, 'answer', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="form-section">
          <h2>Security</h2>

          <div className="form-group">
            <label htmlFor="password">Password <span className="required-asterisk">*</span></label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              className={passwordError ? 'input-error' : ''}
            />
            {password && (
              <>
                <div className="password-strength">
                  <div
                    className="password-strength-bar"
                    style={{
                      width: `${passwordStrength * 20}%`,
                      background: passwordStrength <= 2 ? '#f44336' : passwordStrength <= 3 ? '#ff9800' : '#4CAF50'
                    }}
                  />
                </div>
                <span className="password-strength-text">
                  Strength: {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength - 1] || 'None'}
                </span>
              </>
            )}
            {passwordError && <span className="error-text">{passwordError}</span>}
            <small className="help-text">
              Must be at least 8 characters with uppercase, lowercase, numbers, and special characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password <span className="required-asterisk">*</span></label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateConfirmPassword(e.target.value);
              }}
              className={confirmPasswordError ? 'input-error' : ''}
            />
            {confirmPasswordError && <span className="error-text">{confirmPasswordError}</span>}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={twoFactorAuth}
                onChange={(e) => setTwoFactorAuth(e.target.checked)}
              />
              <span>Enable two-factor authentication (recommended)</span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Preferences</h2>

          <div className="form-row-3">
            <div className="form-group">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
          </div>

          <h3>Notification Preferences</h3>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={marketingEmails}
                onChange={(e) => setMarketingEmails(e.target.checked)}
              />
              <span>Marketing emails</span>
            </label>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={productUpdates}
                onChange={(e) => setProductUpdates(e.target.checked)}
              />
              <span>Product updates and announcements</span>
            </label>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
              />
              <span>Weekly digest</span>
            </label>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
              />
              <span>SMS notifications</span>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Terms & Agreements</h2>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  setAgreeToTerms(e.target.checked);
                  if (e.target.checked) setTermsError('');
                }}
              />
              <span>I agree to the Terms and Conditions <span className="required-asterisk">*</span></span>
            </label>
            {termsError && <span className="error-text">{termsError}</span>}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeToPrivacy}
                onChange={(e) => setAgreeToPrivacy(e.target.checked)}
              />
              <span>I agree to the Privacy Policy <span className="required-asterisk">*</span></span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreeToMarketing}
                onChange={(e) => setAgreeToMarketing(e.target.checked)}
              />
              <span>I agree to receive marketing communications (Optional)</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-cancel"
            onClick={handleSaveDraft}
            disabled={submitting}
          >
            Save as Draft
          </button>
          <button
            ref={submitButtonRef}
            type="submit"
            className="btn-submit"
            disabled={submitting}
          >
            {submitting ? 'Registering...' : 'Complete Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};
