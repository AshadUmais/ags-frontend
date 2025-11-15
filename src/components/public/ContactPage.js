import React, { useState } from 'react';
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  const contactInfo = {
    address: {
      name: "AGS Wonderworld",
      line1: "212/2, Nilavur Main Road",
      line2: "Yelagiri Hills, Tirupattur District - 635 853"
    },
    phones: [
      "+91 83005 55255",
      "+91 86673 16673",
      "+91 81444 51544"
    ],
    email: "info@agswonderworld.com",
    hours: {
      weekdays: "9:00 AM - 6:00 PM",
      weekends: "8:00 AM - 8:00 PM"
    }
  };

  const departments = [
    {
      name: "General Inquiries",
      email: "info@agswonderworld.com",
      phone: "+91 83005 55255",
      description: "For general questions and information"
    },
    {
      name: "Ticket Booking",
      email: "tickets@agswonderworld.com",
      phone: "+91 86673 16673",
      description: "For ticket bookings and group reservations"
    },
    {
      name: "Events & Celebrations",
      email: "events@agswonderworld.com",
      phone: "+91 81444 51544",
      description: "For birthday parties and special events"
    }
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="contact-hero-image">
          <img 
            src="/assets/ags-logo.jpeg" 
            alt="Contact Us" 
          />
          <div className="contact-hero-overlay">
            <div className="contact-hero-content">
              <h1 className="contact-hero-title">GET IN TOUCH</h1>
              <p className="contact-hero-subtitle">
                We're here to help! Reach out to us for any questions, bookings, or special requests
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="contact-info-section">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Details */}
            <div className="contact-details">
              <h2 className="section-title">Contact Information</h2>
              
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div className="contact-content">
                  <h3>Address</h3>
                  <p><strong>{contactInfo.address.name}</strong></p>
                  <p>{contactInfo.address.line1}</p>
                  <p>{contactInfo.address.line2}</p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">📞</div>
                <div className="contact-content">
                  <h3>Phone Numbers</h3>
                  {contactInfo.phones.map((phone, index) => (
                    <p key={index}>
                      <a href={`tel:${phone}`} className="phone-link">{phone}</a>
                    </p>
                  ))}
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">✉️</div>
                <div className="contact-content">
                  <h3>Email</h3>
                  <p>
                    <a href={`mailto:${contactInfo.email}`} className="email-link">
                      {contactInfo.email}
                    </a>
                  </p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon">🕒</div>
                <div className="contact-content">
                  <h3>Operating Hours</h3>
                  <p><strong>Weekdays:</strong> {contactInfo.hours.weekdays}</p>
                  <p><strong>Weekends:</strong> {contactInfo.hours.weekends}</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-container">
              <h2 className="section-title">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="booking">Ticket Booking</option>
                      <option value="event">Event Planning</option>
                      <option value="feedback">Feedback</option>
                      <option value="complaint">Complaint</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Enter your message here..."
                  ></textarea>
                </div>
                
                <button type="submit" className="submit-btn">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="departments-section">
        <div className="container">
          <h2 className="section-title">Contact Departments</h2>
          <div className="departments-grid">
            {departments.map((dept, index) => (
              <div key={index} className="department-card">
                <h3>{dept.name}</h3>
                <p className="dept-description">{dept.description}</p>
                <div className="dept-contact">
                  <p>
                    📞 <a href={`tel:${dept.phone}`} className="phone-link">{dept.phone}</a>
                  </p>
                  <p>
                    ✉️ <a href={`mailto:${dept.email}`} className="email-link">{dept.email}</a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section">
        <div className="container">
          <h2 className="section-title">Find Us</h2>
          <div className="map-container">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27186.353410344356!2d78.61741013246265!3d12.587671477316409!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3badabc281dac5a5%3A0xd3a465d2dba04824!2sAGS%20WONDER%20WORLD%20PRIVATE%20LIMITED!5e0!3m2!1sen!2sin!4v1763240259490!5m2!1sen!2sin"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="AGS Wonderworld Location"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="emergency-section">
        <div className="container">
          <div className="emergency-card">
            <h2>🚨 Emergency Contact</h2>
            <p>For any emergency situations during your visit, please contact our security team immediately.</p>
            <div className="emergency-contact">
              <a href="tel:+919876543210" className="emergency-btn">
                📞 Emergency Hotline: +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;