import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import slideOne from '../assets/carousel_1.png';
import slideTwo from '../assets/carousel_2.png';
import slideThree from '../assets/carousel_3.png';
import highlightVideo from '../assets/video.mp4';

const heroHeadlines = [
  'Discover the future of tech',
  'Meet the builders of tomorrow',
  'Where passion meets engineering'
];

const batchHighlights = [
  {
    title: 'Batch 2022 · Seniors',
    description: 'The trailblazers leading campus innovation with advanced capstone projects.',
    to: '/batches?year=2022'
  },
  {
    title: 'Batch 2023 · Sophomores',
    description: 'Honing core skills through hackathons, research labs, and peer mentorship.',
    to: '/batches?year=2023'
  },
  {
    title: 'Batch 2024 · Freshers',
    description: 'Fresh energy tackling real-world problems from day one of the bootcamp.',
    to: '/batches?year=2024'
  }
];

const gallerySlides = [
  { src: slideOne, alt: 'Robotics showcase' },
  { src: slideTwo, alt: 'Hackathon demo day' },
  { src: slideThree, alt: 'Cohort collaboration' }
];

const Home = () => {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [pauseCarousel, setPauseCarousel] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setHeadlineIndex((index) => (index + 1) % heroHeadlines.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const goToSlide = useCallback((nextIndex) => {
    const total = gallerySlides.length;
    setSlideIndex(((nextIndex % total) + total) % total);
  }, []);

  const handlePrev = () => goToSlide(slideIndex - 1);
  const handleNext = () => goToSlide(slideIndex + 1);

  useEffect(() => {
    if (pauseCarousel) return;
    const id = setInterval(handleNext, 5000);
    return () => clearInterval(id);
  }, [handleNext, pauseCarousel]);

  const activeHeadline = useMemo(() => heroHeadlines[headlineIndex], [headlineIndex]);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero__intro">
          <p className="hero__eyebrow">Bootcamp · Computer Engineering</p>
          <h1>
            {activeHeadline.split(' ').map((word, index) => (
              <span key={word + index} className={index === 0 ? 'accent' : ''}>{word} </span>
            ))}
          </h1>
          <p className="hero__description">
            Explore student profiles, passion projects, and community-led initiatives from the heart of IIIT Bhubaneswar. We celebrate collaboration, curiosity, and the courage to build bold ideas.
          </p>
          <div className="hero__actions">
            <Link className="primary" to="/enroll">Enroll now</Link>
            <Link className="ghost" to="/societies">Tour the societies</Link>
          </div>
        </div>
        <div className="hero__meta">
          <div className="hero__stat">
            <span className="hero__stat-number">120+</span>
            <span className="hero__stat-label">Active participants</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-number">35</span>
            <span className="hero__stat-label">Student-led projects</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-number">15</span>
            <span className="hero__stat-label">Campus societies</span>
          </div>
        </div>
      </section>

      <section className="batches" aria-labelledby="batch-heading">
        <header>
          <h2 id="batch-heading">Meet the batches</h2>
          <p>Every cohort brings a new wave of creativity. Dive into their journeys, achievements, and future-ready skills.</p>
        </header>
        <div className="batch-grid">
          {batchHighlights.map((batch) => (
            <Link key={batch.title} to={batch.to} className="batch-card">
              <span className="batch-card__tag">Explore</span>
              <h3>{batch.title}</h3>
              <p>{batch.description}</p>
              <span className="batch-card__cta">View profiles →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="gallery" aria-labelledby="gallery-heading">
        <header className="section-heading">
          <h2 id="gallery-heading">Gallery</h2>
          <p>Snapshots from showcase nights, robotics pits, design sprints, and bootcamp celebrations.</p>
        </header>
        <div
          className="carousel"
          onMouseEnter={() => setPauseCarousel(true)}
          onMouseLeave={() => setPauseCarousel(false)}
        >
          <button className="carousel__control prev" onClick={handlePrev} aria-label="Previous slide">‹</button>
          <div className="carousel__track" style={{ transform: `translateX(-${slideIndex * 100}%)` }}>
            {gallerySlides.map((slide, index) => (
              <figure className="carousel__slide" key={slide.alt} aria-hidden={index !== slideIndex}>
                <img src={slide.src} alt={slide.alt} />
                <figcaption>{slide.alt}</figcaption>
              </figure>
            ))}
          </div>
          <button className="carousel__control next" onClick={handleNext} aria-label="Next slide">›</button>
          <div className="carousel__dots" role="tablist" aria-label="Gallery slides">
            {gallerySlides.map((_, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={slideIndex === index}
                aria-label={`Go to slide ${index + 1}`}
                className={slideIndex === index ? 'active' : ''}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="moments" aria-labelledby="moments-heading">
        <header className="section-heading">
          <h2 id="moments-heading">Moments</h2>
          <p>Experience the pulse of the bootcamp through highlights captured by the community.</p>
        </header>
        <div className="moments__media">
          <video controls muted playsInline poster={gallerySlides[2].src}>
            <source src={highlightVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="moments__copy">
            <h3>Inside the lab</h3>
            <p>
              From prototyping wearables to building full-stack dashboards, our cohorts explore diverse domains. Each sprint ends with a showcase where peers, mentors, and alumni exchange feedback and celebrate progress.
            </p>
            <Link to="/societies" className="ghost">Meet society leads</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
