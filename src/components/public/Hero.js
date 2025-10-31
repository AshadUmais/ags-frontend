import React, { useState, useEffect } from 'react';
import './Hero.css';

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 2;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  return (
    <section className="hero" id="home">
      <div className="hero-slider">
        <div className={`hero-slide ${currentSlide === 0 ? 'active' : ''}`}>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2020&q=80" alt="Welcome to AGS Wonderworld" />
          </div>
          <div className="hero-content">
            <h1 className="hero-title">WELCOME TO AGS WONDERWORLD</h1>
            <p className="hero-description">
              Discover a world of excitement and fun at AGS Wonderworld! Immerse yourself in
              thrilling rides, enchanting bird shows, and delectable cuisines at our
              multi-cuisine restaurant. Book your tickets now and get ready for an unforgettable
              adventure!
            </p>
            <button className="hero-cta-btn">BOOK TICKETS</button>
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
              <button className="action-btn dine-btn">DINE</button>
              <button className="action-btn explore-btn">EXPLORE</button>
              <button className="action-btn relax-btn">RELAX & ENJOY</button>
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