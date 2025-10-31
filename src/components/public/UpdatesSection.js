import React from 'react';
import './UpdatesSection.css';

const UpdatesSection = () => {
  const updatesData = [
    {
      id: 1,
      title: "EXCITING PROMOTIONS",
      description: "Discover our current promotions and special offers for a memorable experience.",
      subtitle: "Stay tuned for our exciting promotions and limited-time offers to enhance your visit.",
      image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2064&q=80"
    },
    {
      id: 2,
      title: "EXCLUSIVE EVENTS",
      description: "Join us for exclusive events and themed celebrations throughout the year.",
      subtitle: "Be part of our exclusive events and festive celebrations for a truly magical time.",
      image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
    },
    {
      id: 3,
      title: "JOIN OUR COMMUNITY",
      description: "Connect with fellow adventure enthusiasts and stay updated on all things AGS Wonderworld.",
      subtitle: "Join our community of thrill-seekers and share your experiences at AGS Wonderworld.",
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2089&q=80"
    }
  ];

  return (
    <section className="updates-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">LATEST UPDATES</h2>
          <p className="section-subtitle">
            Stay updated with the latest news, events, and promotions at AGS Wonderworld.
          </p>
        </div>
        
        <div className="updates-grid">
          {updatesData.map((update) => (
            <div key={update.id} className="update-card">
              <div className="update-image">
                <img src={update.image} alt={update.title} />
              </div>
              <div className="update-content">
                <h3 className="update-title">{update.title}</h3>
                <p className="update-description">{update.description}</p>
                <p className="update-subtitle">{update.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpdatesSection;