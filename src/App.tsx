import React, { useEffect, useState } from "react";
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
  const [platformInfo, setPlatformInfo] = useState<string | null>(null);

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

      // Get platform-specific setup info
      try {
        const info = await invoke<string>("setup_platform_permissions");
        setPlatformInfo(info);
      } catch (err) {
        console.log("Platform info:", err);
      }

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
    } finally {
      setLoading(false);
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newData.trim()) {
      addSecureData();
    }
  };

  const LockedView = () => (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">**LOCKED**</h1>
        <h2 className="text-xl font-semibold">Platform Setup Required</h2>
        
        <div className="bg-gray-800 rounded-lg p-4 max-w-md">
          <p className="text-sm text-gray-500 mb-4">
            Your secure database is encrypted and inaccessible. Complete the platform setup below, then insert your SanDisk USB device.
          </p>
          
          <div className="space-y-4 text-left">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-blue-400">Windows Users</h3>
              <p className="text-sm text-gray-400 mt-1">
                1. Download <a href="https://github.com/pbatard/libwdi/releases" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">zadig-2.9.exe</a>
              </p>
              <p className="text-sm text-gray-400">
                2. Run it → Options → List All Devices → Select SanDisk USB → Replace Driver
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-green-400">Linux Users</h3>
              <p className="text-sm text-gray-400 mt-1">
                Run the setup script for USB permissions:
              </p>
              <p className="text-xs text-gray-500 font-mono bg-gray-900 p-2 rounded">
                ./scripts/setup_linux.sh
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Or manually create udev rule:
              </p>
              <p className="text-xs text-gray-500 font-mono bg-gray-900 p-2 rounded">
                echo 'SUBSYSTEM=="usb", ATTR{'{'}idVendor{'}'}=="0x0781", MODE="0666"' | sudo tee /etc/udev/rules.d/99-anchor-sandisk.rules
              </p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold text-yellow-400">macOS Users</h3>
              <p className="text-sm text-gray-400 mt-1">
                No special setup required. Anchor can detect SanDisk USB devices automatically.
              </p>
              <p className="text-sm text-gray-400">
                If you experience issues, check Security & Privacy permissions.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-gray-400 text-lg font-bold"><strong>Done? Please Insert Your SanDisk USB</strong></p>
        
        {platformInfo && (
          <div className="bg-gray-800 rounded-lg p-3 max-w-md">
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Platform Info:</span> {platformInfo}
            </p>
          </div>
        )}
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
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Security Reminder</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Your session will remain active as long as the USB device is connected. Removing the USB will immediately lock the application and secure your data.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return isUnlocked ? <UnlockedView /> : <LockedView />;
}

export default App;