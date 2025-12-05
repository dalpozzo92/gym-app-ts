import React, { useState } from 'react';

const Username: React.FC<{ value: string }> = ({ value }) => {
  return <h1>{value}</h1>;
};

const TestPage: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');

  const clickHandler = () => {
    setUsername(inputValue);
  };

  return ( 
    <div style={{ padding: '16px' }}>
      <button onClick={clickHandler}>Change Username</button>
      <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
      <Username value={username} />
    </div>
  );
};

export default TestPage;
