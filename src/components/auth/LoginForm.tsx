import React from 'react';
import { AuthForm } from '../AuthForm';

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  return <AuthForm onSuccess={onSuccess} />;
};

export default LoginForm;