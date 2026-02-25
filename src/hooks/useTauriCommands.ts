import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Transcript, DeviceStatus } from '../types';

export const useTauriCommands = () => {
  const addTranscript = async (title: string, content: string): Promise<void> => {
    await invoke('add_transcript', { title, content });
  };

  const getTranscripts = async (): Promise<Transcript[]> => {
    return await invoke('get_transcripts');
  };

  const markSynced = async (id: number): Promise<void> => {
    await invoke('mark_synced', { id });
  };

  const simulateSync = async (): Promise<void> => {
    return await invoke('simulate_sync');
  };

  const getDeviceStatus = async (): Promise<DeviceStatus> => {
    return await invoke('get_device_status');
  };

  const getUnsyncedCount = async (): Promise<number> => {
    return await invoke('get_unsynced_count');
  };

  const toggleDeviceConnection = async (): Promise<DeviceStatus> => {
    return await invoke('toggle_device_connection');
  };

  const showWindow = async (): Promise<void> => {
    return await invoke('show_window');
  };

  const hideWindow = async (): Promise<void> => {
    return await invoke('hide_window');
  };

  const listenForNewTranscripts = (callback: () => void) => {
    return listen('new-transcript', callback);
  };

  return {
    addTranscript,
    getTranscripts,
    markSynced,
    simulateSync,
    getDeviceStatus,
    getUnsyncedCount,
    toggleDeviceConnection,
    showWindow,
    hideWindow,
    listenForNewTranscripts,
  };
};
