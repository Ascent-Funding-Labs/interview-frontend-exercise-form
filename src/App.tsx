import React from 'react';
import { UserRegistrationForm } from './UserRegistrationForm';

const App: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Create Your Account</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Get started by creating your free account. All fields marked with an asterisk are required.
      </p>
      <UserRegistrationForm />
    </div>
  );
};

export default App;
