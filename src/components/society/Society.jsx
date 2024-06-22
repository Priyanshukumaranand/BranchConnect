import React, { useEffect } from 'react'
// import './script.js'
import style from './society.css'
import cultpic from '../../assets/images/cultpic.png'
import techsociety from "../../assets/images/techsociety.png"
import cult from '../../assets/images/cult.jpeg'
import ecell from '../../assets/images/e-cell.png'
import fats from '../../assets/images/fats.png'
import megahertz from '../../assets/images/megaheartz.jpg'
import naps from '../../assets/images/naps.jpeg'
import paracosm from '../../assets/images/paracosm.png'
import photogeeks from '../../assets/images/photogeeks.png'
import sports from '../../assets/images/sports.png'
import tars from '../../assets/images/tars.jpeg'
import vedenta from '../../assets/images/vedantsamiti.png'
import spicy from '../../assets/images/spic_macay.jpg'

const Society = () => {
  return (
    <div id="society" className={style.Society}>
   
     <header id="header">
            <canvas id="test"></canvas>
            <div className="stars">
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
                <div className="star"></div>
            </div>
            <div className="header-content">
                <h1 className="heading">IIIT Bhubaneswar Societies</h1>
                <div className='console-container'><span id='text'></span><div className='console-underscore' id='console'>&#95;</div></div>
                 {/* <nav class="navbar">
                    <ul class="navbar-menu">
                        <li class="navbar-item"><a href="#">Home</a></li>
                        <li class="navbar-item"><a href="#">About</a></li>
                        <li class="navbar-item"><a href="#">Contact</a></li>
                    </ul>
                </nav>  */}
            </div>
        </header>


    <article className="slider">
		<section className="slide">
			<img src={cultpic} alt=""/>
		</section>
        <section className="slide">
			<img src="assets/images/society_pic2.png" alt=""/>
		</section>

		<section className="slide">
			<img src="assets/images/sportpic.png" alt=""/>

			
		</section>

		<section className="slide">
			<img src="assets/images/society_pic1.png" alt=""/>
		</section>
        <section className="slide">
			<img src="assets/images/society_pic3.png" alt=""/>
		</section>
		<nav className="slider-nav">
			<span className="prev-slide"></span>
			<span className="next-slide"></span>
		</nav>
	</article>
	{/* <!-- end Slider --> */}

	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>

	<script>
		window.jQuery || document.write('<script src="js/lib/jquery-v3.4.1.js"></script>');
	</script>

    <div className="societies-container">

        <div className="card"  onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={techsociety} alt="Image 3"/>
                    <h2>TECH</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/techsociiitbh/" target="_blank" class="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p  className="society_desc">The Tech Society at IIIT Bhubaneswar is a hub for innovation and technology enthusiasts. We regularly organize workshops, seminars, and hackathons to enhance skills in areas such as AI, web development, and cybersecurity. Join us to collaborate on cutting-edge projects and stay ahead in the tech world!</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="card" onclick="flipCard(this)" >
            <div className="card-inner">
                <div className="card-front">
                    <img src={cult} alt="Image 1"/>
                    <h2>CULT</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/cult_iiitbh/" target="_blank" class="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p  className="society_desc">The Cultural Society at IIIT Bhubaneswar celebrates diversity and creativity through various art forms. From music and dance to drama and literature, we provide a platform for students to showcase their talents and explore different cultural experiences. Join us in promoting cultural exchange and unity!</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="card"  onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={ecell} alt="Image 2"/>
                    <h2>Entrepreneurship Cell</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/iiitbh_ecell/" target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p  className="society_desc">The Entrepreneurship Cell at IIIT Bhubaneswar is dedicated to fostering an entrepreneurial mindset among students. Through workshops, mentorship programs, and networking events, we empower aspiring entrepreneurs to turn their ideas into successful ventures. Join us in shaping the future of innovation and business leadership!</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="card"  onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={fats} alt="Image 3"/>
                    <h2>FATS</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/parda.productions/" target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p  className="society_desc">The Film and Theatre Society at IIIT Bhubaneswar is a creative hub for students passionate about storytelling through cinema and stage. From scriptwriting and acting to directing and production, we provide a platform to explore the art of filmmaking and theatre. Join us to unleash your creativity and bring captivating stories to life!</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="card"   onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={naps} alt="Image 3"/>
                    <h2>NAPS</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/naps_iiit/" target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p className="society_desc">The News and Publication Society at IIIT Bhubaneswar is dedicated to keeping the student community informed and engaged. Through our publications and digital platforms, we cover campus news, events, and issues of interest. Join us to hone your writing skills, share your voice, and stay connected with campus happenings!</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="card"   onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={tars} alt="Image 3"/>
                    <h2>TARS</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href={tars} target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p className="society_desc">The Automation and Robotics Society (TARS) at IIIT Bhubaneswar is at the forefront of technological innovation. We explore the realms of automation and robotics, pushing boundaries to create cutting-edge solutions for real-world challenges. Join us to delve into the fascinating world of robotics, enhance your technical skills, and be part of groundbreaking projects that shape the future</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="card"   onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={paracosm} alt="Image 3"/>
                    <h2>PARACOSM</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href={paracosm} target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p className="society_desc">Welcome to the Paracosm Society at IIIT Bhubaneswar, where imagination knows no bounds. As a community of dreamers, thinkers, and creators, we delve into the realm of paracosms – intricate worlds crafted from the depths of our minds. Through storytelling, art, and exploration, we bring these alternate realities to life, fostering creativity and wonder among our members.</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="card"   onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={sports} alt="Image 3"/>
                    <h2>SPORTS</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/iiitbh_sports/" target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p className="society_desc">Join the Sports Society at IIIT Bhubaneswar and embrace the thrill of athleticism and teamwork. Whether you're passionate about football, cricket, basketball, or any other sport, our society provides a platform for students to engage in friendly competition, stay active, and build lifelong friendships. From exhilarating matches to fitness challenges, we celebrate the joy of sportsmanship and camaraderie.</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="card"   onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={photogeeks} alt="Image 3"/>
                    <h2>PHOTOGEEKS</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/photogeeks.iiit.bh/" target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p className="society_desc">Welcome to the Photogeeks Society at IIIT Bhubaneswar, where passion meets the lens. As a community of photography enthusiasts, we explore the art of capturing moments, emotions, and stories through our cameras. From landscapes to portraits, from still life to action shots, we strive to hone our skills, express our creativity, and share our unique perspectives with the world.</p>
                    </div>
                </div>
            </div>
        </div>
        

        <div className="card"   onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={megahertz} alt="Image 3"/>
                    <h2>MEGAHEARTZ</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/megaheartz_iiitbh/" target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p className="society_desc">Welcome to the Megahertz Society at IIIT Bhubaneswar, where innovation resonates at the speed of light. As a community of tech enthusiasts, we delve into the exciting world of electronics, telecommunications, and signal processing. From circuit design to wireless communication, from microcontrollers to high-frequency systems, we explore the forefront of technology and strive to push the boundaries of what's possible.</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="card"   onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={vedenta} alt="Image 3"/>
                    <h2>VEDANTA SAMITI</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/vedantasamiti_iiitbh/" target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p className="society_desc">Welcome to Vedanta Samiti at IIIT Bhubaneswar, where ancient wisdom meets modern exploration. As a society dedicated to the study and dissemination of Vedanta philosophy, we delve into the profound teachings of the Vedas, Upanishads, and other sacred texts. Through discussions, lectures, and spiritual practices, we seek to uncover the timeless truths and practical wisdom found in these ancient scriptures, guiding us on a path of self-discovery and inner transformation.</p>
                    </div>
                </div>
            </div>
        </div>
    
        <div className="card"   onclick="flipCard(this)">
            <div className="card-inner">
                <div className="card-front">
                    <img src={spicy} alt="Image 3"/>
                    <h2>SPIC MACAY</h2>
                </div>
                <div className="card-back">
                    <div>
                        <a href="https://www.instagram.com/spicmacayofficial" target="_blank" className="instagram-button">
                            <i className="fab fa-instagram"></i>
                            Follow on Instagram
                          </a>
                        <p className="society_desc" >TWelcome to SPIC MACAY at IIIT Bhubaneswar, where culture comes alive through the magic of the arts. As a society dedicated to promoting Indian classical music, dance, and culture, we strive to enrich the lives of students through immersive experiences and enriching interactions with renowned artists. From mesmerizing performances to enlightening workshops and interactive sessions, we aim to foster a deeper appreciation for our rich cultural heritage and traditions.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {/* <script src={scr}></script> */}
    </div>
  )
}

export default Society