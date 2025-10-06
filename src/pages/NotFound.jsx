import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <section>
      <h1>Page not found</h1>
      <p>The page you were looking for doesn’t exist.</p>
      <p><Link to="/">Head back to safety</Link></p>
    </section>
  );
};

export default NotFound;
