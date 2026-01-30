import React from 'react';
import './AmenitiesSection.css';

const AmenitiesSection = () => {
  const amenities = [
    {
      id: 1,
      name: "Free Car Parking",
      icon: "🅿️"
    },
    {
      id: 2,
      name: "Wheelchair Access",
      icon: "♿"
    },
    {
      id: 3,
      name: "Individual Lockers",
      icon: "🔒"
    },
    {
      id: 4,
      name: "Changing Rooms",
      icon: "🚪"
    },
    {
      id: 5,
      name: "Hygienic Shower Room",
      icon: "🚿"
    },
    {
      id: 6,
      name: "Hot Water Facility",
      icon: "♨️"
    },
    {
      id: 7,
      name: "Free WiFi",
      icon: "🛜"
    },
    {
      id: 8,
      name: "Hygienic Drinking Water",
      icon: "🚰"
    },
    {
      id: 9,
      name: "First Aid",
      icon: "🏥"
    }
  ];

  return (
    <section className="amenities-section" id="amenities">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">OUR AMENITIES</h2>
          <p className="section-subtitle">
            We provide excellent facilities to ensure your comfort and safety during your visit
          </p>
        </div>

        <div className="amenities-grid">
          {amenities.map((amenity) => (
            <div key={amenity.id} className="amenity-card">
              <div className="amenity-icon">{amenity.icon}</div>
              <h3 className="amenity-name">{amenity.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AmenitiesSection;
