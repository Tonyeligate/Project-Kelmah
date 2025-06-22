import React from 'react';
import Login from '../components/login/Login';
import AuthWrapper from '../components/common/AuthWrapper';

const LoginPage = () => {
  return (
    <AuthWrapper>
      <Login />
    </AuthWrapper>
  );
};

export default LoginPage; 