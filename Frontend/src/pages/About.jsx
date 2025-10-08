import React from 'react';
import './About.css';
import bgTexture from '../assets/Photos/bg.png';
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
        <p>
          Branch Connect is a student-led initiative from IIIT Bhubaneswar that brings together builders, designers, storytellers, and problem-solvers. We showcase the journeys, skills, and ambitions of every branch community so collaborators and recruiters can connect with rising talent.
        </p>
      </section>

      <section className="about-values" aria-labelledby="values-heading">
        <h2 id="values-heading">What drives us</h2>
        <div className="values-grid">
          <article>
            <h3>Learning in public</h3>
            <p>We document our progress—from early wireframes to production demos—so everyone can learn, iterate, and celebrate together.</p>
          </article>
          <article>
            <h3>Collaborative energy</h3>
            <p>Working across disciplines keeps our solutions grounded. Hardware meets software, storytelling meets systems thinking.</p>
          </article>
          <article>
            <h3>Inclusive growth</h3>
            <p>Every member finds a space to grow—whether through mentorship circles, design critiques, or late-night debugging sessions.</p>
          </article>
        </div>
      </section>

      <section className="about-team" aria-labelledby="team-heading">
        <header>
          <h2 id="team-heading">Meet the crew</h2>
          <p>Our multidisciplinary team keeps this platform evolving, ensuring Branch Connect voices are heard loud and clear.</p>
        </header>
        <div className="team-grid">
          {team.map((member) => (
            <article className="team-card" key={member.name}>
              <div className="team-card__media" style={{ backgroundImage: `url(${bgTexture})` }}>
                <img src={member.image} alt={member.name} loading="lazy" />
              </div>
              <div className="team-card__body">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
              <div className="team-card__socials" aria-label={`${member.name} social links`}>
                {member.socials.github && (
                  <a href={member.socials.github} target="_blank" rel="noreferrer">GitHub</a>
                )}
                {member.socials.linkedin && (
                  <a href={member.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
                )}
                {member.socials.instagram && (
                  <a href={member.socials.instagram} target="_blank" rel="noreferrer">Instagram</a>
                )}
                {member.socials.mail && (
                  <a href={member.socials.mail}>Email</a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
