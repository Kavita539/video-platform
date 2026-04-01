import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

const ProcessingContext = createContext(null);

export const ProcessingProvider = ({ children }) => {
  const [jobs, setJobs] = useState({});
  const listenerRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const socket = getSocket();
      if (!socket || listenerRef.current) return;

      socket.on('video:progress', (payload) => {
        const { videoId, ...rest } = payload;
        setJobs((prev) => ({
          ...prev,
          [videoId]: { ...prev[videoId], ...rest },
        }));
      });

      listenerRef.current = true;
      clearInterval(interval);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const trackVideo = (videoId, initialStatus = 'pending') => {
    setJobs((prev) => ({
      ...prev,
      [videoId]: { stage: 'Queued', progress: 0, status: initialStatus },
    }));
  };

  const getJob = (videoId) => jobs[videoId] || null;

  return (
    <ProcessingContext.Provider value={{ jobs, trackVideo, getJob }}>
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = () => {
  const ctx = useContext(ProcessingContext);
  if (!ctx) throw new Error('useProcessing must be used inside ProcessingProvider');
  return ctx;
};
