import React, { useEffect, useState } from 'react';
import './PrivacyPolicy.css';

function PrivacyPolicy() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/PrivacyPolicy.txt')
      .then(response => response.text())
      .then(data => setContent(data))
      .catch(error => console.error('Error loading privacy policy:', error));
  }, []);

  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-content">
        {content.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export default PrivacyPolicy;
