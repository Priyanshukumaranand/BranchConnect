import React from 'react';
import './About.css';
import Card from '../components/ui/Card';
import SocialLinks from '../components/ui/SocialLinks';
import priyaranjan from '../assets/Photos/PRIYARANJAN.png';
import harapriya from '../assets/Photos/HARAPRIYA.png';
import subham from '../assets/Photos/SHUBHAM.png';
import saumya from '../assets/Photos/SAUMYAJEET.png';
import swedeshna from '../assets/Photos/SWEDESHNA.png';
import biswajit from '../assets/Photos/BISWAJIT.png';
import janmenjay from '../assets/Photos/JANMANJEY.png';
import priyanshu from '../assets/Photos/PRIYANSHU.png';

const team = [
  {
    name: 'Priyaranjan Kumar',
    role: 'Frontend Developer',
    image: priyaranjan,
    socials: {
      github: 'https://github.com/priyaranjan2902',
      linkedin: 'https://in.linkedin.com/in/priyaranjan2902',
      instagram: 'https://www.instagram.com/priyaranjan2902/',
      mail: 'mailto:rajprience2902@gmail.com'
    }
  },
  {
    name: 'Harapriya Swain',
    role: 'Frontend Developer',
    image: harapriya,
    socials: {
      github: 'https://github.com/harapriya1704',
      linkedin: 'https://www.linkedin.com/in/harapriya-swain-75632a256/',
      instagram: 'https://www.instagram.com/harapriya_17/',
      mail: 'mailto:harapriyas1704@gmail.com'
    }
  },
  {
    name: 'Subham Kuanar',
    role: 'Frontend Developer',
    image: subham,
    socials: {
      github: 'https://github.com/kuanarshubham',
      linkedin: 'https://www.linkedin.com/in/kuanarshubham/',
      instagram: 'https://www.instagram.com/shubhamkuanar/',
      mail: 'mailto:kuanarshubham@gmail.com'
    }
  },
  {
    name: 'Saumyajeet Varma',
    role: 'Frontend Developer',
    image: saumya,
    socials: {
      github: 'https://github.com/Saumyajeet-Varma',
      linkedin: 'https://www.linkedin.com/in/saumyajeet-varma-91bb4025a/',
      instagram: 'https://www.instagram.com/_saumyajeet_/',
      mail: 'mailto:saumyajeetv@gmail.com'
    }
  },
  {
    name: 'Swedeshna Mishra',
    role: 'Frontend Developer',
    image: swedeshna,
    socials: {
      github: 'https://github.com/SwedeshnaMishra',
      linkedin: 'https://www.linkedin.com/in/swedeshna-mishra-8a9567251/',
      instagram: 'https://www.instagram.com/__.swedeshna.__/',
      mail: 'mailto:swedeshnamishra364@gmail.com'
    }
  },
  {
    name: 'Biswajit Bhoi',
    role: 'UI/UX Designer',
    image: biswajit,
    socials: {
      linkedin: 'https://www.linkedin.com/in/biswajit-bhoi-2537b5257/',
      instagram: 'https://www.instagram.com/biswajit.bhoi.125/',
      mail: 'mailto:b522016@iiit-bh.ac.in'
    }
  },
  {
    name: 'Janmenjay Panigrahi',
    role: 'Backend Developer',
    image: janmenjay,
    socials: {
      github: 'https://github.com/Janmenjay30',
      linkedin: 'https://www.linkedin.com/in/janmenjay-panigrahi-6806ab28a/',
      mail: 'mailto:janmejaypanigrahi22@gmail.com'
    }
  },
  {
    name: 'Priyanshu Kumar Anand',
    role: 'Backend Developer',
    image: priyanshu,
    socials: {
      github: 'https://github.com/Priyanshukumaranand',
      linkedin: 'https://www.linkedin.com/in/priyanshu-kumar-anand-52b29825a',
      mail: 'mailto:priyanshukumaranandofficial@gmail.com'
    }
  }
];

const About = () => {
  return (
    <div className="about-page">
      <section className="about-hero">
        <p className="about-hero__eyebrow">Building community · Celebrating collaboration</p>
        <h1>Dedicated to connecting every branch across campus.</h1>
        <p className="about-hero__lead">
          A platform dedicated to introducing you to the talented students who are shaping the future of technology. Our website is designed to showcase their skills, projects, and the passion they bring to their field.
        </p>
      </section>

      <section className="about-values" aria-labelledby="values-heading">
        <h2 id="values-heading">Our Mission</h2>
        <div className="values-grid">
          <Card className="mission-card" hoverEffect>
            <p className="mission-text">
              Our mission is to provide a simple, user-friendly experience that highlights the incredible talents of our students. We believe in the power of community and the importance of recognizing the hard work and love that goes into every project.
            </p>
            <div className="mission-card__accent" aria-hidden />
          </Card>
        </div>
      </section>

      <section className="about-team" aria-labelledby="team-heading">
        <header className="about-team__header">
          <h2 id="team-heading">Meet the crew</h2>
          <p>Our multidisciplinary team keeps this platform evolving, ensuring IIIT Network voices are heard loud and clear.</p>
        </header>
        <div className="team-grid">
          {team.map((member) => (
            <Card className="team-card" key={member.name} hoverEffect>
              <div className="team-card__glow-bg" />
              <div className="team-card__image-wrapper">
                <img src={member.image} alt={member.name} loading="lazy" />
              </div>
              <div className="team-card__content">
                <div className="team-card__info">
                  <h3>{member.name}</h3>
                  <span className="team-card__role">{member.role}</span>
                </div>
                <SocialLinks links={member.socials} className="team-card__socials" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
