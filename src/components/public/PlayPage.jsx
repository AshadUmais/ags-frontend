import React from 'react';
import './PlayPage.css';
import { id } from 'date-fns/locale';

const PlayPage = () => {
  const landRides = [
    {
      id: 1,
      name: "Car Dasher",
      description: "Buckle up for a speedy spin! Car Dasher lets riders steer through twists and turns, making it a perfect blend of fun and friendly competition for all ages.",
      image: "/assets/D.R.-CAR-DASHER.jpg"
    },
    {
      id: 2,
      name: "Storm Runner",
      description: "Hold on tight as Storm Runner launches you into a whirlwind of motion. Fast turns, sudden drops, and heart-pounding speed make this a must-try thrill ride.",
      image: "/assets/D.R.-STORM-RUNNER.jpg"
    },
    {
      id: 3,
      name: "Sky Swing",
      description: "Soar high and feel the breeze! Sky Swing lifts you up and swings you through the air, offering breathtaking views and a flying sensation you won’t forget.",
      image: "/assets/D.R.-SKY-SWING.jpg"
    },
    {
      id: 4,
      name: "Gravity Strike",
      description: "Defy gravity on this adrenaline-packed ride. Gravity Strike pulls you up and drops you down in powerful motions, delivering pure thrill from start to finish.",
      image: "/assets/D.R.-GRAVITY-STRIKE.jpg",
    },{
      id: 5,
      name:"Carousel",
      description:"A timeless classic for all generations. Enjoy a gentle ride on beautifully crafted animals as the carousel spins to cheerful music—perfect for families and kids.",
      image:"/assets/D.R.-CAROUSEL.jpg"
    },
    {
      id: 6,
      name:"Elephant Roller",
      description:"Climb aboard the friendly elephants for a joyful ride! Elephant Roller takes kids on a smooth, bouncy journey that’s full of smiles and laughter.",
      image:"/assets/D.R.-ELEPHANT-ROLLER.jpg"
    },
    {
      id: 7,
      name:"Sun & Moon",
      description:"A magical ride that takes you around the sky. Sun and Moon offers a calm, floating experience, making it ideal for younger riders and those who enjoy relaxed fun.",
      image:"/assets/D.R.-SUN-N-MOON.jpg"
    }
  ];

  const waterRides = [
    {
      id: 8,
      name: "Slides",
      description: "Get ready for an exciting splash! These water slides send you racing down smooth curves and speedy drops, ending with a refreshing splash that keeps the fun flowing.",
      image: "/assets/W.R-SLIDES.jpg"
    },
    {
      id: 9,
      name: "Tots",
      description: "Designed specially for little ones, Tots offers a safe and playful water experience with gentle sprays, shallow pools, and lots of giggles all around.",
      image: "/assets/W.R.-TOTS.jpg"
    },
    {
      id: 10,
      name: "Hump n Float",
      description: "Ride the waves as you glide over humps and float through flowing water. Hump and Float is a relaxing yet fun ride that’s perfect for cooling off and unwinding.",
      image: "/assets/W.R-HUMP-AND-FLOAT.jpg"
    },
    {
      id: 11,
      name: "Rainbow Tots",
      description: "A colorful water paradise for kids! Rainbow Tots features bright slides, playful water jets, and soft splashes, making it a joyful and safe adventure for young riders.",
      image: "/assets/W.R-RAINBOW-TOTS.jpeg"
    },
    {
      id: 12,
      name:"Watefall Rides",
      description:"Step under cascading water and feel the rush! Water Falls delivers a refreshing experience as streams of water pour down, creating the perfect cool-off zone.",
      image:"/assets/W.R-WATER-FALLS.jpg"
    },
    {
      id: 13,
      name:"Wet Play Zone",
      description:"Experience non-stop water fun at WPS! With exciting sprays, splashes, and interactive water features, this zone keeps the excitement high for all age groups.",
      image:"/assets/W.R-WPS.jpg"
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