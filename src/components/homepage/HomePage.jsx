import React from 'react'
import style from './homepage.css';
import imgc1 from '../../assets/carousel_1.png'
import imgc2 from '../../assets/carousel_2.png'
import imgc3 from '../../assets/carousel_3.png'
import video from '../../assets/video.mp4'
import { useState } from 'react'



const HomePage = () => {
    // const [currentIndex,setCurrentIndex] = useState(0);
    // const totalItems=3;

    // const moveCarousel=(direction)=>{
    //     setCurrentIndex((prevIndex)=>{
    //         let newIndex=prevIndex+direction;
    //         if(newIndex<0){
    //             newIndex=totalItems-1;
    //         }
    //         else if(newIndex>=totalItems){
    //             newIndex=0;
    //         }
    //         return newIndex;
    //     })
    // }
    const [slide,setSlide]=useState(0);
    const totalItems=3;

    const moveNext=()=>{
        setSlide(slide===2?0:slide + 1);
    };

    const movePrev=()=>{
        setSlide(slide===0?2:slide-1);
    };

  return (
   <div className={style.HomePage}>
   <main>

<div className="welcome">
    <p>Welcome</p>
</div>

<div className="content">
    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Fuga, ratione!</p>
</div>

<div className="carousel-container">
    <div className="carousel">
        <div className="carousel-item"><img src={imgc1} alt="Image 1"/></div>
        <div className="carousel-item"><img src={imgc2} alt="Image 2"/></div>
        <div className="carousel-item"><img src={imgc3} alt="Image 3"/></div>
    </div>
    <button className="prev" onClick={movePrev}>&#10094;</button>
    <button className="next" onClick={moveNext}>&#10095;</button>
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