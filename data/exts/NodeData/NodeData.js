(function (Scratch) {
  "use strict";
  
  const ext = {
    id: "DragoNodeData",
    name: Scratch.translate("Node Data"),
    colors: ["#31c300ff", "#419c00ff", "#196000ff"]
  };

  if (!Scratch.extensions.unsandboxed) {
    throw new Error(`"${ext.name}" must be ran unsandboxed.`);
  }

  const hasNodeJS = typeof process !== "undefined" && !!process.versions && !!process.versions.node;
  const isPackaged = !window.ReduxStore?.getState && !!window.scaffolding?.runtime;
  const {Cast, BlockType, BlockShape, ArgumentType, vm} = Scratch;
  const {runtime} = vm;

  let safeguardAlerts = true;
  if (hasNodeJS) {
    const scratchNodeEnv = process.env.ScratchNodeJSFreedom;
    if (isPackaged || (scratchNodeEnv && scratchNodeEnv.toString() === 'true')) {
      safeguardAlerts = false;
    } else {
      safeguardAlerts = true;
    }
  }

  let safeguardBypass = false;

  let fs, path, os, child_process, psList, si;
  if (hasNodeJS) {
    fs = require("fs");
    path = require("path");
    os = require("os");
    child_process = require("child_process");
    
    try {
      psList = require("ps-list");
    } catch (e) {
    }
    
    try {
      si = require("systeminformation");
    } catch (e) {
    }
  }

  function getDrive(pathl, allowMany) {
    const match = Array.from(String(pathl).matchAll(/(^.+:\\)(.*$)/gi))[0];
    if (!match || !match[1]) return null;
    if (!allowMany && match[1].length !== 3) return null;
    return match[1].slice(0, match[1].indexOf(":\\"));
  }

  function getRootWIN(defaultable) {
    const L = getDrive(process.env["SYSTEMROOT"] || process.env["SystemRoot"] || defaultable || "");
    if (L == void 0) return null;
    return `${L}:\\`;
  }

  class NodeDataExtension {
    constructor() {
      if (hasNodeJS) {
        this.focusDirectory = path.dirname(process.execPath);
        process.chdir(this.focusDirectory);
      } else {
        this.focusDirectory = "";
      }

      this.lastUploadedFile = null;
      this.lastUploadSuccess = false;
      this.lastFilePickerSuccess = false;
      this.lastDownloadSuccess = false;
      this.lastPickedFolder = "";

      this.changeTrackers = new Map();
      this.trackerUpdateInterval = 1000;
      this.trackerIntervalId = null;

      this._startTrackerInterval();
      
      this.applicationsCache = [];
      this.applicationsCacheTime = 0;
      this.applicationsCacheTTL = 5000;
      
      this.windowStates = new Map();
      
      this.showCategory = {
        directory: false,
        files: false,
        applications: false,
        computerInfo: false,
        internet: false,
        environment: false,
        fileUploadDownload: false,
        changeTracking: false
      };
      
      if (runtime && runtime.registerHat) {
        runtime.registerHat(
          "DragoNodeData_whenChangeTrackerTriggered",
          (args, util) => {
            return this.changeTrackers.has(Cast.toString(args.TRACKER || args.tracker));
          },
          {
            TRACKER: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: "tracker1"
            }
          }
        );
      }

      this._loadSafeguardState();
    }

    async _loadSafeguardState() {
      try {
        if (Scratch.extensions.extensionStorage) {
          const stored = await Scratch.extensions.extensionStorage.get('safeguardAlerts');
          if (stored !== undefined) {
            safeguardAlerts = stored;
          }
        }
      } catch (error) {
      }
    }

    async _saveSafeguardState() {
      try {
        if (Scratch.extensions.extensionStorage) {
          await Scratch.extensions.extensionStorage.set('safeguardAlerts', safeguardAlerts);
        }
      } catch (error) {
      }
    }

    setSafeguardBypass(value) {
      safeguardBypass = !!value;
    }

    _startTrackerInterval() {
      if (!hasNodeJS || this.changeTrackers.size === 0) {
        if (this.trackerIntervalId) {
          clearInterval(this.trackerIntervalId);
          this.trackerIntervalId = null;
        }
        return;
      }
      
      if (this.trackerIntervalId) {
        clearInterval(this.trackerIntervalId);
      }
      
      this.trackerIntervalId = setInterval(() => {
        this._checkAllTrackers();
      }, this.trackerUpdateInterval);
    }

    _checkAllTrackers() {
      if (!hasNodeJS || this.changeTrackers.size === 0) return;

      for (const [trackerName, tracker] of this.changeTrackers.entries()) {
        try {
          if (!fs.existsSync(tracker.path)) {
            tracker.lastCheckTime = null;
            continue;
          }
          
          const stats = fs.statSync(tracker.path);
          const currentTime = stats.mtime.getTime();
          
          if (!tracker.lastCheckTime) {
            tracker.lastCheckTime = currentTime;
            continue;
          }
          
          if (currentTime !== tracker.lastCheckTime) {
            this._triggerTrackerHat(trackerName);
            tracker.lastCheckTime = currentTime;
          }
        } catch (error) {
        }
      }
    }

    _triggerTrackerHat(trackerName) {
      try {
        if (Scratch.vm && Scratch.vm.runtime) {
          Scratch.vm.runtime.startHats("DragoNodeData_whenChangeTrackerTriggered", {
            TRACKER: trackerName,
          });
        }
      } catch (error) {
      }
    }

    _getCurrentExecutableInfo() {
      if (!hasNodeJS) return null;
      
      try {
        return {
          name: path.basename(process.execPath),
          directory: path.dirname(process.execPath),
          pid: process.pid,
          ppid: process.ppid,
          args: process.argv,
          execPath: process.execPath
        };
      } catch (error) {
        return null;
      }
    }

    async _getApplications() {
      if (!hasNodeJS) return [];
      
      const now = Date.now();
      if (now - this.applicationsCacheTime < this.applicationsCacheTTL && this.applicationsCache.length > 0) {
        return this.applicationsCache;
      }
      
      try {
        let apps = [];
        const platform = os.platform();
        
        if (psList) {
          const processes = await psList();
          apps = processes.map(p => ({
            name: p.name,
            pid: p.pid,
            cmd: p.cmd || '',
            ppid: p.ppid,
            instances: [{ pid: p.pid, ppid: p.ppid, cmd: p.cmd || '' }]
          }));
        } else if (platform === 'win32') {
          const result = child_process.execSync('tasklist /FO CSV /NH', { encoding: 'utf8' });
          const lines = result.split('\n').filter(line => line.trim());
          
          const appMap = new Map();
          
          for (const line of lines) {
            const match = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
            if (match) {
              const name = match[1].replace(/\.exe$/i, '');
              const pid = parseInt(match[2]);
              const cmd = match[1];
              const ppid = parseInt(match[4]);
              
              if (!appMap.has(name)) {
                appMap.set(name, {
                  name: name,
                  pid: pid,
                  cmd: cmd,
                  ppid: ppid,
                  instances: []
                });
              }
              
              appMap.get(name).instances.push({ pid, ppid, cmd });
            }
          }
          
          apps = Array.from(appMap.values());
        } else if (platform === 'darwin') {
          const result = child_process.execSync('ps -A -o pid=,ppid=,comm=', { encoding: 'utf8' });
          const lines = result.split('\n').filter(line => line.trim());
          const appMap = new Map();
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
              const pid = parseInt(parts[0]);
              const ppid = parseInt(parts[1]);
              const name = parts.slice(2).join(' ').split('/').pop().replace(/\..*$/, '');
              
              if (!appMap.has(name)) {
                appMap.set(name, {
                  name: name,
                  pid: pid,
                  cmd: name,
                  ppid: ppid,
                  instances: []
                });
              }
              
              appMap.get(name).instances.push({ pid, ppid, cmd: name });
            }
          }
          
          apps = Array.from(appMap.values());
        } else {
          const result = child_process.execSync('ps -A -o pid=,ppid=,cmd=', { encoding: 'utf8' });
          const lines = result.split('\n').filter(line => line.trim());
          const appMap = new Map();
          
          for (const line of lines) {
            const match = line.match(/^\s*(\d+)\s+(\d+)\s+(.+)/);
            if (match) {
              const pid = parseInt(match[1]);
              const ppid = parseInt(match[2]);
              const cmd = match[3];
              const name = cmd.split(' ')[0].split('/').pop();
              
              if (!appMap.has(name)) {
                appMap.set(name, {
                  name: name,
                  pid: pid,
                  cmd: cmd,
                  ppid: ppid,
                  instances: []
                });
              }
              
              appMap.get(name).instances.push({ pid, ppid, cmd });
            }
          }
          
          apps = Array.from(appMap.values());
        }
        
        const filteredApps = [];
        
        for (const app of apps) {
          if (app && app.name && !this._isSystemProcess(app.name)) {
            filteredApps.push(app);
          }
        }
        
        this.applicationsCache = filteredApps;
        this.applicationsCacheTime = now;
        
        return filteredApps;
      } catch (error) {
        return [];
      }
    }
    
    _isSystemProcess(name) {
      const lowerName = name.toLowerCase();
      const systemProcesses = [
        'system', 'idle', 'svchost', 'services', 'lsass', 'smss', 'csrss',
        'wininit', 'winlogon', 'dwm', 'explorer', 'taskhost', 'taskhostw',
        'runtimebroker', 'systemsettings', 'sihost', 'ctfmon', 'conhost',
        'backgroundtaskhost', 'wudfhost', 'mmc', 'regsvr32', 'dllhost',
        'rundll32', 'wscript', 'cscript', 'powershell', 'pwsh', 'cmd',
        'bash', 'sh', 'zsh', 'fish', 'dash', 'ksh', 'tcsh', 'node',
        'python', 'java', 'javaw', 'chrome', 'firefox', 'edge', 'safari',
        'browser', 'microsoftedge', 'microsoftedgecp'
      ];
      
      return systemProcesses.some(sysProc => lowerName.includes(sysProc));
    }
    
    _findApplicationByName(appName) {
      const apps = this.applicationsCache;
      const lowerAppName = appName.toLowerCase();
      
      for (const app of apps) {
        if (app.name.toLowerCase() === lowerAppName) {
          return app;
        }
      }
      
      for (const app of apps) {
        if (app.name.toLowerCase().includes(lowerAppName) || 
            lowerAppName.includes(app.name.toLowerCase())) {
          return app;
        }
      }
      
      for (const app of apps) {
        if (app.cmd && app.cmd.toLowerCase().includes(lowerAppName)) {
          return app;
        }
      }
      
      return null;
    }
    
    _killApplication(appName, instanceNumber = null) {
      if (!hasNodeJS) return false;
      
      try {
        const platform = os.platform();
        const apps = this.applicationsCache;
        const app = this._findApplicationByName(appName);
        
        if (!app) return false;
        
        if (instanceNumber !== null && instanceNumber > 0 && instanceNumber <= app.instances.length) {
          const instance = app.instances[instanceNumber - 1];
          if (platform === 'win32') {
            child_process.execSync(`taskkill /F /PID ${instance.pid}`);
          } else {
            child_process.execSync(`kill -9 ${instance.pid}`);
          }
        } else {
          for (const instance of app.instances) {
            if (platform === 'win32') {
              child_process.execSync(`taskkill /F /PID ${instance.pid}`);
            } else {
              child_process.execSync(`kill -9 ${instance.pid}`);
            }
          }
        }
        
        this.applicationsCacheTime = 0;
        return true;
      } catch (error) {
        return false;
      }
    }
    
    _openApplication(appName) {
      if (!hasNodeJS) return false;
      
      try {
        const platform = os.platform();
        
        if (platform === 'win32') {
          const commonPaths = [
            `C:\\Program Files\\${appName}\\${appName}.exe`,
            `C:\\Program Files (x86)\\${appName}\\${appName}.exe`,
            `C:\\Users\\${os.userInfo().username}\\AppData\\Local\\${appName}\\${appName}.exe`,
            `C:\\Users\\${os.userInfo().username}\\Desktop\\${appName}.exe`,
            `${appName}.exe`
          ];
          
          for (const appPath of commonPaths) {
            try {
              if (fs.existsSync(appPath)) {
                child_process.spawn(appPath, [], { detached: true });
                return true;
              }
            } catch (e) {}
          }
          
          child_process.spawn('start', [appName], { shell: true, detached: true });
        } else if (platform === 'darwin') {
          child_process.spawn('open', ['-a', appName], { detached: true });
        } else {
          child_process.spawn(appName, [], { detached: true });
        }
        
        this.applicationsCacheTime = 0;
        return true;
      } catch (error) {
        return false;
      }
    }

    async _getConnectionInfo() {
      if (!hasNodeJS) return { type: 'Unknown', security: 'None' };
      
      try {
        const platform = os.platform();
        let type = 'Unknown';
        let security = 'None';
        
        if (platform === 'win32') {
          try {
            const result = child_process.execSync('netsh wlan show interfaces', { encoding: 'utf8' });
            const lines = result.split('\n');
            for (const line of lines) {
              if (line.includes('SSID') && !line.includes('BSSID')) {
                type = 'Wi-Fi';
                break;
              }
            }
            
            if (type === 'Wi-Fi') {
              const securityLine = lines.find(line => line.includes('Authentication'));
              if (securityLine) {
                if (securityLine.includes('WPA3')) security = 'WPA3';
                else if (securityLine.includes('WPA2')) security = 'WPA2';
                else if (securityLine.includes('WPA')) security = 'WPA';
                else if (securityLine.includes('WEP')) security = 'WEP';
              }
            } else {
              const netResult = child_process.execSync('ipconfig', { encoding: 'utf8' });
              if (netResult.includes('Ethernet adapter')) {
                type = 'Ethernet';
              }
            }
          } catch (e) {}
        } else if (platform === 'darwin') {
          try {
            const result = child_process.execSync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I', { encoding: 'utf8' });
            if (result.includes('SSID:')) {
              type = 'Wi-Fi';
              if (result.includes('WPA3')) security = 'WPA3';
              else if (result.includes('WPA2')) security = 'WPA2';
              else if (result.includes('WPA')) security = 'WPA';
              else if (result.includes('WEP')) security = 'WEP';
            } else {
              type = 'Ethernet';
            }
          } catch (e) {
            type = 'Ethernet';
          }
        } else {
          try {
            const result = child_process.execSync('nmcli -t -f TYPE,DEVICE connection show --active', { encoding: 'utf8' });
            if (result.includes('802-11-wireless')) {
              type = 'Wi-Fi';
              try {
                const secResult = child_process.execSync('nmcli -t -f 802-11-wireless.security connection show', { encoding: 'utf8' });
                if (secResult.includes('wpa3')) security = 'WPA3';
                else if (secResult.includes('wpa2')) security = 'WPA2';
                else if (secResult.includes('wpa')) security = 'WPA';
                else if (secResult.includes('wep')) security = 'WEP';
              } catch (e) {}
            } else if (result.includes('802-3-ethernet')) {
              type = 'Ethernet';
            }
          } catch (e) {
            try {
              const iwResult = child_process.execSync('iwconfig 2>/dev/null | grep -i "essid"', { encoding: 'utf8', shell: true });
              if (iwResult) {
                type = 'Wi-Fi';
              } else {
                type = 'Ethernet';
              }
            } catch (e) {
              type = 'Ethernet';
            }
          }
        }
        
        return { type, security };
      } catch (error) {
        return { type: 'Unknown', security: 'None' };
      }
    }

    toggleCategoryDirectory() {
      this.showCategory.directory = !this.showCategory.directory;
      this.reloadBlocks();
    }

    toggleCategoryFiles() {
      this.showCategory.files = !this.showCategory.files;
      this.reloadBlocks();
    }

    toggleCategoryApplications() {
      this.showCategory.applications = !this.showCategory.applications;
      this.reloadBlocks();
    }

    toggleCategoryComputerInfo() {
      this.showCategory.computerInfo = !this.showCategory.computerInfo;
      this.reloadBlocks();
    }

    toggleCategoryInternet() {
      this.showCategory.internet = !this.showCategory.internet;
      this.reloadBlocks();
    }

    toggleCategoryEnvironment() {
      this.showCategory.environment = !this.showCategory.environment;
      this.reloadBlocks();
    }

    toggleCategoryFileUploadDownload() {
      this.showCategory.fileUploadDownload = !this.showCategory.fileUploadDownload;
      this.reloadBlocks();
    }

    toggleCategoryChangeTracking() {
      this.showCategory.changeTracking = !this.showCategory.changeTracking;
      this.reloadBlocks();
    }

    getInfo() {
      return {
        id: ext.id,
        name: ext.name,
        color1: ext.colors[0],
        color2: ext.colors[1],
        color3: ext.colors[2],
        blocks: [
          {
            opcode: "safeguarding",
            func: "safeguarding",
            blockType: BlockType.BUTTON,
            text: hasNodeJS ? 
              (safeguardAlerts ? 
                Scratch.translate("Disable Alerts") : 
                Scratch.translate("Enable Alerts")
              ) : 
              Scratch.translate("no functionality")
          },
          {
            opcode: "isNodeJS",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("node.js available?"),
          },
          {
            opcode: "nodeVersion",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("node.js version"),
            allowDropAnywhere: true,
          },
          {
            opcode: "currentUser",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("current user"),
            allowDropAnywhere: true,
          },
          {
            opcode: "computerName",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("computer name"),
            allowDropAnywhere: true,
          },
          
          {
            opcode: "toggleCategoryApplications",
            func: "toggleCategoryApplications",
            blockType: BlockType.BUTTON,
            text: this.showCategory.applications ? "close applications folder" : "open applications folder",
          },
          {
            blockType: BlockType.LABEL,
            text: Scratch.translate("Applications"),
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "currentExecutableName",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("current executable name"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "currentExecutableDirectory",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("current executable directory"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "currentExecutablePid",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("current executable pid"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "closeThisApplication",
            func: "closeThisApplication",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("close this application"),
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "instanceCountOfCurrentExecutable",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("instance count of current executable"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "instanceOfCurrentExecutable",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("instance [NUMBER] of current executable"),
            allowDropAnywhere: true,
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "isCurrentExecutableInstance",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is instance [NUMBER] of current executable [ATT]?"),
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              ATT: {
                type: Scratch.ArgumentType.STRING,
                menu: "instanceStateMenu",
                defaultValue: "running",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "isAnyCurrentExecutableInstance",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is any instance of current executable [ATT]?"),
            arguments: {
              ATT: {
                type: Scratch.ArgumentType.STRING,
                menu: "instanceStateMenu",
                defaultValue: "running",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "currentlyOpenApplications",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("currently open applications"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "isApplicationOpen",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is application [app] open?"),
            arguments: {
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "openApplication",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("open application [app]"),
            arguments: {
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "closeApplication",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("close application [app]"),
            arguments: {
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "closeApplicationInstance",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("close instance [NUMBER] of application [app]"),
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "listAllApplications",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("list all applications"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "instanceCountOfApplication",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("instance count of application [app]"),
            allowDropAnywhere: true,
            arguments: {
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "instanceOfApplication",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("instance [NUMBER] of application [app]"),
            allowDropAnywhere: true,
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "nameOfApplicationInstance",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("name of instance [NUMBER] of application [app]"),
            allowDropAnywhere: true,
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "pidOfApplicationInstance",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("pid of instance [NUMBER] of application [app]"),
            allowDropAnywhere: true,
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "commandOfApplicationInstance",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("command of instance [NUMBER] of application [app]"),
            allowDropAnywhere: true,
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "parentPidOfApplicationInstance",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("parent pid of instance [NUMBER] of application [app]"),
            allowDropAnywhere: true,
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "isApplicationInstanceRunning",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is instance [NUMBER] of application [app] running?"),
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "isApplicationInstance",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is instance [NUMBER] of application [app] [ATT]?"),
            arguments: {
              NUMBER: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
              ATT: {
                type: Scratch.ArgumentType.STRING,
                menu: "instanceStateMenu",
                defaultValue: "running",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },
          {
            opcode: "isAnyApplicationInstance",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is any instance of application [app] [ATT]?"),
            arguments: {
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
              ATT: {
                type: Scratch.ArgumentType.STRING,
                menu: "instanceStateMenu",
                defaultValue: "running",
              },
            },
            hideFromPalette: !this.showCategory.applications,
          },

          {
            opcode: "toggleCategoryDirectory",
            func: "toggleCategoryDirectory",
            blockType: BlockType.BUTTON,
            text: this.showCategory.directory ? "close directory folder" : "open directory folder",
          },
          {
            blockType: BlockType.LABEL,
            text: Scratch.translate("Directory"),
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "setFocusDirectory",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("set focus directory to [directory]"),
            arguments: {
              directory: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "forceFocusDirectory",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("force focus directory to [directory]"),
            arguments: {
              directory: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "getFocusDirectory",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("focus directory"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "convertToFullDirectory",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("convert [directory] to full directory [validity]"),
            allowDropAnywhere: true,
            arguments: {
              directory: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
              validity: {
                type: Scratch.ArgumentType.STRING,
                menu: "validityOptions",
                defaultValue: "valid",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "directoryBookmark",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("[type] directory"),
            allowDropAnywhere: true,
            arguments: {
              type: {
                type: Scratch.ArgumentType.STRING,
                menu: "directoryBookmarks",
                defaultValue: "current executable",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "endFolderOfDirectory",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("end folder of [directory]"),
            allowDropAnywhere: true,
            arguments: {
              directory: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },

          {
            opcode: "toggleCategoryFiles",
            func: "toggleCategoryFiles",
            blockType: BlockType.BUTTON,
            text: this.showCategory.files ? "close files folder" : "open files folder",
          },
          {
            blockType: BlockType.LABEL,
            text: Scratch.translate("Files"),
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "readFile",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("read file [filename] as [format]"),
            allowDropAnywhere: true,
            arguments: {
              filename: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
              format: {
                type: Scratch.ArgumentType.STRING,
                menu: "readableFormats",
                defaultValue: "text",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "fileNameWithoutExtension",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("[filename] without extension"),
            allowDropAnywhere: true,
            arguments: {
              filename: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "mysong.mp3",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "writeAppendFile",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("to file [filename] [action] [content]"),
            arguments: {
              filename: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
              action: {
                type: Scratch.ArgumentType.STRING,
                menu: "writeAppendMenu",
                defaultValue: "write",
              },
              content: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello World",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "moveCopyRename",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("to file/folder [source] [action] to [dest]"),
            arguments: {
              source: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
              action: {
                type: Scratch.ArgumentType.STRING,
                menu: "moveCopyRenameMenu",
                defaultValue: "move",
              },
              dest: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "new.txt",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "deleteFileFolder",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("delete file/folder [path]"),
            arguments: {
              path: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "convertData",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("convert data [data] to file named [name] at [directory]"),
            arguments: {
              data: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "dataurl/base64",
              },
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "file",
              },
              directory: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "createFolder",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("create folder [foldername]"),
            arguments: {
              foldername: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "NewFolder",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "openFile",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("open file [filename]"),
            arguments: {
              filename: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "openFileInApp",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("open file [filename] in application [app]"),
            arguments: {
              filename: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
              app: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "notepad",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "allInDirectory",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("all [type] in [directory] [extension]"),
            allowDropAnywhere: true,
            arguments: {
              type: {
                type: Scratch.ArgumentType.STRING,
                menu: "contentType",
                defaultValue: "files",
              },
              directory: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
              extension: {
                type: Scratch.ArgumentType.STRING,
                menu: "extensionType",
                defaultValue: "with extension",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "allFoldersInDirectory",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("all folders in [directory]"),
            allowDropAnywhere: true,
            arguments: {
              directory: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "fileSize",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("size of file [name] in [format]"),
            allowDropAnywhere: true,
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
              format: {
                type: Scratch.ArgumentType.STRING,
                menu: "sizeFormat",
                defaultValue: "KB",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "fileSizePure",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("[type] size of file [name]"),
            allowDropAnywhere: true,
            arguments: {
              type: {
                type: Scratch.ArgumentType.STRING,
                menu: "sizePureType",
                defaultValue: "pure",
              },
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "fileExists",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("file [filename] exists?"),
            arguments: {
              filename: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "folderExists",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("folder [foldername] exists?"),
            arguments: {
              foldername: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "NewFolder",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "isDirectory",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is [path] a directory?"),
            arguments: {
              path: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "isDirectoryCommandValid",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("does [directory] point to [content]?"),
            arguments: {
              directory: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
              content: {
                type: Scratch.ArgumentType.STRING,
                menu: "contentTypePoint",
                defaultValue: "file",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "countLines",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("count lines in file [filename]"),
            allowDropAnywhere: true,
            arguments: {
              filename: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "test.txt",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "createSymlink",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("create symbolic link from [target] to [linkname]"),
            arguments: {
              target: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "target.txt",
              },
              linkname: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "link.txt",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "isSymlink",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is [path] a symbolic link?"),
            arguments: {
              path: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "link.txt",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "getAbsolutePath",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("get absolute path of [relative]"),
            allowDropAnywhere: true,
            arguments: {
              relative: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },

          {
            opcode: "toggleCategoryComputerInfo",
            func: "toggleCategoryComputerInfo",
            blockType: BlockType.BUTTON,
            text: this.showCategory.computerInfo ? "close computer info folder" : "open computer info folder",
          },
          {
            blockType: BlockType.LABEL,
            text: Scratch.translate("Computer Info"),
            hideFromPalette: !this.showCategory.computerInfo,
          },
          {
            opcode: "storageDevices",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("storage devices"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.computerInfo,
          },
          {
            opcode: "totalStorage",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("total storage of [device] in [format]"),
            allowDropAnywhere: true,
            arguments: {
              device: {
                type: Scratch.ArgumentType.STRING,
                menu: "storageDevicesMenu",
                defaultValue: "/",
              },
              format: {
                type: Scratch.ArgumentType.STRING,
                menu: "sizeFormat",
                defaultValue: "GB",
              },
            },
            hideFromPalette: !this.showCategory.computerInfo,
          },
          {
            opcode: "freeStorage",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("free storage of [device] in [format]"),
            allowDropAnywhere: true,
            arguments: {
              device: {
                type: Scratch.ArgumentType.STRING,
                menu: "storageDevicesMenu",
                defaultValue: "/",
              },
              format: {
                type: Scratch.ArgumentType.STRING,
                menu: "sizeFormat",
                defaultValue: "GB",
              },
            },
            hideFromPalette: !this.showCategory.computerInfo,
          },
          {
            opcode: "osInfo",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("os [type]"),
            allowDropAnywhere: true,
            arguments: {
              type: {
                type: Scratch.ArgumentType.STRING,
                menu: "osInfoMenu",
                defaultValue: "platform",
              },
            },
            hideFromPalette: !this.showCategory.computerInfo,
          },
          {
            opcode: "getCpuArch",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("cpu architecture"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.computerInfo,
          },
          {
            opcode: "memoryInfo",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("memory [type]"),
            allowDropAnywhere: true,
            arguments: {
              type: {
                type: Scratch.ArgumentType.STRING,
                menu: "memoryTypeMenu",
                defaultValue: "total",
              },
            },
            hideFromPalette: !this.showCategory.computerInfo,
          },
          {
            opcode: "getUptime",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("system uptime (seconds)"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.computerInfo,
          },

          {
            opcode: "toggleCategoryInternet",
            func: "toggleCategoryInternet",
            blockType: BlockType.BUTTON,
            text: this.showCategory.internet ? "close internet folder" : "open internet folder",
          },
          {
            blockType: BlockType.LABEL,
            text: Scratch.translate("Internet"),
            hideFromPalette: !this.showCategory.internet,
          },
          {
            opcode: "openSite",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("open site [url] in default browser"),
            arguments: {
              url: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://google.com",
              },
            },
            hideFromPalette: !this.showCategory.internet,
          },
          {
            opcode: "isConnectedToInternet",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("is connected to internet?"),
            hideFromPalette: !this.showCategory.internet,
          },
          {
            opcode: "connectionType",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("connection type"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.internet,
          },
          {
            opcode: "connectionSecurity",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("connection security"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.internet,
          },
          {
            opcode: "internetConnectionStrength",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("internet connection strength %"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.internet,
          },

          {
            opcode: "toggleCategoryEnvironment",
            func: "toggleCategoryEnvironment",
            blockType: BlockType.BUTTON,
            text: this.showCategory.environment ? "close environment folder" : "open environment folder",
          },
          {
            blockType: BlockType.LABEL,
            text: Scratch.translate("Environment"),
            hideFromPalette: !this.showCategory.environment,
          },
          {
            opcode: "getEnv",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("environment variable [name]"),
            allowDropAnywhere: true,
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "PATH",
              },
            },
            hideFromPalette: !this.showCategory.environment,
          },
          {
            opcode: "setEnv",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("set environment variable [name] to [value]"),
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "MY_VAR",
              },
              value: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "",
              },
            },
            hideFromPalette: !this.showCategory.environment,
          },
          {
            opcode: "deleteEnv",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("delete environment variable [name]"),
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "MY_VAR",
              },
            },
            hideFromPalette: !this.showCategory.environment,
          },
          {
            opcode: "listEnv",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("all environment variables"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.environment,
          },
          {
            opcode: "loadEnvFile",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("load environment variables from .env file at [path]"),
            arguments: {
              path: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".env",
              },
            },
            hideFromPalette: !this.showCategory.environment,
          },
          {
            opcode: "parseEnvFile",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("parse .env file [path]"),
            allowDropAnywhere: true,
            arguments: {
              path: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".env",
              },
            },
            hideFromPalette: !this.showCategory.environment,
          },

          {
            opcode: "toggleCategoryFileUploadDownload",
            func: "toggleCategoryFileUploadDownload",
            blockType: BlockType.BUTTON,
            text: this.showCategory.fileUploadDownload ? "close file upload/download folder" : "open file upload/download folder",
          },
          {
            blockType: BlockType.LABEL,
            text: Scratch.translate("File Upload/Download"),
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "uploadFile",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("upload file with extension [ext]"),
            arguments: {
              ext: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "txt",
              },
            },
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "uploadSuccessful",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("upload successful?"),
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "askForFile",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("ask for file with extension [ext]"),
            allowDropAnywhere: true,
            arguments: {
              ext: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "",
              },
            },
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "gotFileSuccessfully",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("got file successfully?"),
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "lastUploadedFileProperty",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("[thing] of last uploaded file"),
            allowDropAnywhere: true,
            arguments: {
              thing: {
                type: Scratch.ArgumentType.STRING,
                menu: "lastUploadedFileProperties",
                defaultValue: "content",
              },
            },
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "downloadContent",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("download content [content] as [nameandext]"),
            arguments: {
              content: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "Hello World",
              },
              nameandext: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "example.txt",
              },
            },
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "downloadSuccessful",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("download successful?"),
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "pickFolder",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("pick folder"),
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },
          {
            opcode: "lastPickedFolderDirectory",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("directory of last folder picked"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.fileUploadDownload,
          },

          {
            opcode: "toggleCategoryChangeTracking",
            func: "toggleCategoryChangeTracking",
            blockType: BlockType.BUTTON,
            text: this.showCategory.changeTracking ? "close change tracking folder" : "open change tracking folder",
          },
          {
            blockType: BlockType.LABEL,
            text: Scratch.translate("Change Tracking"),
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "setDirectoryOfChangeTracker",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("set directory of change tracker named [tracker] to track [dir]"),
            arguments: {
              tracker: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tracker1",
              },
              dir: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "deleteChangeTracker",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("delete change tracker named [tracker]"),
            arguments: {
              tracker: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tracker1",
              },
            },
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "deleteAllChangeTrackers",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("delete all change trackers"),
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "whenChangeTrackerTriggered",
            blockType: BlockType.EVENT,
            text: Scratch.translate("when change tracker [tracker] triggered"),
            isEdgeActivated: false,
            arguments: {
              tracker: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tracker1",
              },
            },
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "listChangeTrackers",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("change trackers"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "changeTrackerCount",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("change tracker count"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "getDirectoryOfChangeTracker",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("directory of change tracker [tracker]"),
            allowDropAnywhere: true,
            arguments: {
              tracker: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tracker1",
              },
            },
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "changeTrackerExists",
            blockType: BlockType.BOOLEAN,
            text: Scratch.translate("does change tracker [tracker] exist?"),
            arguments: {
              tracker: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "tracker1",
              },
            },
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "setTrackerUpdateInterval",
            blockType: BlockType.COMMAND,
            text: Scratch.translate("update tracker every [seconds] seconds"),
            arguments: {
              seconds: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1,
                min: 0.1,
                max: 60,
              },
            },
            hideFromPalette: !this.showCategory.changeTracking,
          },
          {
            opcode: "getTrackerUpdateInterval",
            blockType: BlockType.REPORTER,
            text: Scratch.translate("tracker update interval (seconds)"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.changeTracking,
          },
        ],
        menus: {
          contentType: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("files"),
                value: "files",
              },
              {
                text: Scratch.translate("media"),
                value: "media",
              },
              {
                text: Scratch.translate("audio"),
                value: "audio",
              },
              {
                text: Scratch.translate("midi"),
                value: "midi",
              },
              {
                text: Scratch.translate("images"),
                value: "images",
              },
              {
                text: Scratch.translate("videos"),
                value: "videos",
              },
              {
                text: Scratch.translate("context files"),
                value: "context files",
              },
              {
                text: Scratch.translate("code files"),
                value: "code files",
              },
            ],
          },
          contentTypePoint: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("file"),
                value: "file",
              },
              {
                text: Scratch.translate("folder"),
                value: "folder",
              },
              {
                text: Scratch.translate("media"),
                value: "media",
              },
              {
                text: Scratch.translate("audio"),
                value: "audio",
              },
              {
                text: Scratch.translate("image"),
                value: "image",
              },
              {
                text: Scratch.translate("video"),
                value: "video",
              },
              {
                text: Scratch.translate("music"),
                value: "music",
              },
            ],
          },
          extensionType: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("with extension"),
                value: "with extension",
              },
              {
                text: Scratch.translate("without extension"),
                value: "without extension",
              },
            ],
          },
          sizeFormat: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("B"),
                value: "B",
              },
              {
                text: Scratch.translate("KB"),
                value: "KB",
              },
              {
                text: Scratch.translate("MB"),
                value: "MB",
              },
              {
                text: Scratch.translate("GB"),
                value: "GB",
              },
              {
                text: Scratch.translate("TB"),
                value: "TB",
              },
              {
                text: Scratch.translate("PB"),
                value: "PB",
              },
              {
                text: Scratch.translate("EB"),
                value: "EB",
              },
              {
                text: Scratch.translate("ZB"),
                value: "ZB",
              },
              {
                text: Scratch.translate("YB"),
                value: "YB",
              },
            ],
          },
          sizePureType: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("pure"),
                value: "pure",
              },
              {
                text: Scratch.translate("formatted"),
                value: "formatted",
              },
            ],
          },
          storageDevicesMenu: {
            acceptReporters: true,
            items: "getStorageDevicesArray",
          },
          directoryBookmarks: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("current executable"),
                value: "current executable",
              },
              {
                text: Scratch.translate("root"),
                value: "root",
              },
              {
                text: Scratch.translate("user"),
                value: "user",
              },
              {
                text: Scratch.translate("appdata"),
                value: "appdata",
              },
              {
                text: Scratch.translate("localdata"),
                value: "localdata",
              },
              {
                text: Scratch.translate("download"),
                value: "download",
              },
              {
                text: Scratch.translate("documents"),
                value: "documents",
              },
              {
                text: Scratch.translate("desktop"),
                value: "desktop",
              },
              {
                text: Scratch.translate("music"),
                value: "music",
              },
              {
                text: Scratch.translate("video"),
                value: "video",
              },
              {
                text: Scratch.translate("picture"),
                value: "picture",
              },
            ],
          },
          readableFormats: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("text"),
                value: "text",
              },
              {
                text: Scratch.translate("dataurl"),
                value: "dataurl",
              },
              {
                text: Scratch.translate("base64"),
                value: "base64",
              },
            ],
          },
          validityOptions: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("valid"),
                value: "valid",
              },
              {
                text: Scratch.translate("any"),
                value: "any",
              },
            ],
          },
          lastUploadedFileProperties: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("content"),
                value: "content",
              },
              {
                text: Scratch.translate("name"),
                value: "name",
              },
              {
                text: Scratch.translate("unextended name"),
                value: "unextended name",
              },
              {
                text: Scratch.translate("directory"),
                value: "directory",
              },
              {
                text: Scratch.translate("size"),
                value: "size",
              },
              {
                text: Scratch.translate("formatted size"),
                value: "formatted size",
              },
              {
                text: Scratch.translate("extension"),
                value: "extension",
              },
            ],
          },
          fileModes: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("r"),
                value: "r",
              },
              {
                text: Scratch.translate("w"),
                value: "w",
              },
              {
                text: Scratch.translate("a"),
                value: "a",
              },
              {
                text: Scratch.translate("r+"),
                value: "r+",
              },
              {
                text: Scratch.translate("w+"),
                value: "w+",
              },
              {
                text: Scratch.translate("a+"),
                value: "a+",
              },
            ],
          },
          osInfoMenu: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("distro"),
                value: "distro",
              },
              {
                text: Scratch.translate("platform"),
                value: "platform",
              },
              {
                text: Scratch.translate("name"),
                value: "name",
              },
              {
                text: Scratch.translate("type"),
                value: "type",
              },
            ],
          },
          memoryTypeMenu: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("total"),
                value: "total",
              },
              {
                text: Scratch.translate("free"),
                value: "free",
              },
              {
                text: Scratch.translate("used"),
                value: "used",
              },
            ],
          },
          writeAppendMenu: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("write"),
                value: "write",
              },
              {
                text: Scratch.translate("append"),
                value: "append",
              },
            ],
          },
          moveCopyRenameMenu: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("move"),
                value: "move",
              },
              {
                text: Scratch.translate("copy"),
                value: "copy",
              },
              {
                text: Scratch.translate("rename"),
                value: "rename",
              },
            ],
          },
          instanceStateMenu: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("open"),
                value: "open",
              },
              {
                text: Scratch.translate("active"),
                value: "active",
              },
              {
                text: Scratch.translate("visible"),
                value: "visible",
              },
              {
                text: Scratch.translate("minimized"),
                value: "minimized",
              },
              {
                text: Scratch.translate("maximized"),
                value: "maximized",
              },
              {
                text: Scratch.translate("running"),
                value: "running",
              },
            ],
          },
        },
      };
    }

    safeguarding() {
      if (!hasNodeJS) return "";
      
      if (safeguardAlerts) {
        console.warn("[Node Data] SAFEGUARD: Requesting user confirmation to disable alerts");
        const confirmed = confirm("DANGEROUS! DISABLING SAFEGUARD ALLOWS FULL COMPUTER ACCESS WITHOUT WARNING!\n\nAre you sure you want to disable safeguard alerts?");
        if (!confirmed) {
          console.log("[Node Data] User cancelled disabling safeguard alerts");
          return "";
        }
        console.error("[Node Data] SAFEGUARD DISABLED: User has disabled security alerts - full system access now permitted without warnings");
      } else {
        console.warn("[Node Data] SAFEGUARD: Enabling security alerts");
      }
      safeguardAlerts = !safeguardAlerts;
      this._saveSafeguardState();
      this.reloadBlocks();
      return "";
    }

    reloadBlocks() {
      if (Scratch.vm && Scratch.vm.extensionManager) {
        Scratch.vm.extensionManager.refreshBlocks();
      }
    }

    currentExecutableName() {
      if (!hasNodeJS) return "";
      const info = this._getCurrentExecutableInfo();
      return info ? info.name : "";
    }
    
    currentExecutableDirectory() {
      if (!hasNodeJS) return "";
      const info = this._getCurrentExecutableInfo();
      return info ? info.directory : "";
    }
    
    currentExecutablePid() {
      if (!hasNodeJS) return "";
      return process.pid.toString();
    }
    
    closeThisApplication() {
      if (!hasNodeJS) return "";
      
      if (safeguardAlerts && !safeguardBypass) {
        console.warn("[Node Data] SAFEGUARD: Requesting user confirmation to close this application");
        const allowed = confirm("Are you sure you want to close this application? This will terminate the current program.");
        if (!allowed) {
          console.error("[Node Data] SAFEGUARD BLOCKED: Closing this application was cancelled by user");
          return "";
        }
      }
      
      process.exit(0);
      return "";
    }
    
    instanceCountOfCurrentExecutable() {
      if (!hasNodeJS) return "0";
      try {
        const currentName = path.basename(process.execPath);
        const apps = this.applicationsCache;
        const app = this._findApplicationByName(currentName);
        return app ? app.instances.length.toString() : "1";
      } catch (error) {
        return "1";
      }
    }
    
    instanceOfCurrentExecutable({NUMBER}) {
      if (!hasNodeJS) return "";
      try {
        const currentName = path.basename(process.execPath);
        const apps = this.applicationsCache;
        const app = this._findApplicationByName(currentName);
        
        if (!app) {
          const info = this._getCurrentExecutableInfo();
          return JSON.stringify(info);
        }
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), app.instances.length));
        const instance = app.instances[instanceNum - 1];
        
        const instanceInfo = {
          name: app.name,
          pid: instance.pid,
          cmd: instance.cmd,
          ppid: instance.ppid,
          instanceNumber: instanceNum
        };
        
        return JSON.stringify(instanceInfo);
      } catch (error) {
        return "";
      }
    }
    
    isCurrentExecutableInstance({NUMBER, ATT}) {
      if (!hasNodeJS) return false;
      
      try {
        const currentName = path.basename(process.execPath);
        const apps = this.applicationsCache;
        const app = this._findApplicationByName(currentName);
        
        if (!app) {
          const state = Cast.toString(ATT);
          if (state === "running") return true;
          if (state === "open") return true;
          return false;
        }
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), app.instances.length));
        const instance = app.instances[instanceNum - 1];
        
        const isCurrentProcess = (instance.pid === process.pid);
        
        const state = Cast.toString(ATT);
        switch (state) {
          case "running":
            return true;
          case "open":
            return true;
          case "active":
            return isCurrentProcess;
          case "visible":
            return isCurrentProcess;
          case "minimized":
            return false;
          case "maximized":
            return false;
          default:
            return true;
        }
      } catch (error) {
        return false;
      }
    }
    
    isAnyCurrentExecutableInstance({ATT}) {
      if (!hasNodeJS) return false;
      
      try {
        const currentName = path.basename(process.execPath);
        const apps = this.applicationsCache;
        const app = this._findApplicationByName(currentName);
        
        if (!app) {
          const state = Cast.toString(ATT);
          if (state === "running") return true;
          if (state === "open") return true;
          return false;
        }
        
        const state = Cast.toString(ATT);
        switch (state) {
          case "running":
            return app.instances.length > 0;
          case "open":
            return app.instances.length > 0;
          case "active":
            return app.instances.some(inst => inst.pid === process.pid);
          default:
            return app.instances.length > 0;
        }
      } catch (error) {
        return false;
      }
    }

    openFile({filename}) {
      if (!hasNodeJS) return "";

      const filePath = this._resolveFilePath(filename);
      if (this._isSensitiveReadPath(filePath) && safeguardAlerts && !safeguardBypass) {
        const allowed = this._checkSafeguard("open", {
          filename: filename,
          path: filePath,
        });
        if (!allowed) {
          console.error(`[Node Data] SAFEGUARD BLOCKED: Opening file "${filename}" at path "${filePath}" was cancelled by user`);
          return "";
        }
      }

      try {
        if (!fs.existsSync(filePath)) return "";

        const platform = os.platform();
        let command;
        
        if (platform === 'win32') {
          command = `start "" "${filePath}"`;
        } else if (platform === 'darwin') {
          command = `open "${filePath}"`;
        } else {
          command = `xdg-open "${filePath}"`;
        }
        
        child_process.exec(command, (error) => {
          if (error) {
          }
        });
        
        return "";
      } catch (error) {
        return "";
      }
    }
    
    openFileInApp({filename, app}) {
      if (!hasNodeJS) return "";

      const filePath = this._resolveFilePath(filename);
      const appName = Cast.toString(app);
      
      if (this._isSensitiveReadPath(filePath) && safeguardAlerts && !safeguardBypass) {
        const allowed = this._checkSafeguard("open in app", {
          filename: filename,
          app: appName,
          path: filePath,
        });
        if (!allowed) {
          console.error(`[Node Data] SAFEGUARD BLOCKED: Opening file "${filename}" in app "${appName}" at path "${filePath}" was cancelled by user`);
          return "";
        }
      }

      try {
        if (!fs.existsSync(filePath)) return "";

        const platform = os.platform();
        let command;
        
        if (platform === 'win32') {
          command = `"${appName}" "${filePath}"`;
          child_process.exec(command, (error) => {
            if (error) {
              this.openFile({filename});
            }
          });
        } else if (platform === 'darwin') {
          command = `open -a "${appName}" "${filePath}"`;
          child_process.exec(command, (error) => {
            if (error) {
              this.openFile({filename});
            }
          });
        } else {
          command = `${appName} "${filePath}"`;
          child_process.exec(command, (error) => {
            if (error) {
              this.openFile({filename});
            }
          });
        }
        
        return "";
      } catch (error) {
        this.openFile({filename});
        return "";
      }
    }

    openSite({url}) {
      if (!hasNodeJS) return "";

      const urlStr = Cast.toString(url);
      if (safeguardAlerts && !safeguardBypass) {
        console.warn(`[Node Data] SAFEGUARD: Requesting user confirmation to open URL: ${urlStr}`);
        const allowed = confirm(`Are you sure you want to open ${urlStr} in your default browser?`);
        if (!allowed) {
          console.error(`[Node Data] SAFEGUARD BLOCKED: Opening URL "${urlStr}" was cancelled by user`);
          return "";
        }
        console.log(`[Node Data] User allowed opening URL: ${urlStr}`);
      }

      try {
        const platform = os.platform();
        let command;
        
        if (platform === 'win32') {
          command = `start "" "${urlStr}"`;
        } else if (platform === 'darwin') {
          command = `open "${urlStr}"`;
        } else {
          command = `xdg-open "${urlStr}"`;
        }
        
        child_process.exec(command, (error) => {
          if (error) {
          }
        });
        
        return "";
      } catch (error) {
        return "";
      }
    }

    async currentlyOpenApplications() {
      if (!hasNodeJS) return "[]";
      try {
        const apps = await this._getApplications();
        const appNames = apps.map(app => app.name);
        return JSON.stringify(appNames);
      } catch (error) {
        return "[]";
      }
    }
    
    async listAllApplications() {
      if (!hasNodeJS) return "[]";
      try {
        const apps = await this._getApplications();
        return JSON.stringify(apps);
      } catch (error) {
        return "[]";
      }
    }
    
    async isApplicationOpen({app}) {
      if (!hasNodeJS) return false;
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app).toLowerCase();
        
        for (const application of apps) {
          if (application.name.toLowerCase().includes(appName) || 
              appName.includes(application.name.toLowerCase())) {
            return true;
          }
        }
        return false;
      } catch (error) {
        return false;
      }
    }
    
    openApplication({app}) {
      if (!hasNodeJS) return "";
      
      const appName = Cast.toString(app);
      if (safeguardAlerts && !safeguardBypass) {
        console.warn(`[Node Data] SAFEGUARD: Requesting user confirmation to open application: ${appName}`);
        const allowed = confirm(`Are you sure you want to open application "${appName}"?`);
        if (!allowed) {
          console.error(`[Node Data] SAFEGUARD BLOCKED: Opening application "${appName}" was cancelled by user`);
          return "";
        }
        console.log(`[Node Data] User allowed opening application: ${appName}`);
      }
      
      const success = this._openApplication(appName);
      if (!success) {
        console.warn(`[Node Data] Failed to open application: ${appName}`);
      }
      return "";
    }
    
    closeApplication({app}) {
      if (!hasNodeJS) return "";
      
      const appName = Cast.toString(app);
      if (safeguardAlerts && !safeguardBypass) {
        console.warn(`[Node Data] SAFEGUARD: Requesting user confirmation to close application: ${appName}`);
        const allowed = confirm(`Are you sure you want to close application "${appName}"? This will force quit the application.`);
        if (!allowed) {
          console.error(`[Node Data] SAFEGUARD BLOCKED: Closing application "${appName}" was cancelled by user`);
          return "";
        }
        console.log(`[Node Data] User allowed closing application: ${appName}`);
      }
      
      const success = this._killApplication(appName);
      if (!success) {
        console.warn(`[Node Data] Failed to close application: ${appName}`);
      }
      return "";
    }
    
    closeApplicationInstance({NUMBER, app}) {
      if (!hasNodeJS) return "";
      
      const appName = Cast.toString(app);
      const instanceNum = Cast.toNumber(NUMBER);
      
      if (safeguardAlerts && !safeguardBypass) {
        console.warn(`[Node Data] SAFEGUARD: Requesting user confirmation to close instance ${instanceNum} of application: ${appName}`);
        const allowed = confirm(`Are you sure you want to close instance ${instanceNum} of application "${appName}"? This will force quit that specific instance.`);
        if (!allowed) {
          console.error(`[Node Data] SAFEGUARD BLOCKED: Closing instance ${instanceNum} of application "${appName}" was cancelled by user`);
          return "";
        }
        console.log(`[Node Data] User allowed closing instance ${instanceNum} of application: ${appName}`);
      }
      
      const success = this._killApplication(appName, instanceNum);
      if (!success) {
        console.warn(`[Node Data] Failed to close instance ${instanceNum} of application: ${appName}`);
      }
      return "";
    }
    
    async instanceCountOfApplication({app}) {
      if (!hasNodeJS) return "0";
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        return foundApp ? foundApp.instances.length.toString() : "0";
      } catch (error) {
        return "0";
      }
    }
    
    async instanceOfApplication({NUMBER, app}) {
      if (!hasNodeJS) return "";
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        if (!foundApp) return "";
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), foundApp.instances.length));
        const instance = foundApp.instances[instanceNum - 1];
        
        const instanceInfo = {
          name: foundApp.name,
          pid: instance.pid,
          cmd: instance.cmd,
          ppid: instance.ppid,
          instanceNumber: instanceNum
        };
        
        return JSON.stringify(instanceInfo);
      } catch (error) {
        return "";
      }
    }
    
    async nameOfApplicationInstance({NUMBER, app}) {
      if (!hasNodeJS) return "";
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        if (!foundApp) return "";
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), foundApp.instances.length));
        return foundApp.name;
      } catch (error) {
        return "";
      }
    }
    
    async pidOfApplicationInstance({NUMBER, app}) {
      if (!hasNodeJS) return "";
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        if (!foundApp) return "";
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), foundApp.instances.length));
        const instance = foundApp.instances[instanceNum - 1];
        return instance.pid.toString();
      } catch (error) {
        return "";
      }
    }
    
    async commandOfApplicationInstance({NUMBER, app}) {
      if (!hasNodeJS) return "";
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        if (!foundApp) return "";
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), foundApp.instances.length));
        const instance = foundApp.instances[instanceNum - 1];
        return instance.cmd || "";
      } catch (error) {
        return "";
      }
    }
    
    async parentPidOfApplicationInstance({NUMBER, app}) {
      if (!hasNodeJS) return "";
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        if (!foundApp) return "";
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), foundApp.instances.length));
        const instance = foundApp.instances[instanceNum - 1];
        return instance.ppid.toString();
      } catch (error) {
        return "";
      }
    }
    
    async isApplicationInstanceRunning({NUMBER, app}) {
      if (!hasNodeJS) return false;
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        if (!foundApp) return false;
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), foundApp.instances.length));
        return true;
      } catch (error) {
        return false;
      }
    }
    
    async isApplicationInstance({NUMBER, app, ATT}) {
      if (!hasNodeJS) return false;
      
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        if (!foundApp) return false;
        
        const instanceNum = Math.max(1, Math.min(Cast.toNumber(NUMBER), foundApp.instances.length));
        const instance = foundApp.instances[instanceNum - 1];
        
        const state = Cast.toString(ATT);
        switch (state) {
          case "running":
            return true;
          case "open":
            return true;
          case "active":
            return false;
          case "visible":
            return true;
          case "minimized":
            return false;
          case "maximized":
            return false;
          default:
            return true;
        }
      } catch (error) {
        return false;
      }
    }
    
    async isAnyApplicationInstance({app, ATT}) {
      if (!hasNodeJS) return false;
      
      try {
        const apps = await this._getApplications();
        const appName = Cast.toString(app);
        const foundApp = this._findApplicationByName(appName);
        
        if (!foundApp) return false;
        
        const state = Cast.toString(ATT);
        switch (state) {
          case "running":
            return foundApp.instances.length > 0;
          case "open":
            return foundApp.instances.length > 0;
          case "active":
            return false;
          case "visible":
            return foundApp.instances.length > 0;
          case "minimized":
            return false;
          case "maximized":
            return false;
          default:
            return foundApp.instances.length > 0;
        }
      } catch (error) {
        return false;
      }
    }

    writeAppendFile({filename, action, content}) {
      if (!hasNodeJS) return "";
      const allowed =
        safeguardBypass ||
        this._checkSafeguard("create", {
          filename: filename,
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Writing to file "${filename}" with action "${action}" was cancelled by user`);
        return "";
      }
      try {
        const filePath = this._resolveFilePath(filename);
        const contentStr = Cast.toString(content);
        
        if (Cast.toString(action) === "write") {
          fs.writeFileSync(filePath, contentStr);
        } else {
          fs.appendFileSync(filePath, contentStr);
        }
        
        this._triggerTrackerCheck();
        return "";
      } catch (error) {
        return "";
      }
    }

    moveCopyRename({source, action, dest}) {
      if (!hasNodeJS) return "";
      const allowed =
        safeguardBypass ||
        this._checkSafeguard(Cast.toString(action), {
          source: source,
          dest: dest,
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: ${action} operation from "${source}" to "${dest}" was cancelled by user`);
        return "";
      }
      try {
        const sourcePath = this._resolveFilePath(source);
        const destPath = this._resolveFilePath(dest);
        
        if (!fs.existsSync(sourcePath)) return "";
        
        const actionType = Cast.toString(action);
        
        if (actionType === "move") {
          fs.renameSync(sourcePath, destPath);
        } else if (actionType === "copy") {
          if (fs.statSync(sourcePath).isDirectory()) {
            this._copyFolderRecursive(sourcePath, destPath);
          } else {
            fs.copyFileSync(sourcePath, destPath);
          }
        } else if (actionType === "rename") {
          fs.renameSync(sourcePath, destPath);
        }
        
        this._triggerTrackerCheck();
        return "";
      } catch (error) {
        return "";
      }
    }

    deleteFileFolder({path}) {
      if (!hasNodeJS) return "";
      const allowed =
        safeguardBypass ||
        this._checkSafeguard("delete", {
          filename: path,
          foldername: path,
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Deleting file/folder "${path}" was cancelled by user`);
        return "";
      }
      try {
        const targetPath = this._resolveFilePath(path);
        
        if (!fs.existsSync(targetPath)) return "";
        
        if (fs.statSync(targetPath).isDirectory()) {
          fs.rmSync(targetPath, {
            recursive: true,
            force: true,
          });
        } else {
          fs.unlinkSync(targetPath);
        }
        
        this._triggerTrackerCheck();
        return "";
      } catch (error) {
        return "";
      }
    }

    isDirectoryCommandValid({directory, content}) {
      if (!hasNodeJS) return false;
      try {
        const dir = Cast.toString(directory);
        const resolvedPath = this.convertToFullDirectory({
          directory: dir,
          validity: "any"
        });
        
        if (!fs.existsSync(resolvedPath)) return false;
        
        const stats = fs.statSync(resolvedPath);
        const contentType = Cast.toString(content);
        
        if (contentType === "file") {
          return stats.isFile();
        } else if (contentType === "folder") {
          return stats.isDirectory();
        } else if (contentType === "media") {
          if (!stats.isFile()) return false;
          const ext = path.extname(resolvedPath).toLowerCase();
          return ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext);
        } else if (contentType === "audio") {
          if (!stats.isFile()) return false;
          const ext = path.extname(resolvedPath).toLowerCase();
          return ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma', '.aiff', '.au'].includes(ext);
        } else if (contentType === "image") {
          if (!stats.isFile()) return false;
          const ext = path.extname(resolvedPath).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext);
        } else if (contentType === "video") {
          if (!stats.isFile()) return false;
          const ext = path.extname(resolvedPath).toLowerCase();
          return ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(ext);
        } else if (contentType === "music") {
          if (!stats.isFile()) return false;
          const ext = path.extname(resolvedPath).toLowerCase();
          return ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma', '.aiff', '.au', '.mid', '.midi'].includes(ext);
        }
        
        return false;
      } catch (error) {
        return false;
      }
    }

    uploadFile({ext}) {
      if (!hasNodeJS) return "";

      const allowed =
        safeguardBypass ||
        this._checkSafeguard("upload file", {
          filename: "uploaded_file",
          operation: "upload file",
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: File upload with extension "${ext}" was cancelled by user`);
        this.lastUploadSuccess = false;
        return "";
      }

      try {
        const input = document.createElement("input");
        input.type = "file";

        let acceptExt = Cast.toString(ext).trim();
        if (acceptExt) {
          if (!acceptExt.startsWith(".")) {
            acceptExt = "." + acceptExt;
          }
          input.accept = acceptExt;
        }

        this.lastUploadSuccess = false;

        input.onchange = (event) => {
          const file = event.target.files[0];
          if (!file) {
            this.lastUploadSuccess = false;
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent = e.target.result;

            try {
              const fileBuffer = this._dataUrlToBuffer(fileContent);
              const filePath = path.join(this.focusDirectory, file.name);
              fs.writeFileSync(filePath, fileBuffer);
              this.lastUploadSuccess = true;

              const stats = fs.statSync(filePath);
              this.lastUploadedFile = {
                content: fileContent,
                name: file.name,
                unextendedName: path.basename(file.name, path.extname(file.name)),
                directory: this.focusDirectory,
                size: stats.size,
                formattedSize: this._formatBytes(stats.size),
                extension: path.extname(file.name).substring(1),
              };
            } catch (error) {
              this.lastUploadSuccess = false;
            }
          };
          reader.readAsDataURL(file);
        };

        input.click();
        return "";
      } catch (error) {
        this.lastUploadSuccess = false;
        return "";
      }
    }

    uploadSuccessful() {
      return this.lastUploadSuccess;
    }

    askForFile({ext}) {
      if (!hasNodeJS) return "";

      const allowed =
        safeguardBypass ||
        this._checkSafeguard("read", {
          filename: "user_selected_file",
          path: "user selection",
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: File picker with extension filter "${ext}" was cancelled by user`);
        this.lastFilePickerSuccess = false;
        return "";
      }

      try {
        const input = document.createElement("input");
        input.type = "file";

        const extensions = Cast.toString(ext).trim();
        if (extensions) {
          const acceptExtensions = extensions.split(" ").map((e) => {
            if (e.startsWith(".")) {
              return e;
            }
            return "." + e;
          });
          input.accept = acceptExtensions.join(",");
        }

        this.lastFilePickerSuccess = false;

        return new Promise((resolve) => {
          input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) {
              this.lastFilePickerSuccess = false;
              resolve("");
              return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
              const dataUrl = e.target.result;
              const filename = file.name;

              this.lastFilePickerSuccess = true;

              this.lastUploadedFile = {
                content: dataUrl,
                name: filename,
                unextendedName: path.basename(filename, path.extname(filename)),
                directory: this.focusDirectory,
                size: file.size,
                formattedSize: this._formatBytes(file.size),
                extension: path.extname(filename).substring(1),
              };

              resolve(dataUrl);
            };
            reader.onerror = () => {
              this.lastFilePickerSuccess = false;
              resolve("");
            };
            reader.readAsDataURL(file);
          };

          input.oncancel = () => {
            this.lastFilePickerSuccess = false;
            resolve("");
          };

          input.click();
        });
      } catch (error) {
        this.lastFilePickerSuccess = false;
        return "";
      }
    }

    gotFileSuccessfully() {
      return this.lastFilePickerSuccess;
    }

    lastUploadedFileProperty({thing}) {
      if (!this.lastUploadedFile) return "";

      switch (Cast.toString(thing)) {
        case "content":
          return this.lastUploadedFile.content;
        case "name":
          return this.lastUploadedFile.name;
        case "unextended name":
          return this.lastUploadedFile.unextendedName;
        case "directory":
          return this.lastUploadedFile.directory;
        case "size":
          return this.lastUploadedFile.size;
        case "formatted size":
          return this.lastUploadedFile.formattedSize;
        case "extension":
          return this.lastUploadedFile.extension;
        default:
          return "";
      }
    }

    downloadContent({content, nameandext}) {
      if (!hasNodeJS) return "";

      this.lastDownloadSuccess = false;

      try {
        let blob;
        let filename = Cast.toString(nameandext);

        if (content.startsWith("data:")) {
          const matches = content.match(/^data:([^;]+);base64,(.+)$/);
          if (!matches) {
            this.lastDownloadSuccess = false;
            return "";
          }
          const mimeType = matches[1];
          const base64Data = matches[2];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], {
            type: mimeType,
          });
        } else {
          blob = new Blob([content], {
            type: "text/plain",
          });
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        this.lastDownloadSuccess = true;
        return "";
      } catch (error) {
        this.lastDownloadSuccess = false;
        return "";
      }
    }

    downloadSuccessful() {
      return this.lastDownloadSuccess;
    }

    pickFolder() {
      if (!hasNodeJS) return "";

      try {
        const input = document.createElement("input");
        input.type = "file";
        input.webkitdirectory = true;
        input.directory = true;

        input.onchange = (event) => {
          const files = event.target.files;
          if (files.length > 0) {
            const firstFile = files[0];
            const pathParts = firstFile.webkitRelativePath.split("/");
            if (pathParts.length > 1) {
              const folderPath = pathParts.slice(0, -1).join("/");
              this.lastPickedFolder = path.resolve(this.focusDirectory, folderPath);
            }
          }
        };

        input.click();
        return "";
      } catch (error) {
        return "";
      }
    }

    lastPickedFolderDirectory() {
      return this.lastPickedFolder;
    }

    isConnectedToInternet() {
      if (!hasNodeJS) return false;

      try {
        const networkInterfaces = os.networkInterfaces();
        for (const interfaceName in networkInterfaces) {
          const interfaces = networkInterfaces[interfaceName];
          for (const iface of interfaces) {
            if (!iface.internal && (iface.family === "IPv4" || iface.family === "IPv6")) {
              return true;
            }
          }
        }
        return false;
      } catch (error) {
        return false;
      }
    }

    async connectionType() {
      if (!hasNodeJS) return "";
      try {
        const info = await this._getConnectionInfo();
        return info.type;
      } catch (error) {
        return "";
      }
    }

    async connectionSecurity() {
      if (!hasNodeJS) return "";
      try {
        const info = await this._getConnectionInfo();
        return info.security;
      } catch (error) {
        return "";
      }
    }

    internetConnectionStrength() {
      if (!hasNodeJS) return 0;

      try {
        const networkInterfaces = os.networkInterfaces();
        let maxSpeed = 0;

        for (const interfaceName in networkInterfaces) {
          const interfaces = networkInterfaces[interfaceName];
          for (const iface of interfaces) {
            if (!iface.internal) {
              if (iface.mac !== "00:00:00:00:00:00") {
                maxSpeed = Math.max(maxSpeed, 100);
              }
            }
          }
        }

        return maxSpeed;
      } catch (error) {
        return 0;
      }
    }

    _dataUrlToBuffer(dataUrl) {
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Invalid data URL");
      }
      const base64Data = matches[2];
      return Buffer.from(base64Data, "base64");
    }

    _formatBytes(bytes) {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

  forceFocusDirectory({directory}) {
  if (!hasNodeJS) return "";

  try {
    const newDir = path.resolve(Cast.toString(directory));
    const dirExists = fs.existsSync(newDir) && fs.statSync(newDir).isDirectory();

    if (!dirExists) {
      if (safeguardAlerts && !safeguardBypass) {
        console.warn(`[Node Data] SAFEGUARD: Requesting user confirmation to create new directory "${newDir}"`);
        const allowed = confirm(`Are you sure you want to create the new directory "${newDir}"?\n\nThis will create new folders if they don't exist.`);
        if (!allowed) {
          console.error(`[Node Data] SAFEGUARD BLOCKED: Creating directory "${newDir}" was cancelled by user`);
          return this.setFocusDirectory({ directory });
        }
        console.log(`[Node Data] User allowed creating directory: ${newDir}`);
      }
      
      fs.mkdirSync(newDir, {
        recursive: true,
      });
    }

    if (fs.existsSync(newDir) && fs.statSync(newDir).isDirectory()) {
      this.focusDirectory = newDir;
      process.chdir(newDir);
    }
    return "";
  } catch (error) {
    return "";
  }
}

    convertToFullDirectory({directory, validity}) {
      if (!hasNodeJS) return this.focusDirectory;

      try {
        const dirStr = Cast.toString(directory);
        
        let normalizedPath = dirStr.replace(/\//g, path.sep);
        
        const invalidChars = /[<>"|?*]/;
        const driveMatch = normalizedPath.match(/^[a-zA-Z]:\\/);
        let pathWithoutDrive = normalizedPath;
        
        if (driveMatch) {
          pathWithoutDrive = normalizedPath.substring(driveMatch[0].length);
        }
        
        if (invalidChars.test(pathWithoutDrive)) {
          return this.focusDirectory;
        }

        if (normalizedPath === ".") {
          normalizedPath = this.focusDirectory;
        } else if (normalizedPath === "..") {
          normalizedPath = path.dirname(this.focusDirectory);
        } else if (normalizedPath.startsWith("." + path.sep)) {
          normalizedPath = path.join(this.focusDirectory, normalizedPath.substring(2));
        } else if (normalizedPath.startsWith(".." + path.sep)) {
          let levels = 0;
          let tempPath = normalizedPath;
          while (tempPath.startsWith(".." + path.sep)) {
            levels++;
            tempPath = tempPath.substring(3);
          }
          let resultPath = this.focusDirectory;
          for (let i = 0; i < levels; i++) {
            resultPath = path.dirname(resultPath);
          }
          normalizedPath = path.join(resultPath, tempPath);
        }

        if (!path.isAbsolute(normalizedPath)) {
          normalizedPath = path.resolve(this.focusDirectory, normalizedPath);
        }

        normalizedPath = path.normalize(normalizedPath);

        if (Cast.toString(validity) !== "valid") {
          return normalizedPath;
        }

        if (fs.existsSync(normalizedPath) && fs.statSync(normalizedPath).isDirectory()) {
          return normalizedPath;
        }

        let currentPath = normalizedPath;
        let lastValidPath = null;

        while (currentPath !== path.dirname(currentPath)) {
          if (fs.existsSync(currentPath) && fs.statSync(currentPath).isDirectory()) {
            lastValidPath = currentPath;
            break;
          }
          currentPath = path.dirname(currentPath);
        }

        if (fs.existsSync(currentPath) && fs.statSync(currentPath).isDirectory()) {
          lastValidPath = currentPath;
        }

        if (lastValidPath) {
          return lastValidPath;
        }

        return this.focusDirectory;
      } catch (error) {
        return this.focusDirectory;
      }
    }

    convertData({data, name, directory}) {
      if (!hasNodeJS) return "";

      const allowed =
        safeguardBypass ||
        this._checkSafeguard("convert data URL to file", {
          filename: name,
          operation: "convert data URL to file",
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Converting data to file "${name}" at directory "${directory}" was cancelled by user`);
        return "";
      }

      try {
        if (data === "dataurl/base64") {
          return "";
        }

        let base64Data;
        let mimeType = "application/octet-stream";

        if (data.startsWith("data:")) {
          const matches = data.match(/^data:([^;]+);base64,(.+)$/);
          if (!matches) {
            throw new Error("Invalid data URL format");
          }
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          base64Data = data;
        }

        const mimeToExtension = {
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/gif": "gif",
          "image/bmp": "bmp",
          "image/webp": "webp",
          "image/svg+xml": "svg",
          "audio/mpeg": "mp3",
          "audio/wav": "wav",
          "audio/ogg": "ogg",
          "audio/aac": "aac",
          "audio/flac": "flac",
          "video/mp4": "mp4",
          "video/avi": "avi",
          "video/quicktime": "mov",
          "video/x-ms-wmv": "wmv",
          "video/webm": "webm",
          "text/plain": "txt",
          "application/json": "json",
          "application/xml": "xml",
          "text/xml": "xml",
          "application/pdf": "pdf",
          "text/html": "html",
          "text/css": "css",
          "application/javascript": "js",
          "application/zip": "zip",
          "application/x-zip-compressed": "zip",
          "application/x-rar-compressed": "rar",
          "application/x-tar": "tar",
          "application/gzip": "gz",
          "application/x-7z-compressed": "7z",
        };

        const nameExt = path.extname(name);
        let finalName = name;

        if (!nameExt) {
          let extension = mimeToExtension[mimeType] || "bin";

          if (extension === "bin") {
            const fileBuffer = Buffer.from(base64Data, "base64");
            extension = this._detectFileTypeFromBuffer(fileBuffer);
          }

          finalName = `${name}.${extension}`;
        }

        const fileBuffer = Buffer.from(base64Data, "base64");
        const dirPath = this._resolveFilePath(directory);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, {
            recursive: true,
          });
        }

        const filePath = path.join(dirPath, finalName);
        fs.writeFileSync(filePath, fileBuffer);

        return "";
      } catch (error) {
        return "";
      }
    }

    getEnv({name}) {
      if (!hasNodeJS) return "";
      try {
        const value = process.env[name] || "";

        if (name.toUpperCase() === "PATH") {
          const delimiter = os.platform() === "win32" ? ";" : ":";
          const paths = value.split(delimiter).filter((path) => path.trim() !== "");
          return JSON.stringify(paths);
        }

        if (value.includes(";") || value.includes(":") || value.includes(",")) {
          let parts;
          if (value.includes(";")) {
            parts = value.split(";").filter((part) => part.trim() !== "");
          } else if (value.includes(":")) {
            parts = value.split(":").filter((part) => part.trim() !== "");
          } else if (value.includes(",")) {
            parts = value.split(",").filter((part) => part.trim() !== "");
          }

          if (parts && parts.length > 1) {
            return JSON.stringify(parts);
          }
        }

        if (value.includes("=") && !value.includes(";") && !value.includes(":")) {
          const lines = value.split("\n").filter((line) => line.trim() !== "");
          if (lines.length > 1) {
            const obj = {};
            for (const line of lines) {
              const equalsIndex = line.indexOf("=");
              if (equalsIndex !== -1) {
                const key = line.substring(0, equalsIndex).trim();
                const val = line.substring(equalsIndex + 1).trim();
                obj[key] = val;
              }
            }
            if (Object.keys(obj).length > 0) {
              return JSON.stringify(obj);
            }
          } else if (lines.length === 1 && lines[0].includes("=")) {
            const equalsIndex = lines[0].indexOf("=");
            const key = lines[0].substring(0, equalsIndex).trim();
            const val = lines[0].substring(equalsIndex + 1).trim();
            const obj = {
              [key]: val,
            };
            return JSON.stringify(obj);
          }
        }

        return value;
      } catch (error) {
        return "";
      }
    }

    listEnv() {
      if (!hasNodeJS) return "";
      try {
        return JSON.stringify(process.env);
      } catch (error) {
        return "";
      }
    }

    loadEnvFile({path: filePath}) {
      if (!hasNodeJS) return "";

      const allowed =
        safeguardBypass ||
        this._checkSafeguard("load env file", {
          filename: filePath,
          operation: "load environment variables",
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Loading environment variables from file "${filePath}" was cancelled by user`);
        return "";
      }

      try {
        const resolvedPath = this._resolveFilePath(filePath);
        if (!fs.existsSync(resolvedPath)) return "";

        const content = fs.readFileSync(resolvedPath, "utf8");
        const lines = content.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          const equalsIndex = trimmed.indexOf("=");
          if (equalsIndex === -1) continue;

          const key = trimmed.substring(0, equalsIndex).trim();
          const value = trimmed
            .substring(equalsIndex + 1)
            .trim()
            .replace(/^['"]|['"]$/g, "");

          process.env[key] = value;
        }
        return "";
      } catch (error) {
        return "";
      }
    }

    parseEnvFile({path: filePath}) {
      if (!hasNodeJS) return "{}";

      const allowed =
        safeguardBypass ||
        this._checkSafeguard("parse env file", {
          filename: filePath,
          operation: "parse environment file",
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Parsing environment file "${filePath}" was cancelled by user`);
        return "{}";
      }

      try {
        const resolvedPath = this._resolveFilePath(filePath);
        if (!fs.existsSync(resolvedPath)) return "{}";

        const content = fs.readFileSync(resolvedPath, "utf8");
        const lines = content.split("\n");
        const result = {};

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          const equalsIndex = trimmed.indexOf("=");
          if (equalsIndex === -1) continue;

          const key = trimmed.substring(0, equalsIndex).trim();
          const value = trimmed
            .substring(equalsIndex + 1)
            .trim()
            .replace(/^['"]|['"]$/g, "");

          result[key] = value;
        }
        return JSON.stringify(result);
      } catch (error) {
        return "{}";
      }
    }

    _resolveFilePath(filename) {
      if (!hasNodeJS) return "";
      const fixedPath = Cast.toString(filename).replace(/\\/g, "/");
      if (path.isAbsolute(fixedPath)) {
        return path.resolve(fixedPath);
      }
      return path.resolve(this.focusDirectory, fixedPath);
    }

    _convertBytes(bytes, format) {
      const sizes = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        TB: 1024 * 1024 * 1024 * 1024,
        PB: 1024 * 1024 * 1024 * 1024 * 1024,
        EB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
        ZB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
        YB: 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
      };
      const size = sizes[Cast.toString(format).toUpperCase()] || sizes["B"];
      return bytes / size;
    }

    _isSensitiveReadPath(filePath) {
      if (!hasNodeJS) return false;

      const lowerPath = filePath.toLowerCase();
      const platform = os.platform();
      const homedir = os.homedir().toLowerCase();

      const sensitiveDirs = [];

      if (platform === "win32") {
        sensitiveDirs.push(path.join(homedir, "downloads"), path.join(homedir, "appdata"), path.join(homedir, "application data"), "c:\\windows", "c:\\system32", "c:\\program files", "c:\\programdata", "c:\\", "d:\\", "e:\\", "f:\\", "g:\\", "h:\\", "i:\\", "j:\\", "k:\\", "l:\\", "m:\\", "n:\\", "o:\\", "p:\\", "q:\\", "r:\\", "s:\\", "t:\\", "u:\\", "v:\\", "w:\\", "x:\\", "y:\\", "z:\\");
      } else if (platform === "darwin") {
        sensitiveDirs.push(path.join(homedir, "downloads"), path.join(homedir, "library", "application support"), path.join(homedir, "library", "caches"), "/applications", "/system", "/library", "/private", "/bin", "/sbin", "/usr", "/etc", "/var", "/");
      } else {
        sensitiveDirs.push(path.join(homedir, "downloads"), path.join(homedir, ".config"), path.join(homedir, ".cache"), path.join(homedir, ".local", "share"), "/etc", "/bin", "/sbin", "/usr", "/var", "/lib", "/sys", "/proc", "/root", "/");
      }

      return sensitiveDirs.some((sensitiveDir) => lowerPath.includes(sensitiveDir.toLowerCase()));
    }

    _checkSafeguard(operation, details) {
      if (!hasNodeJS) return true;
      if (safeguardBypass) return true;
      if (!safeguardAlerts) return true;
      if (isPackaged) return true;

      let message = "";

      if (operation === "env") {
        message = `DANGER! ARE YOU ABSOLUTELY SURE YOU WANT TO MODIFY ENVIRONMENT VARIABLES?\n\n`;
        message += `This action may BREAK THE COMPUTER and cause applications to stop working.\n\n`;
        if (details.name && details.value) {
          message += `You are setting: ${details.name} = ${details.value}`;
        } else if (details.name) {
          message += `You are deleting: ${details.name}`;
        }
      } else if (operation === "open") {
        message = `Are you sure you want to open this file?\n`;
        message += `File: ${details.filename}\nLocation: ${details.path}\n\n`;
        message += `This will open the file with the default application for its type.`;
      } else if (operation === "open in app") {
        message = `Are you sure you want to open this file in the specified application?\n`;
        message += `File: ${details.filename}\nApplication: ${details.app}\nLocation: ${details.path}\n\n`;
        message += `This will open the file with the specified application.`;
      } else {
        message = `Are you sure you want to ${operation}?\n`;

        switch (operation) {
          case "move":
            message += `Source: ${details.source}\nDestination: ${details.dest}`;
            break;
          case "copy":
            message += `Source: ${details.source}\nDestination: ${details.dest}`;
            break;
          case "create":
            if (details.foldername) {
              message += `Folder: ${details.foldername}`;
            } else {
              message += `File: ${details.filename}`;
            }
            break;
          case "delete":
            if (details.foldername) {
              message += `Folder: ${details.foldername}`;
            } else {
              message += `File: ${details.filename}`;
            }
            break;
          case "read":
            message += `File: ${details.filename}\nLocation: ${details.path}`;
            break;
          case "convert data URL to file":
            message += `Converting data URL to ${details.filename}\nThis will create a new file.`;
            break;
          case "upload file":
            message += `Uploading a file\nThis will create a new file on your system.`;
            break;
          case "download":
            message += `Downloading a file\nThis will save a file to your system.`;
            break;
        }
      }

      message += "\n\nClick OK to continue, or Cancel to deny.";
      console.warn(`[Node Data] SAFEGUARD: Requesting user confirmation for ${operation} operation`);
      const allowed = confirm(message);
      if (allowed) {
        console.log(`[Node Data] User allowed ${operation} operation`);
      }
      return allowed;
    }

    _copyFolderRecursive(source, dest) {
      if (!hasNodeJS) return;

      if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
        return;
      }

      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, {
          recursive: true,
        });
      }

      const items = fs.readdirSync(source);

      for (const item of items) {
        const sourcePath = path.join(source, item);
        const destPath = path.join(dest, item);

        if (fs.statSync(sourcePath).isDirectory()) {
          this._copyFolderRecursive(sourcePath, destPath);
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    }

    _filterByContentType(type, ext) {
      const contentTypeMap = {
        files: [],
        media: [".mp3", ".wav", ".ogg", ".aac", ".flac", ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"],
        audio: [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a", ".wma", ".aiff", ".au"],
        midi: [".mid", ".midi"],
        images: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
        videos: [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm", ".mkv"],
        "context files": [".json", ".xml", ".txt", ".csv", ".ini", ".cfg", ".conf", ".yaml", ".yml", ".properties"],
        "code files": [".js", ".lua", ".hx", ".py", ".java", ".c", ".cpp", ".h", ".cs", ".php", ".html", ".css", ".ts", ".rs", ".go", ".rb", ".pl", ".sh", ".bat", ".ps1", ".md"],
      };

      if (contentTypeMap.hasOwnProperty(Cast.toString(type).toLowerCase())) {
        return contentTypeMap[Cast.toString(type).toLowerCase()];
      }

      if (Cast.toString(type).startsWith(".")) {
        return [Cast.toString(type).toLowerCase()];
      }

      return contentTypeMap["files"];
    }

    _detectFileTypeFromBuffer(buffer) {
      if (buffer.length < 8) return "bin";

      const header = buffer.slice(0, 8);

      if (header[0] === 0x50 && header[1] === 0x4b && (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07) && (header[3] === 0x04 || header[3] === 0x06 || header[3] === 0x08)) {
        return "zip";
      }

      if (header[0] === 0x52 && header[1] === 0x61 && header[2] === 0x72 && header[3] === 0x21) {
        return "rar";
      }

      if (header[0] === 0x37 && header[1] === 0x7a && header[2] === 0xbc && header[3] === 0xaf) {
        return "7z";
      }

      if (header[0] === 0x1f && header[1] === 0x8b) {
        return "gz";
      }

      if (buffer.length >= 512) {
        const tarHeader = buffer.slice(0, 512);
        if (this._looksLikeTar(tarHeader)) {
          return "tar";
        }
      }

      if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
        return "png";
      }

      if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
        return "jpg";
      }

      if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
        return "gif";
      }

      if (header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46) {
        return "pdf";
      }

      return "bin";
    }

    _looksLikeTar(header) {
      let printableCount = 0;
      for (let i = 0; i < 100; i++) {
        const byte = header[i];
        if ((byte >= 0x20 && byte <= 0x7e) || byte === 0) {
          printableCount++;
        }
      }

      return printableCount > 80;
    }

    _triggerTrackerCheck() {
        this._checkAllTrackers();
    }

    getStorageDevicesArray() {
      if (!hasNodeJS) return ["/"];
      try {
        const devices = [];
        const platform = os.platform();

        if (platform === "win32") {
          for (let i = 65; i <= 90; i++) {
            const drive = String.fromCharCode(i) + ":\\";
            try {
              fs.accessSync(drive);
              devices.push(drive);
            } catch (e) {}
          }
        } else {
          const commonMounts = ["/", "/home", "/mnt", "/media", "/Volumes"];
          for (const mount of commonMounts) {
            try {
              if (fs.existsSync(mount)) {
                devices.push(mount);
              }
            } catch (e) {}
          }

          if (platform === "linux") {
            try {
              if (fs.existsSync("/etc/fstab")) {
                const fstab = fs.readFileSync("/etc/fstab", "utf8");
                const lines = fstab.split("\n");
                for (const line of lines) {
                  if (line.trim() && !line.startsWith("#")) {
                    const parts = line.split(/\s+/);
                    if (parts.length >= 2 && parts[1].startsWith("/")) {
                      const mountPoint = parts[1];
                      if (fs.existsSync(mountPoint) && !devices.includes(mountPoint)) {
                        devices.push(mountPoint);
                      }
                    }
                  }
                }
              }
            } catch (e) {}
          }
        }
        
        if (devices.length === 0) {
          devices.push("/");
        }
        
        return devices;
      } catch (error) {
        return ["/"];
      }
    }

    storageDevices() {
      return JSON.stringify(this.getStorageDevicesArray());
    }

    directoryBookmark({type}) {
      if (!hasNodeJS) return "";
      try {
        const platform = os.platform();
        const homedir = os.homedir();

        switch (Cast.toString(type)) {
          case "current executable":
            return path.dirname(process.execPath);
          case "root":
            if (platform === "win32") {
              const root = getRootWIN(process.execPath);
              return root || "C:\\";
            } else {
              return "/";
            }
          case "user":
            return homedir;
          case "appdata":
            if (platform === "win32") {
              return process.env.APPDATA || path.join(homedir, "AppData", "Roaming");
            } else if (platform === "darwin") {
              return path.join(homedir, "Library", "Application Support");
            } else {
              return process.env.XDG_CONFIG_HOME || path.join(homedir, ".config");
            }
          case "localdata":
            if (platform === "win32") {
              return process.env.LOCALAPPDATA || path.join(homedir, "AppData", "Local");
            } else if (platform === "darwin") {
              return path.join(homedir, "Library", "Application Support");
            } else {
              return process.env.XDG_DATA_HOME || path.join(homedir, ".local", "share");
            }
          case "download":
            if (platform === "win32") {
              return path.join(homedir, "Downloads");
            } else if (platform === "darwin") {
              return path.join(homedir, "Downloads");
            } else {
              return path.join(homedir, "Downloads");
            }
          case "documents":
            if (platform === "win32") {
              return path.join(homedir, "Documents");
            } else if (platform === "darwin") {
              return path.join(homedir, "Documents");
            } else {
              return path.join(homedir, "Documents");
            }
          case "desktop":
            if (platform === "win32") {
              return path.join(homedir, "Desktop");
            } else if (platform === "darwin") {
              return path.join(homedir, "Desktop");
            } else {
              return path.join(homedir, "Desktop");
            }
          case "music":
            if (platform === "win32") {
              return path.join(homedir, "Music");
            } else if (platform === "darwin") {
              return path.join(homedir, "Music");
            } else {
              return path.join(homedir, "Music");
            }
          case "video":
            if (platform === "win32") {
              return path.join(homedir, "Videos");
            } else if (platform === "darwin") {
              return path.join(homedir, "Movies");
            } else {
              return path.join(homedir, "Videos");
            }
          case "picture":
            if (platform === "win32") {
              return path.join(homedir, "Pictures");
            } else if (platform === "darwin") {
              return path.join(homedir, "Pictures");
            } else {
              return path.join(homedir, "Pictures");
            }
          default:
            return "";
        }
      } catch (error) {
        return "";
      }
    }

    readFile({filename, format}) {
      if (!hasNodeJS) return "";

      const filePath = this._resolveFilePath(filename);
      if (this._isSensitiveReadPath(filePath) && safeguardAlerts && !safeguardBypass) {
        const allowed = this._checkSafeguard("read", {
          filename: filename,
          path: filePath,
        });
        if (!allowed) {
          console.error(`[Node Data] SAFEGUARD BLOCKED: Reading file "${filename}" at path "${filePath}" was cancelled by user`);
          return "";
        }
      }

      try {
        if (!fs.existsSync(filePath)) return "";

        switch (Cast.toString(format)) {
          case "text":
            return fs.readFileSync(filePath, "utf8");
          case "base64":
            const fileBuffer = fs.readFileSync(filePath);
            return fileBuffer.toString("base64");
          case "dataurl":
            const buffer = fs.readFileSync(filePath);
            const base64Data = buffer.toString("base64");
            let mimeType = "application/octet-stream";
            const ext = path.extname(filePath).toLowerCase();
            const mimeMap = {
              ".txt": "text/plain",
              ".html": "text/html",
              ".css": "text/css",
              ".js": "application/javascript",
              ".json": "application/json",
              ".png": "image/png",
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".gif": "image/gif",
              ".svg": "image/svg+xml",
              ".mp3": "audio/mpeg",
              ".wav": "audio/wav",
              ".mp4": "video/mp4",
              ".pdf": "application/pdf",
            };
            if (mimeMap[ext]) {
              mimeType = mimeMap[ext];
            }
            return `data:${mimeType};base64,${base64Data}`;
          default:
            return fs.readFileSync(filePath, "utf8");
        }
      } catch (error) {
        return "";
      }
    }

    fileNameWithoutExtension({filename}) {
      try {
        const parsed = path.parse(Cast.toString(filename));
        return parsed.name;
      } catch (error) {
        const str = Cast.toString(filename);
        const lastDotIndex = str.lastIndexOf(".");
        if (lastDotIndex === -1) return str;
        return str.substring(0, lastDotIndex);
      }
    }

    setEnv({name, value}) {
      if (!hasNodeJS) return "";
      const allowed =
        safeguardBypass ||
        this._checkSafeguard("env", {
          name: name,
          value: value,
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Setting environment variable "${name}" to "${value}" was cancelled by user`);
        return "";
      }
      try {
        process.env[name] = Cast.toString(value);
        return "";
      } catch (error) {
        return "";
      }
    }

    deleteEnv({name}) {
      if (!hasNodeJS) return "";
      const allowed =
        safeguardBypass ||
        this._checkSafeguard("env", {
          name: name,
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Deleting environment variable "${name}" was cancelled by user`);
        return "";
      }
      try {
        delete process.env[name];
        return "";
      } catch (error) {
        return "";
      }
    }

    createFolder({foldername}) {
      if (!hasNodeJS) return "";
      const allowed =
        safeguardBypass ||
        this._checkSafeguard("create", {
          foldername: foldername,
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Creating folder "${foldername}" was cancelled by user`);
        return "";
      }
      try {
        const folderPath = this._resolveFilePath(foldername);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, {
            recursive: true,
          });
        }
        this._triggerTrackerCheck();
        return "";
      } catch (error) {
        return "";
      }
    }

    isNodeJS() {
      return hasNodeJS;
    }

    nodeVersion() {
      return hasNodeJS ? process.versions.node : "";
    }

    currentUser() {
      if (!hasNodeJS) return "";
      try {
        return os.userInfo().username;
      } catch (error) {
        return "";
      }
    }

    computerName() {
      if (!hasNodeJS) return "";
      try {
        return os.hostname();
      } catch (error) {
        return "";
      }
    }

    setFocusDirectory({directory}) {
      if (!hasNodeJS) return "";
      try {
        const newDir = path.resolve(Cast.toString(directory));
        if (fs.existsSync(newDir) && fs.statSync(newDir).isDirectory()) {
          this.focusDirectory = newDir;
          process.chdir(newDir);
        }
        return "";
      } catch (error) {
        return "";
      }
    }

    getFocusDirectory() {
      return hasNodeJS ? this.focusDirectory : "";
    }

    endFolderOfDirectory({directory}) {
      if (!hasNodeJS) return "";
      try {
        const resolvedPath = path.resolve(Cast.toString(directory));
        return path.basename(resolvedPath);
      } catch (error) {
        return "";
      }
    }

    allInDirectory({type, directory, extension}) {
      if (!hasNodeJS) return "[]";
      try {
        const dir = path.resolve(Cast.toString(directory));
        if (!fs.existsSync(dir)) return "[]";

        const items = fs.readdirSync(dir);
        const showExtension = Cast.toString(extension) === "with extension";
        const allowedExtensions = this._filterByContentType(Cast.toString(type), "");

        let filteredItems = items.filter((item) => {
          const fullPath = path.join(dir, item);
          if (!fs.statSync(fullPath).isFile()) return false;
          const ext = path.extname(item).toLowerCase();
          if (allowedExtensions.length === 0) return true;
          return allowedExtensions.includes(ext);
        });

        if (!showExtension) {
          filteredItems = filteredItems.map((item) => path.basename(item, path.extname(item)));
        }

        return JSON.stringify(filteredItems);
      } catch (error) {
        return "[]";
      }
    }

    allFoldersInDirectory({directory}) {
      if (!hasNodeJS) return "[]";
      try {
        const dir = path.resolve(Cast.toString(directory));
        if (!fs.existsSync(dir)) return "[]";
        const items = fs.readdirSync(dir);
        const folders = items.filter((item) => {
          const fullPath = path.join(dir, item);
          return fs.statSync(fullPath).isDirectory();
        });
        return JSON.stringify(folders);
      } catch (error) {
        return "[]";
      }
    }

    fileSize({name, format}) {
      if (!hasNodeJS) return 0;
      try {
        const filePath = this._resolveFilePath(name);
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          return 0;
        }
        const stats = fs.statSync(filePath);
        return this._convertBytes(stats.size, Cast.toString(format));
      } catch (error) {
        return 0;
      }
    }

    fileSizePure({name, type}) {
      if (!hasNodeJS) return Cast.toString(type) === "pure" ? 0 : "0 B";
      try {
        const filePath = this._resolveFilePath(name);
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          return Cast.toString(type) === "pure" ? 0 : "0 B";
        }
        const stats = fs.statSync(filePath);
        return Cast.toString(type) === "pure" ? stats.size : this._formatBytes(stats.size);
      } catch (error) {
        return Cast.toString(type) === "pure" ? 0 : "0 B";
      }
    }

    fileExists({filename}) {
      if (!hasNodeJS) return false;
      try {
        const filePath = this._resolveFilePath(filename);
        return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
      } catch (error) {
        return false;
      }
    }

    folderExists({foldername}) {
      if (!hasNodeJS) return false;
      try {
        const folderPath = this._resolveFilePath(foldername);
        return fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();
      } catch (error) {
        return false;
      }
    }

    isDirectory({path: filePath}) {
      if (!hasNodeJS) return false;
      try {
        const resolvedPath = this._resolveFilePath(filePath);
        return fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory();
      } catch (error) {
        return false;
      }
    }

    countLines({filename}) {
      if (!hasNodeJS) return 0;
      try {
        const filePath = this._resolveFilePath(filename);
        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
          return 0;
        }
        const content = fs.readFileSync(filePath, "utf8");
        if (content.trim() === "") {
          return 0;
        }
        const lines = content.split("\n");
        return lines.length;
      } catch (error) {
        return 0;
      }
    }

    createSymlink({target, linkname}) {
      if (!hasNodeJS) return "";
      const allowed =
        safeguardBypass ||
        this._checkSafeguard("symlink", {
          source: target,
          dest: linkname,
        });
      if (!allowed) {
        console.error(`[Node Data] SAFEGUARD BLOCKED: Creating symbolic link from "${target}" to "${linkname}" was cancelled by user`);
        return "";
      }
      try {
        const targetPath = this._resolveFilePath(target);
        const linkPath = this._resolveFilePath(linkname);
        fs.symlinkSync(targetPath, linkPath);
        this._triggerTrackerCheck();
        return "";
      } catch (error) {
        return "";
      }
    }

    isSymlink({path: filePath}) {
      if (!hasNodeJS) return false;
      try {
        const resolvedPath = this._resolveFilePath(filePath);
        if (!fs.existsSync(resolvedPath)) return false;
        const stats = fs.lstatSync(resolvedPath);
        return stats.isSymbolicLink();
      } catch (error) {
        return false;
      }
    }

    getAbsolutePath({relative}) {
      if (!hasNodeJS) return "";
      try {
        return path.resolve(this.focusDirectory, Cast.toString(relative));
      } catch (error) {
        return "";
      }
    }

    totalStorage({device, format}) {
      if (!hasNodeJS) return 0;
      try {
        const stats = fs.statfsSync(Cast.toString(device));
        const totalBytes = stats.bsize * stats.blocks;
        return this._convertBytes(totalBytes, Cast.toString(format));
      } catch (error) {
        return 0;
      }
    }

    freeStorage({device, format}) {
      if (!hasNodeJS) return 0;
      try {
        const stats = fs.statfsSync(Cast.toString(device));
        const freeBytes = stats.bsize * stats.bfree;
        return this._convertBytes(freeBytes, Cast.toString(format));
      } catch (error) {
        return 0;
      }
    }

    osInfo({type}) {
      if (!hasNodeJS) return "";
      try {
        const osType = Cast.toString(type);
        const platform = os.platform();
        
        if (osType === "distro" || osType === "name") {
          if (platform === "win32") {
            return "Windows";
          } else if (platform === "darwin") {
            return "MacOS";
          } else if (platform === "linux") {
            try {
              const releaseInfo = fs.readFileSync("/etc/os-release", "utf8");
              const lines = releaseInfo.split("\n");
              for (const line of lines) {
                if (line.startsWith("PRETTY_NAME=")) {
                  return line.split("=")[1].replace(/"/g, "");
                }
              }
            } catch (e) {
              return "Linux";
            }
            return "Linux";
          } else if (platform === "android") {
            return "Android";
          } else {
            return os.type();
          }
        } else if (osType === "platform") {
          return platform;
        } else if (osType === "type") {
          return os.type();
        }
        return "";
      } catch (error) {
        return "";
      }
    }

    getCpuArch() {
      return hasNodeJS ? os.arch() : "";
    }

    memoryInfo({type}) {
      if (!hasNodeJS) return 0;
      try {
        const memType = Cast.toString(type);
        if (memType === "total") {
          return os.totalmem();
        } else if (memType === "free") {
          return os.freemem();
        } else if (memType === "used") {
          return os.totalmem() - os.freemem();
        }
        return 0;
      } catch (error) {
        return 0;
      }
    }

    getUptime() {
      return hasNodeJS ? os.uptime() : 0;
    }

    isConnectedToInternet() {
      if (!hasNodeJS) return false;

      try {
        const networkInterfaces = os.networkInterfaces();
        for (const interfaceName in networkInterfaces) {
          const interfaces = networkInterfaces[interfaceName];
          for (const iface of interfaces) {
            if (!iface.internal && (iface.family === "IPv4" || iface.family === "IPv6")) {
              return true;
            }
          }
        }
        return false;
      } catch (error) {
        return false;
      }
    }

    internetConnectionStrength() {
      if (!hasNodeJS) return 0;

      try {
        const networkInterfaces = os.networkInterfaces();
        let maxSpeed = 0;

        for (const interfaceName in networkInterfaces) {
          const interfaces = networkInterfaces[interfaceName];
          for (const iface of interfaces) {
            if (!iface.internal) {
              if (iface.mac !== "00:00:00:00:00:00") {
                maxSpeed = Math.max(maxSpeed, 100);
              }
            }
          }
        }

        return maxSpeed;
      } catch (error) {
        return 0;
      }
    }

    setDirectoryOfChangeTracker({tracker, dir}) {
      if (!hasNodeJS) return "";

      try {
        const trackerPath = this._resolveFilePath(Cast.toString(dir));
        if (!fs.existsSync(trackerPath)) {
          return "";
        }

        const trackerData = {
          path: trackerPath,
          lastCheckTime: null,
        };

        this.changeTrackers.set(Cast.toString(tracker), trackerData);
        this._startTrackerInterval();
        this._triggerTrackerCheck();
        return "";
      } catch (error) {
        return "";
      }
    }

    deleteChangeTracker({tracker}) {
      if (!hasNodeJS) return "";

      this.changeTrackers.delete(Cast.toString(tracker));
      this._startTrackerInterval();
      this._triggerTrackerCheck();
      return "";
    }

    deleteAllChangeTrackers() {
      if (!hasNodeJS) return "";

      this.changeTrackers.clear();
      this._startTrackerInterval();
      this._triggerTrackerCheck();
      return "";
    }

    listChangeTrackers() {
      if (!hasNodeJS) return "[]";

      const trackerNames = Array.from(this.changeTrackers.keys());
      return JSON.stringify(trackerNames);
    }

    changeTrackerCount() {
      if (!hasNodeJS) return 0;

      return this.changeTrackers.size;
    }

    changeTrackerExists({tracker}) {
      if (!hasNodeJS) return false;

      return this.changeTrackers.has(Cast.toString(tracker));
    }

    getDirectoryOfChangeTracker({tracker}) {
      if (!hasNodeJS) return "";

      const trackerData = this.changeTrackers.get(Cast.toString(tracker));
      if (!trackerData) return "";

      return trackerData.path;
    }

    setTrackerUpdateInterval({seconds}) {
      if (!hasNodeJS) return "";

      this.trackerUpdateInterval = Math.max(100, Cast.toNumber(seconds) * 1000);
      this._startTrackerInterval();
      this._triggerTrackerCheck();
      return "";
    }

    getTrackerUpdateInterval() {
      if (!hasNodeJS) return 0;

      return this.trackerUpdateInterval / 1000;
    }

    whenChangeTrackerTriggered({tracker}) {
      return true;
    }
  }

  Scratch.extensions.register(new NodeDataExtension());
})(Scratch);