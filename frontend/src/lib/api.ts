/**
 * VISION — API Client
 * Uses the Supabase session access_token as the sole auth token.
 * No Django JWT involved. Token is automatically attached to every request.
 */
import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach the Supabase access_token to every outgoing request
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Silent — unauthenticated requests will get 401 from Django
  }
  return config;
});

export const useApiClient = () => api;
