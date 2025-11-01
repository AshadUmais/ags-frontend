import React from 'react';
import './PlayPage.css';

const PlayPage = () => {
  const landRides = [
    {
      id: 1,
      name: "Thunder Mountain",
      description: "Experience the ultimate thrill on this high-speed roller coaster that takes you through twists, turns, and breathtaking drops.",
      image: "/assets/thunder-mountain.jpg",
      duration: "3 minutes",
      minHeight: "120cm"
    },
    {
      id: 2,
      name: "Adventure Express",
      description: "A family-friendly ride through enchanted forests and mysterious caves. Perfect for adventurers of all ages.",
      image: "/assets/roller-coaster.jpg",
      duration: "5 minutes",
      minHeight: "100cm"
    },
    {
      id: 3,
      name: "Sky Tower",
      description: "Rise 200 feet above the park for spectacular panoramic views. A gentle ride with unforgettable scenery.",
      image: "/assets/flying-ride.jpg",
      duration: "4 minutes",
      minHeight: "110cm"
    },
    {
      id: 4,
      name: "Bird Safari",
      description: "Journey through an authentic safari experience with exotic animals and stunning landscapes.",
      image: "/assets/bird-show.jpg",
      duration: "15 minutes",
      minHeight: "No restriction"
    }
  ];

  const waterRides = [
    {
      id: 5,
      name: "Splash Canyon",
      description: "Navigate through rushing rapids and cascading waterfalls in this exciting water adventure.",
      image: "/assets/splash-canyon.jpg",
      duration: "8 minutes",
      minHeight: "120cm"
    },
    {
      id: 6,
      name: "Aqua Loop",
      description: "Experience the ultimate water slide with loops, drops, and high-speed water jets.",
      image: "/assets/aqua-loop.jpg",
      duration: "2 minutes",
      minHeight: "140cm"
    },
    {
      id: 7,
      name: "Lazy River",
      description: "Relax and unwind as you float along our peaceful lazy river surrounded by tropical landscapes.",
      image: "/assets/lazy-river.jpg",
      duration: "20 minutes",
      minHeight: "No restriction"
    },
    {
      id: 8,
      name: "Wave Pool",
      description: "Enjoy the fun of ocean waves in our massive wave pool. Perfect for swimming and surfing.",
      image: "/assets/wave-pool.jpg",
      duration: "Continuous",
      minHeight: "No restriction"
    }
  ];

  const RideCard = ({ ride }) => (
    <div className="zride-card">
      <div className="zride-image">
        <img src={ride.image} alt={ride.name} />
      </div>
      <div className="zride-content">
        <h3 className="zride-name">{ride.name}</h3>
        <p className="zride-description">{ride.description}</p>
        <div className="zride-details">
          <span className="zride-duration">⏱️ {ride.duration}</span>
          <span className="zride-height">📏 {ride.minHeight}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="play-page">
      <div className="play-hero">
        <div className="play-hero-content">
          <h1 className="play-title">Adventure Awaits</h1>
          <p className="play-subtitle">Discover thrilling rides and exciting experiences</p>
        </div>
      </div>

      <div className="play-content">
        {/* Land Rides Section */}
        <section className="rides-section">
          <div className="section-header">
            <h2 className="section-title">🎢 Land Rides</h2>
            <p className="section-description">
              Experience heart-pumping adventures on solid ground with our collection of thrilling land-based attractions.
            </p>
          </div>
          <div className="rides-grid">
            {landRides.map(ride => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        </section>

        {/* Water Rides Section */}
        <section className="rides-section">
          <div className="section-header">
            <h2 className="section-title">🌊 Water Rides</h2>
            <p className="section-description">
              Cool off and make a splash with our refreshing water attractions and aquatic adventures.
            </p>
          </div>
          <div className="rides-grid">
            {waterRides.map(ride => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlayPage;