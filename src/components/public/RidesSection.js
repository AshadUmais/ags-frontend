import React from 'react';
import './RidesSection.css';

const RidesSection = () => {
  const ridesData = [
    {
      id: 1,
      title: "ENJOY A BIRD'S EYE VIEW",
      description: "Watch our captivating bird shows featuring a variety of colorful and exotic avian species.",
      image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2026&q=80",
      link: "#eat"
    },
    {
      id: 2,
      title: "INDULGE IN MULTICUISINE DELIGHTS",
      description: "Treat your taste buds to a delightful culinary journey at our restaurant",
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2080&q=80",
      link: "#play"
    },
    {
      id: 3,
      title: "LAND RIDES",
      description: "Experience the thrill of AGS Wonderworld's land rides, where adventure and excitement await at turn for visitors of all ages.",
      image: "/assets/roller-coaster.jpg",
      link: "#land-rides"
    },
    {
      id: 4,
      title: "WATER RIDES",
      description: "Experience the thrill of AGS Wonderworld's water rides, where exhilarating twists and turns meet refreshing splashes for an unforgettable adventure!",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      link: "#water-rides"
    }
  ];

  return (
    <section className="rides-section" id="play">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">EXPERIENCE THRILLING RIDES</h2>
          <p className="section-subtitle">
            Get your adrenaline pumping with our wide array of exhilarating rides suitable
            for all ages.
          </p>
        </div>
        
        <div className="rides-grid">
          {ridesData.map((ride) => (
            <div key={ride.id} className="ride-card">
              <div className="ride-image">
                <img src={ride.image} alt={ride.title} />
                <div className="ride-overlay">
                  <div className="ride-content">
                    <h3 className="ride-title">{ride.title}</h3>
                    <p className="ride-description">{ride.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RidesSection;