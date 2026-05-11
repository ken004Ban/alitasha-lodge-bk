import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useBranch } from '../context/BranchContext';

let backendAvailable = true;

const useVisitorTracker = () => {
  const location = useLocation();
  const { selectedBranchId } = useBranch();
  const initialised = useRef(false);

  useEffect(() => {
    if (!backendAvailable) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const trackVisit = async () => {
      try {
        await axios.post('http://localhost:5000/api/track', {
          page_path: location.pathname,
          country: 'Zambia',
          city: 'Lusaka',
          browser: navigator.userAgent.slice(0, 80),
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
          ...(selectedBranchId ? { branch_id: selectedBranchId } : {}),
        }, { signal: controller.signal });
      } catch {
        backendAvailable = false;
      } finally {
        clearTimeout(timer);
      }
    };

    if (!initialised.current) {
      initialised.current = true;
      void trackVisit();
    }
  }, [location.pathname, selectedBranchId]);
};

export default useVisitorTracker;
