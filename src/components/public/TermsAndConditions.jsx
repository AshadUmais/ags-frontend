import React, { useEffect, useState } from 'react';
import './TermsAndConditions.css';

function TermsAndConditions() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/TermsAndConditions.txt')
      .then(response => response.text())
      .then(data => setContent(data))
      .catch(error => console.error('Error loading terms and conditions:', error));
  }, []);

  return (
    <div className="terms-container">
      <div className="terms-content">
        {content.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export default TermsAndConditions;
