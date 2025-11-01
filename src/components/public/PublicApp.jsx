import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './Header';
import Hero from './Hero';
import RidesSection from './RidesSection';
import UpdatesSection from './UpdatesSection';
import Footer from './Footer';
import EatPage from './EatPage';
import ContactPage from './ContactPage';
import PlayPage from './PlayPage';
import './WonderWorldApp.css';

// Home Page Component for the public site
const HomePage = () => (
  <>
    <Hero />
    <RidesSection />
    <UpdatesSection />
  </>
);

function PublicApp() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/eat" element={<EatPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default PublicApp;