import React, { useEffect, useState } from 'react';
import './RefundPolicy.css';

function RefundPolicy() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/RefundPolicy.txt')
      .then(response => response.text())
      .then(data => setContent(data))
      .catch(error => console.error('Error loading refund policy:', error));
  }, []);

  return (
    <div className="refund-policy-container">
      <div className="refund-policy-content">
        {content.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export default RefundPolicy;
