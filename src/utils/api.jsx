import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://amiwrites-backend-app-2lp5.onrender.com', // adjust as per backend port
});

export default instance;