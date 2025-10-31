import React from 'react';
import './EatPage.css';

const EatPage = () => {
  const cuisineTypes = [
    {
      id: 1,
      name: "Indian Delights",
      description: "Authentic Indian cuisine with aromatic spices and traditional flavors",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2071&q=80",
      specialties: ["Biryanis", "Curries", "Tandoor Items", "South Indian"]
    },
    {
      id: 2,
      name: "Chinese Corner",
      description: "Delicious Chinese dishes with fresh ingredients and bold flavors",
      image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      specialties: ["Fried Rice", "Noodles", "Manchurian", "Dim Sum"]
    },
    {
      id: 3,
      name: "Continental Classics",
      description: "International favorites and continental dishes for all tastes",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2061&q=80",
      specialties: ["Pasta", "Pizza", "Sandwiches", "Salads"]
    },
    {
      id: 4,
      name: "Fast Food Favorites",
      description: "Quick bites and popular fast food options for on-the-go dining",
      image: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      specialties: ["Burgers", "Fries", "Wraps", "Shakes"]
    },
    {
      id: 5,
      name: "Sweet Treats",
      description: "Desserts and beverages to satisfy your sweet cravings",
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2064&q=80",
      specialties: ["Ice Cream", "Cakes", "Pastries", "Fresh Juices"]
    },
    {
      id: 6,
      name: "Healthy Options",
      description: "Nutritious and wholesome meals for health-conscious diners",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      specialties: ["Salad Bowls", "Grilled Items", "Fresh Fruits", "Smoothies"]
    }
  ];

  const restaurantInfo = {
    timings: "10:00 AM - 10:00 PM",
    capacity: "200+ Seating Capacity",
    features: ["Air Conditioned", "Family Friendly", "Kids Play Area", "Outdoor Seating"]
  };

  return (
    <div className="eat-page">
      {/* Hero Section */}
      <section className="eat-hero">
        <div className="eat-hero-image">
          <img 
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
            alt="Restaurant Interior" 
          />
          <div className="eat-hero-overlay">
            <div className="eat-hero-content">
              <h1 className="eat-hero-title">MULTICUISINE RESTAURANT</h1>
              <p className="eat-hero-subtitle">
                Indulge in a delightful culinary journey with diverse flavors from around the world
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Info */}
      <section className="restaurant-info">
        <div className="container">
          <div className="info-grid">
            <div className="info-card">
              <h3>🕐 Operating Hours</h3>
              <p>{restaurantInfo.timings}</p>
            </div>
            <div className="info-card">
              <h3>👥 Seating</h3>
              <p>{restaurantInfo.capacity}</p>
            </div>
            <div className="info-card">
              <h3>✨ Features</h3>
              <ul>
                {restaurantInfo.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Cuisine Types */}
      <section className="cuisine-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">OUR CUISINE VARIETIES</h2>
            <p className="section-subtitle">
              Experience a world of flavors with our diverse menu options
            </p>
          </div>
          
          <div className="cuisine-grid">
            {cuisineTypes.map((cuisine) => (
              <div key={cuisine.id} className="cuisine-card">
                <div className="cuisine-image">
                  <img src={cuisine.image} alt={cuisine.name} />
                  <div className="cuisine-overlay">
                    <div className="cuisine-content">
                      <h3 className="cuisine-title">{cuisine.name}</h3>
                      <p className="cuisine-description">{cuisine.description}</p>
                      <div className="specialties">
                        <h4>Specialties:</h4>
                        <ul>
                          {cuisine.specialties.map((specialty, index) => (
                            <li key={index}>{specialty}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Features */}
      <section className="special-features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🍽️</div>
              <h3>Fresh Ingredients</h3>
              <p>We use only the freshest ingredients sourced locally to ensure quality and taste</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🍳</div>
              <h3>Expert Chefs</h3>
              <p>Our experienced chefs bring authentic flavors and innovative cooking techniques</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Quick Service</h3>
              <p>Fast and efficient service to ensure you spend more time enjoying the park</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Value Pricing</h3>
              <p>Affordable pricing with generous portions for the whole family</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="eat-cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Satisfy Your Cravings?</h2>
            <p>Visit our restaurant and experience the perfect blend of taste, quality, and service</p>
            <div className="cta-buttons">
              <button className="cta-btn primary">View Full Menu</button>
              <button className="cta-btn secondary">Make Reservation</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EatPage;