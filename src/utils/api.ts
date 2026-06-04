import axios from 'axios';
import { debounce } from 'lodash';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const takenEmails = ['test@test.com', 'admin@admin.com', 'user@user.com'];
  return !takenEmails.includes(email.toLowerCase());
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const taken = ['admin', 'root', 'user', 'test'];
  return !taken.includes(username.toLowerCase());
};

export const debouncedEmailCheck = debounce(
  async (email: string, callback: (available: boolean) => void) => {
    const available = await checkEmailAvailability(email);
    callback(available);
  },
  500
);

export const submitRegistration = async (formData: any) => {
  try {
    const response = await apiClient.post('/auth/register', formData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
    throw error;
  }
};
