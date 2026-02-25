export interface Transcript {
  id: number;
  title: string;
  content: string;
  created_at: string;
  synced: boolean;
}

export interface DeviceStatus {
  connected: boolean;
  battery_level?: number;
  last_seen: string;
}

export interface AppState {
  transcripts: Transcript[];
  deviceStatus: DeviceStatus;
  selectedTranscript: Transcript | null;
  isOnline: boolean;
  unsyncedCount: number;
  isSyncing: boolean;
}
