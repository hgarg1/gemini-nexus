import { app, BrowserWindow, shell, ipcMain, Tray, Menu, Notification } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let pendingFilePath: string | null = null; // Store file path if app is not yet ready

const startUrl = process.env.NEXUS_URL || 'http://localhost:3005';

// Handle file opening on macOS
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) {
    handleNexusFile(filePath);
  } else {
    pendingFilePath = filePath;
  }
});

function handleNexusFile(filePath: string) {
  if (!filePath.endsWith('.nexus')) return;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Send to web app via IPC or URL parameter
    // For now, we'll send an IPC message. The web app must listen for 'open-nexus-file'
    mainWindow?.webContents.send('fromMain', { 
      type: 'open-nexus-file', 
      path: filePath, 
      content 
    });
    
    // Focus the window
    if (mainWindow?.isMinimized()) mainWindow.restore();
    mainWindow?.focus();
  } catch (err) {
    console.error('Failed to read .nexus file:', err);
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          overflow: hidden;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: ui-monospace, monospace;
          color: #00f2ff;
        }
        .loader-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .hexagon {
          width: 100px;
          height: 115px;
          background: rgba(0, 242, 255, 0.1);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          position: relative;
          border: 2px solid #00f2ff;
          animation: rotate 4s linear infinite, pulse 2s ease-in-out infinite;
          box-shadow: 0 0 30px rgba(0, 242, 255, 0.5);
        }
        .hexagon::after {
          content: '';
          position: absolute;
          inset: 10px;
          background: rgba(0, 242, 255, 0.2);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          animation: rotate-reverse 2s linear infinite;
        }
        .status-text {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5em;
          text-transform: uppercase;
          text-shadow: 0 0 10px #00f2ff;
          animation: blink 1s step-end infinite;
        }
        .progress-bar {
          width: 200px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }
        .progress-fill {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 50%;
          background: #00f2ff;
          box-shadow: 0 0 10px #00f2ff;
          animation: move 2s ease-in-out infinite;
        }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes rotate-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes move { 0% { left: -50%; } 100% { left: 100%; } }
      </style>
    </head>
    <body>
      <div class="loader-container">
        <div class="hexagon"></div>
        <div class="status-text">Initializing_Nexus_Core</div>
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>
    </body>
    </html>
  `;
  splashWindow.loadURL(`data:text/html;base64,${Buffer.from(html).toString('base64')}`);
}

function createWindow() {
  const iconPath = path.join(app.getAppPath(), 'assets/icon.png');
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Show only after splash or load
    frame: false, // Frameless window
    titleBarStyle: 'hidden', // Keep standard window controls overlay on macOS
    title: "Nexus",
    icon: iconPath,
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#050508',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const loadApp = () => {
    mainWindow?.loadURL(startUrl).then(() => {
        // Destroy splash and show main window
        if (splashWindow) {
            setTimeout(() => {
                splashWindow?.close();
                mainWindow?.show();
                
                // Handle macOS pending file
                if (pendingFilePath) {
                  handleNexusFile(pendingFilePath);
                  pendingFilePath = null;
                }
                
                // Handle Windows/Linux command line file
                const args = process.argv;
                if (process.platform !== 'darwin' && args.length >= 2) {
                  const filePath = args[args.length - 1];
                  if (filePath.endsWith('.nexus')) {
                    handleNexusFile(filePath);
                  }
                }
            }, 2500); // Cinematic delay
        } else {
            mainWindow?.show();
        }
    }).catch((err) => {
      console.log('Failed to load app, showing error page:', err);
      splashWindow?.close();
      mainWindow?.show();
      mainWindow?.loadFile(path.join(__dirname, 'error.html'));
    });
  };

  loadApp();

  // Create System Tray
  try {
    const trayIconPath = path.join(app.getAppPath(), 'assets/tray-icon.png');
    tray = new Tray(trayIconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show App', click: () => mainWindow?.show() },
      { label: 'Quit', click: () => app.quit() },
    ]);
    tray.setToolTip('Nexus Core');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      mainWindow?.isVisible() ? mainWindow.hide() : mainWindow?.show();
    });
  } catch (e) {
    console.log('Tray creation failed:', e);
  }

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle Retry and Quit
  ipcMain.on('toMain', (event, arg) => {
    if (arg.type === 'retry-connection') {
      loadApp();
    }
    if (arg.type === 'quit-app') {
      app.quit();
    }
    if (arg.type === 'notify') {
      new Notification({
        title: arg.title,
        body: arg.body,
      }).show();
    }
  });

  ipcMain.on('window-control', (event, action) => {
    if (!mainWindow) return;
    switch (action) {
      case 'minimize':
        mainWindow.minimize();
        break;
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case 'close':
        // Minimize to tray if available, else close
        if (tray) {
            mainWindow.hide();
        } else {
            mainWindow.close();
        }
        break;
    }
  });
}

app.whenReady().then(() => {
  createSplashWindow();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
