
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  sendPasswordReset,
  authErrorMessage
} from "./firebase.js";

export const LoginAPI = {
  register: (name, email, password) =>
    registerUser({ name, email, password }),

  login: (email, password, remember = true) =>
    loginUser({ email, password, remember }),

  logout: () => logoutUser(),

  currentUser: () => getCurrentUser(),

  resetPassword: (email) => sendPasswordReset(email),

  getError: (error) => authErrorMessage(error)
};
