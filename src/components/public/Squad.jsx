import React from "react";
import './Squad.css';

const SquadSection = () => { 
    return (
        <section class="squad-section">
  <div class="container">
    <h2 class="section-title">Enjoy With Your Squad</h2>

    <div class="card-grid">

      <div class="squad-card">
        <div class="icon">💼</div>
        <h3>Corporates</h3>
        <p>Break the routine. Build the team.</p>
        <div class="actions">
          <a href="tel:+918300555255" class="btn primary">Enquire Now</a>
        </div>
      </div>

      <div class="squad-card">
        <div class="icon">🎓</div>
        <h3>Colleges</h3>
        <p>Memories beyond the classroom.</p>
        <div class="actions">
          <a href="tel:+918300555255" class="btn primary">Enquire Now</a>
        </div>
      </div>

      <div class="squad-card">
        <div class="icon">🏫</div>
        <h3>Schools</h3>
        <p>Learning meets laughter.</p>
        <div class="actions">
          <a href="tel:+918300555255" class="btn primary">Enquire Now</a>
        </div>
      </div>

      <div class="squad-card">
        <div class="icon">👨‍👩‍👧‍👦</div>
        <h3>Large Groups</h3>
        <p>More people. More fun.</p>
        <div class="actions">
          <a href="tel:+918300555255" class="btn primary">Enquire Now</a>
        </div>
      </div>

    </div>
  </div>
</section>
    );
}
export default SquadSection;