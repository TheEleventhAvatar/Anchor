import React from 'react';
import { DeviceStatus } from '../types';
import './Sidebar.css';

interface SidebarProps {
  deviceStatus: DeviceStatus;
  unsyncedCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  onToggleDevice: () => void;
  onToggleOnline: () => void;
  onSync: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  deviceStatus,
  unsyncedCount,
  isOnline,
  isSyncing,
  onToggleDevice,
  onToggleOnline,
  onSync,
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Pocket Desktop</h2>
      </div>
      
      <div className="device-status">
        <h3>Phone Status</h3>
        <div className={`status-indicator ${deviceStatus.connected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{deviceStatus.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {deviceStatus.connected && deviceStatus.battery_level !== undefined && (
          <div className="battery-info">
            <span>Battery: {deviceStatus.battery_level}%</span>
            <div className="battery-bar">
              <div 
                className="battery-fill" 
                style={{ width: `${deviceStatus.battery_level}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <button 
          className="toggle-device-btn"
          onClick={onToggleDevice}
        >
          {deviceStatus.connected ? 'Disconnect Phone' : 'Connect Phone'}
        </button>
      </div>

      <div className="sync-status">
        <h3>Sync Status</h3>
        <div className={`online-indicator ${isOnline ? 'online' : 'offline'}`}>
          <div className="online-dot"></div>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        
        <div className="unsynced-info">
          <span>{unsyncedCount} unsynced transcripts</span>
        </div>
        
        <button 
          className="toggle-online-btn"
          onClick={onToggleOnline}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
        
        <button 
          className="sync-btn"
          onClick={onSync}
          disabled={!isOnline || isSyncing || unsyncedCount === 0}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
};
