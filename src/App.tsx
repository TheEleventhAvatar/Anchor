import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

interface HardwareStatusEvent {
  connected: boolean;
  serial_number?: string;
}

interface SecureData {
  data: string;
}

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [usbSerial, setUsbSerial] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [secureData, setSecureData] = useState<SecureData[]>([]);
  const [newData, setNewData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const setupHardwareListener = async () => {
      const unlisten = await listen<HardwareStatusEvent>("hardware-status", (event) => {
        const { connected, serial_number } = event.payload;
        
        if (connected) {
          setIsUnlocked(true);
          setUsbSerial(serial_number || null);
          setDbInitialized(false);
          setSecureData([]);
          console.log("USB Connected - Serial:", serial_number);
        } else {
          setIsUnlocked(false);
          setUsbSerial(null);
          setDbInitialized(false);
          setSecureData([]);
          setNewData("");
          console.log("USB Disconnected - Session Wiped");
        }
        setError(null);
      });

      return unlisten;
    };

    setupHardwareListener();
  }, []);

  const initializeDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<string>("initialize_database");
      console.log(result);
      setDbInitialized(true);
      await loadSecureData();
    } catch (err) {
      setError(`Failed to initialize database: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSecureData = async () => {
    try {
      const data = await invoke<string[]>("get_secure_data");
      setSecureData(data.map(item => ({ data: item })));
    } catch (err) {
      setError(`Failed to load data: ${err}`);
    }
  };

  const addSecureData = async () => {
    if (!newData.trim()) return;
    
    const dataToAdd = newData.trim();
    setNewData(""); // Clear input immediately
    
    try {
      setLoading(true);
      setError(null);
      await invoke<string>("add_secure_data", { data: dataToAdd });
      await loadSecureData();
    } catch (err) {
      setError(`Failed to add data: ${err}`);
      setNewData(dataToAdd); // Restore data on error
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newData.trim()) {
      addSecureData();
    }
  };

  const LockedView = () => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <div className="w-2 h-2 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-1 h-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Anchor - Locked</h1>
        <h2 className="text-xl font-semibold">Note: Windows Users need to complete the quick 1 minute setup</h2>
        <p>Download zadig-2.9.exe from <a href="https://github.com/pbatard/libwdi/releases" target="_blank" rel="noopener noreferrer">https://github.com/pbatard/libwdi/releases</a></p>
        <p>Run it {"->"} click on options {"->"} List all Devices {"->"} select your SanDisk USB {"->"} Replace Driver </p>
        <p className="text-gray-400 text-lg">Please Insert Your SanDisk USB Key</p>
        <div className="bg-gray-800 rounded-lg p-4 max-w-md">
          <p className="text-sm text-gray-500">
            Your secure database is encrypted and inaccessible. Insert your registered SanDisk USB device to unlock access.
          </p>
        </div>
      </div>
    </div>
  );

  const UnlockedView = () => (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Anchor Dashboard</h1>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">USB Connected</span>
              {usbSerial && (
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  {usbSerial}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Secure Database</h2>
            
            {!dbInitialized ? (
              <div>
                <p className="text-gray-600 mb-4">Initialize your encrypted SQLite database to begin storing secure data.</p>
                <button 
                  onClick={initializeDatabase}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Initializing..." : "Initialize Database"}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">Database Active</span>
                  </div>
                  <p className="text-sm text-gray-500">Encrypted database ready for secure operations</p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Add New Data</h3>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newData}
                      onChange={(e) => setNewData(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter secure data..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={addSecureData}
                      disabled={loading || !newData.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Adding..." : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stored Data ({secureData.length})</h2>
            
            {!dbInitialized ? (
              <p className="text-gray-500 text-sm">Initialize database to view stored data</p>
            ) : secureData.length === 0 ? (
              <p className="text-gray-500 text-sm">No data stored yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {secureData.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded p-3">
                    <div className="text-sm font-medium text-gray-900">{item.data}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Status</h2>
            <p className="text-gray-600">Active session with hardware key</p>
            <div className="mt-4">
              <div className="text-sm text-green-600 font-medium">✓ Authenticated</div>
              <div className="text-sm text-gray-500 mt-1">
                Database: {dbInitialized ? "Initialized" : "Not Initialized"}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Security Info</h2>
            <p className="text-gray-600">Hardware-based encryption active</p>
            <div className="mt-4">
              <div className="text-sm text-gray-500">
                Remove USB to lock immediately
              </div>
              <div className="text-sm text-gray-500">
                Data entries: {secureData.length}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Security Reminder</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Your session will remain active as long as the USB device is connected. Removing the USB will immediately lock the application and secure your data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return isUnlocked ? <UnlockedView /> : <LockedView />;
}

export default App;