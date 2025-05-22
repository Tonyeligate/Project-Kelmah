import React from 'react';
import Register from '../../components/auth/Register';
import AuthWrapper from '../../components/auth/AuthWrapper';

const RegisterPage = () => {
  return (
    <AuthWrapper>
      <Register />
    </AuthWrapper>
  );
};

export default RegisterPage; 