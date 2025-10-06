import React, { useEffect, useState } from 'react';
import './Societies.css';
import heroOne from '../assets/images/society_pic1.png';
import heroTwo from '../assets/images/society_pic2.png';
import heroThree from '../assets/images/society_pic3.png';
import techsociety from '../assets/images/techsociety.png';
import cult from '../assets/images/cult.jpeg';
import ecell from '../assets/images/e-cell.png';
import fats from '../assets/images/fats.png';
import naps from '../assets/images/naps.jpeg';
import tars from '../assets/images/tars.jpeg';
import paracosm from '../assets/images/paracosm.png';
import sports from '../assets/images/sports.png';
import photogeeks from '../assets/images/photogeeks.png';
import megaheartz from '../assets/images/megaheartz.jpg';
import vedanta from '../assets/images/vedantsamiti.png';
import spicmacay from '../assets/images/spic_macay.jpg';

const heroSlides = [heroOne, heroTwo, heroThree];

const societies = [
  {
    name: 'Tech Society',
    focus: 'Engineering & Robotics',
    description: 'Hackathons, reverse-engineering nights, and deep dives into AI, IoT, and emerging tech.',
    instagram: 'https://www.instagram.com/techsociiitbh/',
    image: techsociety
  },
  {
    name: 'Cult',
    focus: 'Performing Arts',
    description: 'From stage productions to music jam sessions, Cult keeps the campus heartbeat artistic.',
    instagram: 'https://www.instagram.com/cult_iiitbh/',
    image: cult
  },
  {
    name: 'Entrepreneurship Cell',
    focus: 'Startups & Innovation',
    description: 'Pitch bootcamps, founder AMAs, and prototyping labs for students launching ideas that matter.',
    instagram: 'https://www.instagram.com/iiitbh_ecell/',
    image: ecell
  },
  {
    name: 'FATS',
    focus: 'Film & Theatre',
    description: 'Screenwriting clubs, short film festivals, and productions that push creative storytelling.',
    instagram: 'https://www.instagram.com/parda.productions/',
    image: fats
  },
  {
    name: 'NAPS',
    focus: 'News & Publication',
    description: 'Campus storytelling through digital magazines, podcasts, and photo essays.',
    instagram: 'https://www.instagram.com/naps_iiit/',
    image: naps
  },
  {
    name: 'TARS',
    focus: 'Automation & Robotics',
    description: 'Robotics labs, drone prototypes, and national competitions showcasing hardware prowess.',
    instagram: 'https://www.instagram.com/',
    image: tars
  },
  {
    name: 'Paracosm',
    focus: 'Creative Writing',
    description: 'A home for world-builders, poets, and storytellers shaping imaginative universes.',
    instagram: 'https://www.instagram.com/',
    image: paracosm
  },
  {
    name: 'Sports Society',
    focus: 'Athletics & Wellness',
    description: 'League nights, intercollegiate championships, and wellness drives for a balanced lifestyle.',
    instagram: 'https://www.instagram.com/iiitbh_sports/',
    image: sports
  },
  {
    name: 'Photogeeks',
    focus: 'Photography & Media',
    description: 'Storytelling through the lens—covering events, portraits, and campus documentaries.',
    instagram: 'https://www.instagram.com/photogeeks.iiit.bh/',
    image: photogeeks
  },
  {
    name: 'Megaheartz',
    focus: 'Electronics & Communication',
    description: 'Workshops on signal processing, electronics jams, and IEEE project collaborations.',
    instagram: 'https://www.instagram.com/megaheartz_iiitbh/',
    image: megaheartz
  },
  {
    name: 'Vedanta Samiti',
    focus: 'Culture & Heritage',
    description: 'Philosophy circles, classical arts, and heritage walks that keep tradition thriving.',
    instagram: 'https://www.instagram.com/vedantasamiti_iiitbh/',
    image: vedanta
  },
  {
    name: 'SPIC MACAY',
    focus: 'Indian Classical Arts',
    description: 'Immersive baithaks, masterclasses, and yatras with maestros of Indian classical music & dance.',
    instagram: 'https://www.instagram.com/spicmacayofficial',
    image: spicmacay
  }
];

const Societies = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="societies-page">
      <section className="societies-hero">
        <div className="societies-hero__copy">
          <p className="eyebrow">Campus societies · Community first</p>
          <h1>Where passions find their people.</h1>
          <p>
            From robotics tunnels to midnight theatre rehearsals, IIIT Bhubaneswar thrives on its vibrant societies. Explore clubs driven by curiosity, collaboration, and culture.
          </p>
        </div>
        <div className="societies-hero__slider" aria-label="Society highlight carousel">
          {heroSlides.map((slide, index) => (
            <img
              key={slide}
              src={slide}
              alt="Society highlight"
              className={index === activeSlide ? 'active' : ''}
            />
          ))}
          <div className="slider-dots" role="tablist" aria-label="Select society highlight">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                aria-label={`Go to highlight ${index + 1}`}
                aria-selected={activeSlide === index}
                onClick={() => setActiveSlide(index)}
                className={activeSlide === index ? 'active' : ''}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="societies-grid" aria-labelledby="society-grid-heading">
        <header>
          <h2 id="society-grid-heading">Society roster</h2>
          <p>A curated set of societies spanning technology, culture, entrepreneurship, athletics, and the arts.</p>
        </header>
        <div className="society-cards">
          {societies.map((society) => (
            <article className="society-card" key={society.name}>
              <div className="society-card__image" style={{ backgroundImage: `url(${society.image})` }}>
                <div className="society-card__overlay">
                  <p>{society.description}</p>
                  <a href={society.instagram} target="_blank" rel="noreferrer">Follow on Instagram →</a>
                </div>
              </div>
              <div className="society-card__body">
                <h3>{society.name}</h3>
                <span>{society.focus}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Societies;
