import React from 'react'
import style from './about.css'
import priyaranjan from '../../assets/Photos/PRIYARANJAN.png'
import harapriya from '../../assets/Photos/HARAPRIYA.png'
import jhony from '../../assets/Photos/JANMANJEY.png'
import biswa from '../../assets/Photos/BISWAJIT.png'
import priyanshu from '../../assets/Photos/PRIYANSHU.png'
import saumyajeet from '../../assets/Photos/SAUMYAJEET.png'
import swedeshna from '../../assets/Photos/SWEDESHNA.png'
import subham from '../../assets/Photos/SHUBHAM.png'
// import './script'
import bn from '../../assets/Photos/bg.png'
const About = () => {
    return (
        <div className={style.About}>
            <section class="about" id="about">
                <div class="about-us">
                    <h1>ABOUT US</h1>
                    <div id="container">
                        <span id="text1"></span>
                        <span id="text2"></span>
                    </div>

                    <svg id="filters">
                        <defs>
                            <filter id="threshold">
                                <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0
                              0 1 0 0 0
                              0 0 1 0 0
                              0 0 0 255 -140" />
                            </filter>
                        </defs>
                    </svg>
                    <p>A platform dedicated to introducing you to the talented computer engineering students who are shaping the future of technology. Our website is designed to showcase their skills, projects, and the passion they bring to their field.</p>
                    <p>Our mission is to provide a simple, user-friendly experience that highlights the incredible talents of our computer engineering students. We believe in the power of community and the importance of recognizing the hard work and love that goes into every project.</p>
                </div>
                <div class="team">
                    <h2>Our Team</h2>
                    <div class="our-team">
                        <div class="card">
                            <img class="bg" src={bn} />
                            <img class="one" src={priyaranjan} />
                            <h3>PRIYARANJAN KUMAR</h3>
                            <h4>Frontend Developer</h4>
                            <div class="icon">
                                <a href="https://github.com/priyaranjan2902"> <i class="fa fa-github" ></i></a>
                                <a href="https://in.linkedin.com/in/priyaranjan2902"> <i class="fa fa-linkedin" ></i></a>
                                <a href="https://www.instagram.com/priyaranjan2902/"> <i class="fa fa-instagram" ></i></a>
                                <a href="rajprience2902@gmail.com"> <i class="fa fa-envelope" ></i></a>
                            </div>
                        </div>
                        <div class="card">
                            <img class="bg" src={bn} />
                            <img class="one" src={harapriya} />
                            <h3>HARAPRIYA SWAIN</h3>
                            <h4>Frontend Developer</h4>
                            <div class="icon">
                                <a href=""> <i class="fa fa-github" ></i></a>
                                <a href="https://www.linkedin.com/in/harapriya-swain-75632a256/"> <i class="fa fa-linkedin" ></i></a>
                                <a href="https://www.instagram.com/harapriya_17/"> <i class="fa fa-instagram" ></i></a>
                                <a href=""> <i class="fa fa-envelope" ></i></a>
                            </div>
                        </div>
                        <div class="card">
                            <img class="bg" src={bn} />
                            <img class="one" src={subham} />
                            <h3>SUBHAM KUANAR</h3>
                            <h4>Frontend Developer</h4>
                            <div class="icon">
                                <a href=""> <i class="fa fa-github" ></i></a>
                                <a href="https://www.linkedin.com/in/kuanarshubham/"> <i class="fa fa-linkedin" ></i></a>
                                <a href="https://www.instagram.com/shubhamkuanar/"> <i class="fa fa-instagram" ></i></a>
                                <a href=""> <i class="fa fa-envelope" ></i></a>
                            </div>
                        </div>
                        <div class="card">
                            <img class="bg" src={bn} />
                            <img class="one" src={saumyajeet} />
                            <h3>SAUMYAJEET VARMA</h3>
                            <h4>Frontend Developer</h4>
                            <div class="icon">
                                <a href="https://github.com/Saumyajeet-Varma"> <i class="fa fa-github" ></i></a>
                                <a href="https://www.linkedin.com/in/saumyajeet-varma-91bb4025a/"> <i class="fa fa-linkedin" ></i></a>
                                <a href="https://www.instagram.com/_saumyajeet_/"> <i class="fa fa-instagram" ></i></a>
                                <a href=""> <i class="fa fa-envelope" ></i></a>
                            </div>
                        </div>
                        <div class="card">
                            <img class="bg" src={bn} />
                            <img class="one" src={swedeshna} />
                            <h3>SWEDESHNA MISHRA</h3>
                            <h4>Frontend Developer</h4>
                            <div class="icon">
                                <a href="https://github.com/SwedeshnaMishra"> <i class="fa fa-github" ></i></a>
                                <a href="https://www.linkedin.com/in/swedeshna-mishra-8a9567251/"> <i class="fa fa-linkedin" ></i></a>
                                <a href="https://www.instagram.com/__.swedeshna.__/"> <i class="fa fa-instagram" ></i></a>
                                <a href="swedeshnamishra364@gmail.com"> <i class="fa fa-envelope" ></i></a>
                            </div>
                        </div>
                        <div class="card">
                            <img class="bg" src={bn} />
                            <img class="one" src={biswa} />
                            <h3>BISWAJIT BHOI</h3>
                            <h4>UI/UX Designer</h4>
                            <div class="icon">
                                <a href=""> <i class="fa fa-github" ></i></a>
                                <a href="https://www.linkedin.com/in/biswajit-bhoi-2537b5257/"> <i class="fa fa-linkedin" ></i></a>
                                <a href="https://www.instagram.com/biswajit.bhoi.125/"> <i class="fa fa-instagram" ></i></a>
                                <a href=""> <i class="fa fa-envelope" ></i></a>
                            </div>
                        </div>
                        <div class="card">
                            <img class="bg" src={bn} />
                            <img class="one" src={jhony} />
                            <h3>JANMENJAY PANIGRAHI</h3>
                            <h4>Backend Developer</h4>
                            <div class="icon">
                                <a href=""> <i class="fa fa-github" ></i></a>
                                <a href="https://www.linkedin.com/in/janmenjay-panigrahi-6806ab28a/"> <i class="fa fa-linkedin" ></i></a>
                                <a href=""> <i class="fa fa-instagram" ></i></a>
                                <a href=""> <i class="fa fa-envelope" ></i></a>
                            </div>
                        </div>
                        <div class="card">
                            <img class="bg" src={bn} />
                            <img class="one" src={priyanshu} />
                            <h3>PRIYANSHU KUMAR ANAND</h3>
                            <h4>Backend Developer</h4>
                            <div class="icon">
                                <a href="https://github.com/Priyanshukumaranand"> <i class="fa fa-github" ></i></a>
                                <a href="http://www.linkedin.com/in/priyanshu-kumar-anand-52b29825a"> <i class="fa fa-linkedin" ></i></a>
                                <a href=""> <i class="fa fa-instagram"></i></a>
                                <a href="priyanshukumaranandofficial@gmail.com"> <i class="fa fa-envelope" ></i></a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}

export default About