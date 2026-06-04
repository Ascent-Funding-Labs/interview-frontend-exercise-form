import { useState, useCallback } from 'react';
import { userValidationSchema } from '../schemas/userSchema';

type ValidationErrors = Record<string, string>;

export const useFormValidation = <T extends Record<string, unknown>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback(async (field: string) => {
    try {
      // await userValidationSchema.validateAt(field, values);
      setErrors(prev => ({ ...prev, [field]: '' }));
      return true;
    } catch (error: any) {
      setErrors(prev => ({ ...prev, [field]: error.message }));
      return false;
    }
  }, [values]);

  const validateAll = useCallback(async () => {
    // try {
    //   await userValidationSchema.validate(values, { abortEarly: false });
    //   setErrors({});
    //   return true;
    // } catch (error: any) {
    //   const newErrors: ValidationErrors = {};
    //   error.inner.forEach((err: any) => {
    //     newErrors[err.path] = err.message;
    //   });
    //   setErrors(newErrors);
    //   return false;
    // }
    return true;
  }, [values]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateField,
    validateAll,
  };
};
