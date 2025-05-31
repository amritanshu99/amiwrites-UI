import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api', // adjust as per backend port
});

export default instance;