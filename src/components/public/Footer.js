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
              <span className="contact-separator">|</span>
              <a href="tel:+918300555255" className="contact-link">+91 83005 55255</a>
            </div>
          </div>
          
          <div className="footer-section social-section">
            <h3 className="footer-title">FOLLOW US</h3>
            <div className="social-links">
              <a href="https://www.facebook.com/profile.php?id=61578598261844#" className="social-link facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook">
                <img src="/assets/facebook-icon.png" alt="Facebook" />
              </a>
              <a href="https://www.instagram.com/agswonderworld/" className="social-link instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
                <img src="/assets/instagram-icon.png" alt="Instagram" />
              </a>
              <a href="https://wa.me/918667316673" className="social-link whatsapp" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp">
                <img src="/assets/whatsapp-icon.png" alt="WhatsApp" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-links">
          <a href="/contact" className="footer-link">Contact Us</a>
          <a href="/terms-and-conditions" className="footer-link">Terms and conditions</a>
          <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
          <a href="/refund-policy" className="footer-link">Refund Policy</a>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 by AGS WONDERWORLD | All Rights Reserved</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;