import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TranscriptList } from './components/TranscriptList';
import { TranscriptDetail } from './components/TranscriptDetail';
import { AddTranscriptForm } from './components/AddTranscriptForm';
import { useTauriCommands } from './hooks/useTauriCommands';
import { Transcript, DeviceStatus } from './types';
import './App.css';

const App: React.FC = () => {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    connected: false,
    battery_level: undefined,
    last_seen: new Date().toISOString(),
  });
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    addTranscript,
    getTranscripts,
    markSynced,
    simulateSync,
    getDeviceStatus,
    getUnsyncedCount,
    toggleDeviceConnection,
    listenForNewTranscripts,
  } = useTauriCommands();

  const loadData = useCallback(async () => {
    try {
      const [transcriptsData, deviceStatusData, unsyncedCountData] = await Promise.all([
        getTranscripts(),
        getDeviceStatus(),
        getUnsyncedCount(),
      ]);

      setTranscripts(transcriptsData);
      setDeviceStatus(deviceStatusData);
      setUnsyncedCount(unsyncedCountData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [getTranscripts, getDeviceStatus, getUnsyncedCount]);

  useEffect(() => {
    loadData();

    const unlisten = listenForNewTranscripts(() => {
      loadData();
    });

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      unlisten.then(fn => fn());
      clearInterval(interval);
    };
  }, [loadData, listenForNewTranscripts]);

  const handleAddTranscript = async (title: string, content: string) => {
    try {
      await addTranscript(title, content);
      await loadData();
    } catch (error) {
      console.error('Failed to add transcript:', error);
    }
  };

  const handleMarkSynced = async (id: number) => {
    try {
      await markSynced(id);
      await loadData();
      
      if (selectedTranscript?.id === id) {
        setSelectedTranscript(prev => prev ? { ...prev, synced: true } : null);
      }
    } catch (error) {
      console.error('Failed to mark transcript as synced:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await simulateSync();
      await loadData();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleDevice = async () => {
    try {
      const newStatus = await toggleDeviceConnection();
      setDeviceStatus(newStatus);
    } catch (error) {
      console.error('Failed to toggle device connection:', error);
    }
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
  };

  return (
    <div className="app">
      <Sidebar
        deviceStatus={deviceStatus}
        unsyncedCount={unsyncedCount}
        isOnline={isOnline}
        isSyncing={isSyncing}
        onToggleDevice={handleToggleDevice}
        onToggleOnline={handleToggleOnline}
        onSync={handleSync}
      />
      
      <div className="main-content">
        <div className="content-area">
          <TranscriptList
            transcripts={transcripts}
            selectedTranscript={selectedTranscript}
            onSelectTranscript={setSelectedTranscript}
          />
          
          <div className="detail-panel">
            <TranscriptDetail
              transcript={selectedTranscript}
              onMarkSynced={handleMarkSynced}
              isOnline={isOnline}
            />
            
            <AddTranscriptForm onAddTranscript={handleAddTranscript} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
