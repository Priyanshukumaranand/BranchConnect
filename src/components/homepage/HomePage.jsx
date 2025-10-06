import React, { useState, useEffect, useCallback } from 'react'
import './homepage.css';
import imgc1 from '../../assets/carousel_1.png'
import imgc2 from '../../assets/carousel_2.png'
import imgc3 from '../../assets/carousel_3.png'
import video from '../../assets/video.mp4'
const HomePage = () => {
    const totalItems = 3;
    const [slide, setSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const moveNext = useCallback(() => {
        setSlide(prev => (prev === totalItems - 1 ? 0 : prev + 1));
    }, [totalItems]);

    const movePrev = () => {
        setSlide(prev => (prev === 0 ? totalItems - 1 : prev - 1));
    };

    // Auto-play every 5s
    useEffect(() => {
        if (isPaused) return;
        const id = setInterval(moveNext, 5000);
        return () => clearInterval(id);
    }, [moveNext, isPaused]);

    const goTo = (index) => setSlide(index);

  return (
   <div className="homepage">
   <main>

<div className="welcome">
    <p>Welcome</p>
</div>

<div className="content">
    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga, ratione!</p>
</div>

<div className="carousel-container" aria-roledescription="carousel">
    <div
        className="carousel"
        style={{ transform: `translateX(-${slide * 100}%)` }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
    >
        <div className="carousel-item" aria-label="Slide 1 of 3"><img src={imgc1} alt="Showcase 1"/></div>
        <div className="carousel-item" aria-label="Slide 2 of 3"><img src={imgc2} alt="Showcase 2"/></div>
        <div className="carousel-item" aria-label="Slide 3 of 3"><img src={imgc3} alt="Showcase 3"/></div>
    </div>
    <button className="prev" aria-label="Previous slide" onClick={movePrev}>&#10094;</button>
    <button className="next" aria-label="Next slide" onClick={moveNext}>&#10095;</button>
    <div className="carousel-dots" role="tablist" aria-label="Select carousel slide">
        {Array.from({ length: totalItems }).map((_, i) => (
            <button
                key={i}
                className={`dot ${i === slide ? 'active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
                aria-selected={i === slide}
                role="tab"
                onClick={() => goTo(i)}
            />
        ))}
    </div>
</div>

<div className="video-container">
    <video controls>
        <source src={video} type="video/mp4"/>
        Your browser does not support the video tag.
    </video>
</div>

</main> </div>
  )
}

export default HomePage