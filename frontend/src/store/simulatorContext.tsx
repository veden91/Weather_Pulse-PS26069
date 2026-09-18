import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSimulatorStatus, startSimulator, stopSimulator, triggerSimulatorPulse } from '../services/api';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';

interface SimulatorContextType {
  isSimulating: boolean;
  toggleSimulation: () => Promise<void>;
  triggerManualPulse: () => Promise<void>;
  isConnected: boolean;
  latestEvent: any | null;
  liveFeed: any[];
  clearLiveFeed: () => void;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export const SimulatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [latestEvent, setLatestEvent] = useState<any | null>(null);
  const [liveFeed, setLiveFeed] = useState<any[]>([]);

  // Check initial simulator status from backend
  useEffect(() => {
    getSimulatorStatus()
      .then((status) => {
        setIsSimulating(status.is_running);
      })
      .catch((err) => console.warn('Could not fetch simulator status:', err));
  }, []);

  const handleWebSocketMessage = (msg: WebSocketMessage) => {
    if (msg.type === 'NEW_REPORT') {
      setLatestEvent(msg.data);
      setLiveFeed((prev) => [msg.data, ...prev.slice(0, 19)]);
    }
  };

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  const toggleSimulation = async () => {
    try {
      if (isSimulating) {
        await stopSimulator();
        setIsSimulating(false);
      } else {
        await startSimulator(4.0);
        setIsSimulating(true);
      }
    } catch (err) {
      console.error('Error toggling simulator:', err);
    }
  };

  const triggerManualPulse = async () => {
    try {
      const res = await triggerSimulatorPulse();
      if (res.report) {
        setLatestEvent(res.report);
        setLiveFeed((prev) => [res.report, ...prev.slice(0, 19)]);
      }
    } catch (err) {
      console.error('Error triggering pulse:', err);
    }
  };

  const clearLiveFeed = () => setLiveFeed([]);

  return (
    <SimulatorContext.Provider
      value={{
        isSimulating,
        toggleSimulation,
        triggerManualPulse,
        isConnected,
        latestEvent,
        liveFeed,
        clearLiveFeed,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulator = () => {
  const context = useContext(SimulatorContext);
  if (!context) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
};
