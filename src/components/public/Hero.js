import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 2;
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  const handleBookTickets = () => {
    const authToken = localStorage.getItem("authToken");
    const authRole = localStorage.getItem("authRole");
    
    if (authToken && authRole) {
      // User is logged in, redirect to appropriate dashboard
      if (authRole === "admin") {
        navigate("/admin/dashboard");
      } else if (authRole === "User" || authRole === "SilverUser" || authRole === "GoldUser" || authRole === "PlatinumUser") {
        navigate("/bookings");
      } else if (authRole === "agent") {
        navigate("/agent/dashboard");
      } else {
        // Dispatch event to open login modal
        window.dispatchEvent(new Event('openLoginModal'));
      }
    } else {
      // User is not logged in, dispatch event to open login modal
      window.dispatchEvent(new Event('openLoginModal'));
    }
  };

  const handleDine = () => {
    navigate('/eat');
  };

  const handleExplore = () => {
    navigate('/play');
  };

  return (
    <section className="hero" id="home">
      <div className="hero-slider">
        <div className={`hero-slide ${currentSlide === 0 ? 'active' : ''}`}>
          <div className="hero-image">
            <img src="/assets/hero.jpg" alt="Welcome to AGS Wonderworld" />
          </div>
          <div className="hero-content">
            <h1 className="hero-title">WELCOME TO AGS WONDERWORLD</h1>
            <p className="hero-description">
              Discover a world of excitement and fun at AGS Wonderworld! Immerse yourself in
              thrilling rides, enchanting bird shows, and delectable cuisines at our
              multi-cuisine restaurant. Book your tickets now and get ready for an unforgettable
              adventure!
            </p>
            <button className="hero-cta-btn" onClick={handleBookTickets}>BOOK TICKETS</button>
          </div>
        </div>
        
        <div className={`hero-slide ${currentSlide === 1 ? 'active' : ''}`}>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1566522650166-bd8b3e3a2b4b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" alt="Flying Ride" />
          </div>
          <div className="hero-content">
            <h1 className="hero-title">EXPERIENCE THRILLING RIDES</h1>
            <p className="hero-description">
              Get your adrenaline pumping with our wide array of exhilarating rides suitable
              for all ages.
            </p>
            <div className="hero-action-buttons">
              <button className="action-btn dine-btn" onClick={handleDine}>DINE</button>
              <button className="action-btn explore-btn" onClick={handleExplore}>EXPLORE</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="hero-navigation">
        <button 
          className={`slide-nav-btn ${currentSlide === 0 ? 'active' : ''}`} 
          onClick={() => goToSlide(0)}
        ></button>
        <button 
          className={`slide-nav-btn ${currentSlide === 1 ? 'active' : ''}`} 
          onClick={() => goToSlide(1)}
        ></button>
      </div>
    </section>
  );
};

export default Hero;