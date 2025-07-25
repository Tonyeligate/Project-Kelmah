import authReducer, {
  register,
  login,
  verifyAuth,
  logoutUser,
} from '../../modules/auth/services/authSlice';

export { register, login, verifyAuth, logoutUser };

export default authReducer;
