import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      authAPI.getCurrentUser()
        .then(response => {
          dispatch({ type: 'SET_USER', payload: response.data });
        })
        .catch(() => {
          localStorage.removeItem('token');
          dispatch({ type: 'LOGOUT' });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.login(credentials);
      const { token, refreshToken } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Load user profile so role-gating works reliably.
      const currentUserResponse = await authAPI.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: currentUserResponse.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const loginWithGoogle = async ({ email, firstName, lastName } = {}) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      if (!email) {
        throw new Error('Email is required for Google sign-in');
      }

      const response = await authAPI.googleSignIn({ email, firstName, lastName });
      const { token, refreshToken } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      const currentUserResponse = await authAPI.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: currentUserResponse.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Google sign-in failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const loginWithPhone = async ({ phone, code } = {}) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      if (!phone || !code) {
        throw new Error('Phone and OTP code are required');
      }

      const response = await authAPI.phoneSignIn({ phone, code });
      const { token, refreshToken } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      const currentUserResponse = await authAPI.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: currentUserResponse.data });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Phone sign-in failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authAPI.register(userData);
      return { success: true, message: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    loginWithGoogle,
    loginWithPhone,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
