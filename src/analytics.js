// src/analytics.js
import ReactGA from 'react-ga4';

export const initGA = () => {
  ReactGA.initialize('G-0GRWC78TSS'); // Replace with your measurement ID
};

export const logPageView = (path) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};
