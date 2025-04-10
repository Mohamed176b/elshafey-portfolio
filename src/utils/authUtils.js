// Auth utilities for handling user session
const SESSION_USER_KEY = 'elshafey_portfolio_user';

// Store user in sessionStorage
export const setUserSession = (user) => {
  if (!user) return false;
  try {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error storing user session:', error);
    return false;
  }
};

// Get user from sessionStorage
export const getUserSession = () => {
  try {
    const userSession = sessionStorage.getItem(SESSION_USER_KEY);
    return userSession ? JSON.parse(userSession) : null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
};

// Clear user from sessionStorage
export const clearUserSession = () => {
  try {
    sessionStorage.removeItem(SESSION_USER_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing user session:', error);
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getUserSession();
};
