// src/analytics.js
import ReactGA from 'react-ga4';

export const initGA = () => {
  ReactGA.initialize('G-EQKP239D8Q'); // Replace with your measurement ID
};

export const logPageView = (path) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};
