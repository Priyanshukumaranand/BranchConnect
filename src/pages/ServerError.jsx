import React from 'react';
import { Link } from 'react-router-dom';

const ServerError = () => {
  return (
    <section>
      <h1>Server hiccup</h1>
      <p>We’re experiencing a temporary issue. Please try again in a moment.</p>
      <p><Link to="/">Return home</Link></p>
    </section>
  );
};

export default ServerError;
