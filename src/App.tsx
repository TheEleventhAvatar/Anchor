import { invoke } from "@tauri-apps/api/core";

function App() {
  async function checkUsb() {
    const connected = await invoke("is_usb_connected");
    console.log("USB Detected:", connected);
  }

  return (
    <div>
      <h1>Anchor App</h1>
      <button onClick={checkUsb}>Check USB Connection</button>
    </div>
  );
}

export default App;