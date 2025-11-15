import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section contact-info">
            <h3 className="footer-title">ADDRESS:</h3>
            <div className="address">
              <p><strong>AGS Wonderworld</strong></p>
              <p>212/2, Nilavur Main Road, Yelagiri Hills,</p>
              <p>Tirupattur District - 635 853</p>
            </div>
            
            <div className="zcontact-details">
              <p>For inquiries, please contact:</p>
              <a href="mailto:info@agswonderworld.com" className="contact-link">
                info@agswonderworld.com
              </a>
              <a href="tel:+918300555255" className="contact-link">+91 83005 55255</a>
              <a href="tel:+918667316673" className="contact-link">+91 86673 16673</a>
              <a href="tel:+918144451544" className="contact-link">+91 81444 51544</a>
            </div>
          </div>
          
          <div className="footer-section social-section">
            <h3 className="footer-title">FOLLOW US</h3>
            <div className="social-links">
              <a href="https://facebook.com" className="social-link facebook" target="_blank" rel="noopener noreferrer">
                <span>f</span>
              </a>
              <a href="https://instagram.com" className="social-link instagram" target="_blank" rel="noopener noreferrer">
                <span>📷</span>
              </a>
              <a href="https://wa.me" className="social-link whatsapp" target="_blank" rel="noopener noreferrer">
                <span>💬</span>
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-links">
          <a href="/contact" className="footer-link">Contact Us</a>
          <a href="/terms-and-conditions" className="footer-link">Terms and conditions</a>
          <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 by AGS WONDERWORLD | All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;