import { io } from 'socket.io-client';

const getSocketURL = () => {
  const apiURL = import.meta.env.VITE_API_BASE_URL;
  if (apiURL) {
    try {
      return new URL(apiURL).origin;
    } catch (e) {
      return apiURL.replace(/\/api\/?$/, ''); // Fallback for improperly formatted URLs
    }
  }
  return `http://${window.location.hostname}:8080`;
};

const socket = io(getSocketURL(), {
  transports: ['websocket', 'polling']
});

export default socket;
