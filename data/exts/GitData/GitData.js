(function (Scratch) {
  "use strict";
  
  if (!Scratch.extensions.unsandboxed) {
    throw new Error('"Git Data" must be ran unsandboxed.');
  }

  const {Cast, BlockType, BlockShape, ArgumentType, vm, translate, runtime} = Scratch;
  
  const ext = {
    id: "dragogitdata",
    name: translate("Git Data"),
    colors: ["#36454F", "#0A0A0A", "#F5F5F5"]
  };

  class GitDataExtension {
    constructor() {
      this.currentRepo = null;
      this.currentRepoData = null;
      this.currentRepoStats = null;
      this.focusDirectory = "";
      this.baseDirectory = "";
      this.repoCache = {};
      this.statsCache = {};
      this.fileCommitCache = {};
      this.cacheTTL = 300000;
      
      this.showCategory = {
        repository: false,
        directory: false,
        files: false
      };
    }

    async _fetchRepoData(repoUrl) {
      try {
        const now = Date.now();
        if (this.repoCache[repoUrl] && (now - this.repoCache[repoUrl].timestamp) < this.cacheTTL) {
          return this.repoCache[repoUrl].data;
        }

        const repoPath = this._parseGithubUrl(repoUrl);
        if (!repoPath) {
          throw new Error("Invalid GitHub URL");
        }

        const apiUrl = `https://api.github.com/repos/${repoPath}/git/trees/main?recursive=1`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const altUrl = `https://api.github.com/repos/${repoPath}/git/trees/master?recursive=1`;
          const altResponse = await fetch(altUrl);
          if (!altResponse.ok) {
            throw new Error(`Failed to fetch repository: ${response.status}`);
          }
          const data = await altResponse.json();
          this.repoCache[repoUrl] = {
            data: data,
            timestamp: now
          };
          return data;
        }
        
        const data = await response.json();
        this.repoCache[repoUrl] = {
          data: data,
          timestamp: now
        };
        return data;
      } catch (error) {
        console.error("Git Data: Failed to fetch repository:", error);
        return null;
      }
    }

    async _fetchRepoStats(repoUrl) {
      try {
        const now = Date.now();
        if (this.statsCache[repoUrl] && (now - this.statsCache[repoUrl].timestamp) < this.cacheTTL) {
          return this.statsCache[repoUrl].data;
        }

        const repoPath = this._parseGithubUrl(repoUrl);
        if (!repoPath) {
          throw new Error("Invalid GitHub URL");
        }

        const apiUrl = `https://api.github.com/repos/${repoPath}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repository stats: ${response.status}`);
        }
        
        const data = await response.json();
        this.statsCache[repoUrl] = {
          data: data,
          timestamp: now
        };
        return data;
      } catch (error) {
        console.error("Git Data: Failed to fetch repository stats:", error);
        return null;
      }
    }

    async _fetchRepoCommits(repoUrl) {
      try {
        const repoPath = this._parseGithubUrl(repoUrl);
        if (!repoPath) {
          throw new Error("Invalid GitHub URL");
        }

        const apiUrl = `https://api.github.com/repos/${repoPath}/commits`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch commits: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Git Data: Failed to fetch commits:", error);
        return null;
      }
    }

    async _fetchFileCommits(repoUrl, filePath) {
      try {
        const repoPath = this._parseGithubUrl(repoUrl);
        if (!repoPath) {
          throw new Error("Invalid GitHub URL");
        }

        const apiUrl = `https://api.github.com/repos/${repoPath}/commits?path=${encodeURIComponent(filePath)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file commits: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Git Data: Failed to fetch file commits:", error);
        return null;
      }
    }

    _parseGithubUrl(url) {
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== "github.com") {
          return null;
        }
        const pathParts = urlObj.pathname.split("/").filter(part => part.length > 0);
        if (pathParts.length < 2) {
          return null;
        }
        return `${pathParts[0]}/${pathParts[1]}`;
      } catch (error) {
        return null;
      }
    }

    _resolvePath(path) {
      if (!this.currentRepoData) return "";
      
      path = path.replace(/\\/g, "/");
      
      if (path.startsWith("/")) {
        return path.substring(1);
      }
      
      const currentPath = this.focusDirectory || "";
      if (currentPath === "" || currentPath === "/") {
        return path;
      }
      
      let currentParts = currentPath.split("/").filter(part => part.length > 0);
      let inputParts = path.split("/").filter(part => part.length > 0);
      
      for (let part of inputParts) {
        if (part === "..") {
          if (currentParts.length > 0) {
            currentParts.pop();
          }
        } else if (part !== "." && part !== "") {
          currentParts.push(part);
        }
      }
      
      return currentParts.join("/");
    }

    _getFileInfo(path) {
      if (!this.currentRepoData || !this.currentRepoData.tree) return null;
      
      const normalizedPath = path.replace(/^\//, "");
      const file = this.currentRepoData.tree.find(item => 
        item.path === normalizedPath && item.type === "blob"
      );
      
      if (file) {
        return {
          name: file.path.split("/").pop(),
          path: file.path,
          sha: file.sha,
          url: file.url,
          size: 0
        };
      }
      return null;
    }

    _getDirectoryInfo(path) {
      if (!this.currentRepoData || !this.currentRepoData.tree) return null;
      
      const normalizedPath = path.replace(/^\//, "");
      const items = this.currentRepoData.tree.filter(item => 
        item.path.startsWith(normalizedPath + "/") || 
        (normalizedPath === "" && item.path.indexOf("/") === -1)
      );
      
      if (items.length > 0) {
        return {
          path: normalizedPath,
          items: items
        };
      }
      return null;
    }

    _getRepoInfo() {
      if (!this.currentRepoData) return null;
      
      const repoPath = this._parseGithubUrl(this.currentRepo);
      if (!repoPath) return null;
      
      const [owner, repo] = repoPath.split("/");
      
      return {
        author: owner,
        name: repo,
        fullName: repoPath,
        defaultBranch: this.currentRepoData.sha ? "main" : "master",
        treeSha: this.currentRepoData.sha,
        url: `https://github.com/${repoPath}`
      };
    }

    async _fetchFileContent(fileUrl) {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Git Data: Failed to fetch file content:", error);
        return null;
      }
    }

    async _getFileContent(path) {
      const fileInfo = this._getFileInfo(path);
      if (!fileInfo || !fileInfo.url) {
        return null;
      }
      
      const fileData = await this._fetchFileContent(fileInfo.url);
      if (!fileData || !fileData.content) {
        return null;
      }
      
      if (fileData.encoding === "base64") {
        try {
          return atob(fileData.content);
        } catch (error) {
          return fileData.content;
        }
      }
      
      return fileData.content;
    }

    toggleCategoryRepository() {
      this.showCategory.repository = !this.showCategory.repository;
      this.reloadBlocks();
    }

    toggleCategoryDirectory() {
      this.showCategory.directory = !this.showCategory.directory;
      this.reloadBlocks();
    }

    toggleCategoryFiles() {
      this.showCategory.files = !this.showCategory.files;
      this.reloadBlocks();
    }

    reloadBlocks() {
      if (vm && vm.extensionManager) {
        vm.extensionManager.refreshBlocks();
      }
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
            opcode: "toggleCategoryRepository",
            func: "toggleCategoryRepository",
            blockType: BlockType.BUTTON,
            text: this.showCategory.repository ? "close repository folder" : "open repository folder",
          },
          {
            blockType: BlockType.LABEL,
            text: translate("Repository"),
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "focusAtRepository",
            blockType: BlockType.COMMAND,
            text: translate("focus at repository [url]"),
            arguments: {
              url: {
                type: ArgumentType.STRING,
                defaultValue: "https://github.com/username/repository",
              },
            },
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "reloadGithubData",
            blockType: BlockType.COMMAND,
            text: translate("reload github data"),
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "githubAttribute",
            blockType: BlockType.REPORTER,
            text: translate("github [attribute]"),
            allowDropAnywhere: true,
            arguments: {
              attribute: {
                type: ArgumentType.STRING,
                menu: "githubAttributes",
                defaultValue: "author",
              },
            },
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "isRepoLoaded",
            blockType: BlockType.BOOLEAN,
            text: translate("repository loaded?"),
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "getCurrentRepoUrl",
            blockType: BlockType.REPORTER,
            text: translate("current repository url"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "repoAssetCount",
            blockType: BlockType.REPORTER,
            text: translate("[asset] count"),
            allowDropAnywhere: true,
            arguments: {
              asset: {
                type: ArgumentType.STRING,
                menu: "repoAssets",
                defaultValue: "star",
              },
            },
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "lastCommitAuthor",
            blockType: BlockType.REPORTER,
            text: translate("last commit author"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "lastCommitMessage",
            blockType: BlockType.REPORTER,
            text: translate("last commit message"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.repository,
          },
          {
            opcode: "lastCommitTimespan",
            blockType: BlockType.REPORTER,
            text: translate("last commit timespan [timeunit]"),
            allowDropAnywhere: true,
            arguments: {
              timeunit: {
                type: ArgumentType.STRING,
                menu: "timeUnits",
                defaultValue: "days",
              },
            },
            hideFromPalette: !this.showCategory.repository,
          },

          {
            opcode: "toggleCategoryDirectory",
            func: "toggleCategoryDirectory",
            blockType: BlockType.BUTTON,
            text: this.showCategory.directory ? "close directory folder" : "open directory folder",
          },
          {
            blockType: BlockType.LABEL,
            text: translate("Directory"),
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "setFocusDirectory",
            blockType: BlockType.COMMAND,
            text: translate("set focus directory to [directory]"),
            arguments: {
              directory: {
                type: ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "getFocusDirectory",
            blockType: BlockType.REPORTER,
            text: translate("focus directory"),
            allowDropAnywhere: true,
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "convertToFullDirectory",
            blockType: BlockType.REPORTER,
            text: translate("convert [directory] to full directory"),
            allowDropAnywhere: true,
            arguments: {
              directory: {
                type: ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "directoryBookmark",
            blockType: BlockType.REPORTER,
            text: translate("[type] directory"),
            allowDropAnywhere: true,
            arguments: {
              type: {
                type: ArgumentType.STRING,
                menu: "directoryBookmarks",
                defaultValue: "base",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "endFolderOfDirectory",
            blockType: BlockType.REPORTER,
            text: translate("end folder of [directory]"),
            allowDropAnywhere: true,
            arguments: {
              directory: {
                type: ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "allInDirectory",
            blockType: BlockType.REPORTER,
            text: translate("all [type] in [directory] [extension]"),
            allowDropAnywhere: true,
            arguments: {
              type: {
                type: ArgumentType.STRING,
                menu: "contentType",
                defaultValue: "files",
              },
              directory: {
                type: ArgumentType.STRING,
                defaultValue: ".",
              },
              extension: {
                type: ArgumentType.STRING,
                menu: "extensionType",
                defaultValue: "with extension",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "allFoldersInDirectory",
            blockType: BlockType.REPORTER,
            text: translate("all folders in [directory]"),
            allowDropAnywhere: true,
            arguments: {
              directory: {
                type: ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "isDirectory",
            blockType: BlockType.BOOLEAN,
            text: translate("is [path] a directory?"),
            arguments: {
              path: {
                type: ArgumentType.STRING,
                defaultValue: ".",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "isDirectoryCommandValid",
            blockType: BlockType.BOOLEAN,
            text: translate("does [directory] point to [content]?"),
            arguments: {
              directory: {
                type: ArgumentType.STRING,
                defaultValue: ".",
              },
              content: {
                type: ArgumentType.STRING,
                menu: "contentTypePoint",
                defaultValue: "file",
              },
            },
            hideFromPalette: !this.showCategory.directory,
          },
          {
            opcode: "getAbsolutePath",
            blockType: BlockType.REPORTER,
            text: translate("get absolute path of [relative]"),
            allowDropAnywhere: true,
            arguments: {
              relative: {
                type: ArgumentType.STRING,
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
            text: translate("Files"),
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "readFile",
            blockType: BlockType.REPORTER,
            text: translate("read file [filename] as [format]"),
            allowDropAnywhere: true,
            arguments: {
              filename: {
                type: ArgumentType.STRING,
                defaultValue: "README.md",
              },
              format: {
                type: ArgumentType.STRING,
                menu: "readableFormats",
                defaultValue: "text",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "fileNameWithoutExtension",
            blockType: BlockType.REPORTER,
            text: translate("[filename] without extension"),
            allowDropAnywhere: true,
            arguments: {
              filename: {
                type: ArgumentType.STRING,
                defaultValue: "script.js",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "fileExists",
            blockType: BlockType.BOOLEAN,
            text: translate("file [filename] exists?"),
            arguments: {
              filename: {
                type: ArgumentType.STRING,
                defaultValue: "README.md",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "folderExists",
            blockType: BlockType.BOOLEAN,
            text: translate("folder [foldername] exists?"),
            arguments: {
              foldername: {
                type: ArgumentType.STRING,
                defaultValue: "src",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "countLines",
            blockType: BlockType.REPORTER,
            text: translate("count lines in file [filename]"),
            allowDropAnywhere: true,
            arguments: {
              filename: {
                type: ArgumentType.STRING,
                defaultValue: "README.md",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "getFileLastUpdate",
            blockType: BlockType.REPORTER,
            text: translate("get last update [type] of file: [filepath]"),
            allowDropAnywhere: true,
            arguments: {
              type: {
                type: ArgumentType.STRING,
                menu: "dateTimeTypes",
                defaultValue: "date",
              },
              filepath: {
                type: ArgumentType.STRING,
                defaultValue: "README.md",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "getFileCommitMessage",
            blockType: BlockType.REPORTER,
            text: translate("get commit message of file: [filepath]"),
            allowDropAnywhere: true,
            arguments: {
              filepath: {
                type: ArgumentType.STRING,
                defaultValue: "README.md",
              },
            },
            hideFromPalette: !this.showCategory.files,
          },
          {
            opcode: "getFileCommitAuthor",
            blockType: BlockType.REPORTER,
            text: translate("get commit author of file: [filepath]"),
            allowDropAnywhere: true,
            arguments: {
              filepath: {
                type: ArgumentType.STRING,
                defaultValue: "README.md",
              },
            },
            hideFromPalette: !this.showCategory.files,
          }
        ],
        menus: {
          githubAttributes: {
            acceptReporters: true,
            items: [
              {
                text: translate("author"),
                value: "author",
              },
              {
                text: translate("name"),
                value: "name",
              },
              {
                text: translate("full name"),
                value: "full name",
              },
              {
                text: translate("url"),
                value: "url",
              },
              {
                text: translate("default branch"),
                value: "default branch",
              },
              {
                text: translate("tree sha"),
                value: "tree sha",
              },
            ],
          },
          repoAssets: {
            acceptReporters: true,
            items: [
              {
                text: translate("commit"),
                value: "commit",
              },
              {
                text: translate("watch"),
                value: "watch",
              },
              {
                text: translate("star"),
                value: "star",
              },
              {
                text: translate("fork"),
                value: "fork",
              },
              {
                text: translate("branch"),
                value: "branch",
              },
            ],
          },
          timeUnits: {
            acceptReporters: true,
            items: [
              {
                text: translate("seconds"),
                value: "seconds",
              },
              {
                text: translate("minutes"),
                value: "minutes",
              },
              {
                text: translate("hours"),
                value: "hours",
              },
              {
                text: translate("days"),
                value: "days",
              },
              {
                text: translate("weeks"),
                value: "weeks",
              },
              {
                text: translate("months"),
                value: "months",
              },
              {
                text: translate("years"),
                value: "years",
              },
            ],
          },
          dateTimeTypes: {
            acceptReporters: true,
            items: [
              {
                text: translate("date"),
                value: "date",
              },
              {
                text: translate("time"),
                value: "time",
              },
              {
                text: translate("full date and time"),
                value: "full",
              },
            ],
          },
          contentType: {
            acceptReporters: true,
            items: [
              {
                text: translate("files"),
                value: "files",
              },
              {
                text: translate("media"),
                value: "media",
              },
              {
                text: translate("audio"),
                value: "audio",
              },
              {
                text: translate("midi"),
                value: "midi",
              },
              {
                text: translate("images"),
                value: "images",
              },
              {
                text: translate("videos"),
                value: "videos",
              },
              {
                text: translate("context files"),
                value: "context files",
              },
              {
                text: translate("code files"),
                value: "code files",
              },
            ],
          },
          contentTypePoint: {
            acceptReporters: true,
            items: [
              {
                text: translate("file"),
                value: "file",
              },
              {
                text: translate("folder"),
                value: "folder",
              },
              {
                text: translate("media"),
                value: "media",
              },
              {
                text: translate("audio"),
                value: "audio",
              },
              {
                text: translate("image"),
                value: "image",
              },
              {
                text: translate("video"),
                value: "video",
              },
              {
                text: translate("music"),
                value: "music",
              },
            ],
          },
          extensionType: {
            acceptReporters: true,
            items: [
              {
                text: translate("with extension"),
                value: "with extension",
              },
              {
                text: translate("without extension"),
                value: "without extension",
              },
            ],
          },
          directoryBookmarks: {
            acceptReporters: true,
            items: [
              {
                text: translate("base"),
                value: "base",
              },
              {
                text: translate("root"),
                value: "root",
              },
              {
                text: translate("current"),
                value: "current",
              },
            ],
          },
          readableFormats: {
            acceptReporters: true,
            items: [
              {
                text: translate("text"),
                value: "text",
              },
              {
                text: translate("raw"),
                value: "raw",
              },
            ],
          },
        },
      };
    }

    async focusAtRepository({url}) {
      const repoUrl = Cast.toString(url);
      this.currentRepo = repoUrl;
      
      try {
        const repoData = await this._fetchRepoData(repoUrl);
        if (repoData) {
          this.currentRepoData = repoData;
          this.focusDirectory = "";
          const repoInfo = this._getRepoInfo();
          this.baseDirectory = repoInfo ? repoInfo.name : "repository";
          this.currentRepoStats = await this._fetchRepoStats(repoUrl);
          return "";
        } else {
          this.currentRepo = null;
          this.currentRepoData = null;
          this.currentRepoStats = null;
          this.focusDirectory = "";
          this.baseDirectory = "";
          return "";
        }
      } catch (error) {
        this.currentRepo = null;
        this.currentRepoData = null;
        this.currentRepoStats = null;
        this.focusDirectory = "";
        this.baseDirectory = "";
        return "";
      }
    }

    async reloadGithubData() {
      if (!this.currentRepo) {
        this.currentRepoData = null;
        this.currentRepoStats = null;
        this.focusDirectory = "";
        this.baseDirectory = "";
        return "";
      }
      
      delete this.repoCache[this.currentRepo];
      delete this.statsCache[this.currentRepo];
      
      try {
        const repoData = await this._fetchRepoData(this.currentRepo);
        if (repoData) {
          this.currentRepoData = repoData;
          this.focusDirectory = "";
          const repoInfo = this._getRepoInfo();
          this.baseDirectory = repoInfo ? repoInfo.name : "repository";
          this.currentRepoStats = await this._fetchRepoStats(this.currentRepo);
          return "";
        } else {
          this.currentRepo = null;
          this.currentRepoData = null;
          this.currentRepoStats = null;
          this.focusDirectory = "";
          this.baseDirectory = "";
          return "";
        }
      } catch (error) {
        this.currentRepo = null;
        this.currentRepoData = null;
        this.currentRepoStats = null;
        this.focusDirectory = "";
        this.baseDirectory = "";
        return "";
      }
    }

    githubAttribute({attribute}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const repoInfo = this._getRepoInfo();
      if (!repoInfo) {
        return "";
      }
      
      const attr = Cast.toString(attribute);
      switch (attr) {
        case "author":
          return repoInfo.author;
        case "name":
          return repoInfo.name;
        case "full name":
          return repoInfo.fullName;
        case "url":
          return repoInfo.url;
        case "default branch":
          return repoInfo.defaultBranch;
        case "tree sha":
          return repoInfo.treeSha || "";
        default:
          return "";
      }
    }

    isRepoLoaded() {
      return !!this.currentRepoData;
    }

    getCurrentRepoUrl() {
      return this.currentRepo || "";
    }

    async repoAssetCount({asset}) {
      if (!this.currentRepoStats) {
        return 0;
      }
      
      const assetType = Cast.toString(asset);
      switch (assetType) {
        case "commit":
          const commits = await this._fetchRepoCommits(this.currentRepo);
          return commits ? commits.length : 0;
        case "watch":
          return this.currentRepoStats.subscribers_count || 0;
        case "star":
          return this.currentRepoStats.stargazers_count || 0;
        case "fork":
          return (this.currentRepoStats.forks_count || 1) - 1;
        case "branch":
          return this.currentRepoStats.forks_count || 0;
        default:
          return 0;
      }
    }

    async lastCommitAuthor() {
      if (!this.currentRepo) {
        return "";
      }
      
      const commits = await this._fetchRepoCommits(this.currentRepo);
      if (!commits || commits.length === 0) {
        return "";
      }
      
      return commits[0].commit.author.name || "";
    }

    async lastCommitMessage() {
      if (!this.currentRepo) {
        return "";
      }
      
      const commits = await this._fetchRepoCommits(this.currentRepo);
      if (!commits || commits.length === 0) {
        return "";
      }
      
      return commits[0].commit.message || "";
    }

    async lastCommitTimespan({timeunit}) {
      if (!this.currentRepo) {
        return 0;
      }
      
      const commits = await this._fetchRepoCommits(this.currentRepo);
      if (!commits || commits.length === 0) {
        return 0;
      }
      
      const commitDate = new Date(commits[0].commit.author.date);
      const now = new Date();
      const diffMs = now - commitDate;
      
      const unit = Cast.toString(timeunit);
      switch (unit) {
        case "seconds":
          return Math.floor(diffMs / 1000);
        case "minutes":
          return Math.floor(diffMs / (1000 * 60));
        case "hours":
          return Math.floor(diffMs / (1000 * 60 * 60));
        case "days":
          return Math.floor(diffMs / (1000 * 60 * 60 * 24));
        case "weeks":
          return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
        case "months":
          return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
        case "years":
          return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
        default:
          return 0;
      }
    }

    setFocusDirectory({directory}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const dir = Cast.toString(directory);
      let newPath = this._resolvePath(dir);
      
      if (dir === "." || dir === "./") {
        return "";
      }
      
      if (dir === ".." || dir === "../") {
        const parts = this.focusDirectory.split("/").filter(p => p.length > 0);
        if (parts.length > 0) {
          parts.pop();
          this.focusDirectory = parts.join("/");
        } else {
          this.focusDirectory = "";
        }
        return "";
      }
      
      if (dir === "/" || dir === "") {
        this.focusDirectory = "";
        return "";
      }
      
      const dirInfo = this._getDirectoryInfo(newPath);
      if (dirInfo) {
        this.focusDirectory = newPath;
      }
      
      return "";
    }

    getFocusDirectory() {
      return this.focusDirectory || "/";
    }

    convertToFullDirectory({directory}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const dir = Cast.toString(directory);
      if (dir === "." || dir === "./") {
        return this.focusDirectory || "/";
      }
      
      if (dir === ".." || dir === "../") {
        const parts = this.focusDirectory.split("/").filter(p => p.length > 0);
        if (parts.length > 0) {
          parts.pop();
          return parts.join("/") || "/";
        }
        return "/";
      }
      
      if (dir.startsWith("/")) {
        return dir.substring(1) || "/";
      }
      
      const resolved = this._resolvePath(dir);
      return resolved || "/";
    }

    directoryBookmark({type}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const bookmarkType = Cast.toString(type);
      switch (bookmarkType) {
        case "base":
          return this.baseDirectory;
        case "root":
          return "/";
        case "current":
          return this.focusDirectory || "/";
        default:
          return "";
      }
    }

    endFolderOfDirectory({directory}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const dir = Cast.toString(directory);
      const resolvedPath = this.convertToFullDirectory({ directory: dir });
      
      if (resolvedPath === "/") {
        return "/";
      }
      
      const parts = resolvedPath.split("/").filter(p => p.length > 0);
      return parts.length > 0 ? parts[parts.length - 1] : "/";
    }

    allInDirectory({type, directory, extension}) {
      if (!this.currentRepoData || !this.currentRepoData.tree) {
        return "[]";
      }
      
      const dir = Cast.toString(directory);
      const resolvedPath = this.convertToFullDirectory({ directory: dir });
      const normalizedPath = resolvedPath === "/" ? "" : resolvedPath.replace(/^\//, "");
      
      const showExtension = Cast.toString(extension) === "with extension";
      const contentType = Cast.toString(type);
      
      const allowedExtensions = this._filterByContentType(contentType, "");
      
      const items = this.currentRepoData.tree.filter(item => {
        const itemPath = item.path;
        
        if (normalizedPath === "") {
          return itemPath.indexOf("/") === -1;
        }
        
        if (!itemPath.startsWith(normalizedPath + "/")) {
          return false;
        }
        
        const relativePath = itemPath.substring(normalizedPath.length + 1);
        return relativePath.indexOf("/") === -1;
      });
      
      const files = items.filter(item => item.type === "blob");
      
      let filteredFiles = files;
      if (allowedExtensions.length > 0) {
        filteredFiles = files.filter(item => {
          const fileName = item.path.split("/").pop();
          const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")).toLowerCase() : "";
          return allowedExtensions.includes(ext);
        });
      }
      
      let result = filteredFiles.map(item => {
        const fileName = item.path.split("/").pop();
        if (!showExtension) {
          const dotIndex = fileName.lastIndexOf(".");
          return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
        }
        return fileName;
      });
      
      return JSON.stringify(result);
    }

    allFoldersInDirectory({directory}) {
      if (!this.currentRepoData || !this.currentRepoData.tree) {
        return "[]";
      }
      
      const dir = Cast.toString(directory);
      const resolvedPath = this.convertToFullDirectory({ directory: dir });
      const normalizedPath = resolvedPath === "/" ? "" : resolvedPath.replace(/^\//, "");
      
      const items = this.currentRepoData.tree.filter(item => {
        const itemPath = item.path;
        
        if (normalizedPath === "") {
          const parts = itemPath.split("/");
          return parts.length === 2 && itemPath.includes("/");
        }
        
        if (!itemPath.startsWith(normalizedPath + "/")) {
          return false;
        }
        
        const relativePath = itemPath.substring(normalizedPath.length + 1);
        const parts = relativePath.split("/");
        return parts.length === 2;
      });
      
      const folders = new Set();
      items.forEach(item => {
        const relativePath = normalizedPath === "" ? item.path : item.path.substring(normalizedPath.length + 1);
        const folderName = relativePath.split("/")[0];
        folders.add(folderName);
      });
      
      return JSON.stringify(Array.from(folders));
    }

    isDirectory({path}) {
      if (!this.currentRepoData || !this.currentRepoData.tree) {
        return false;
      }
      
      const dir = Cast.toString(path);
      const resolvedPath = this.convertToFullDirectory({ directory: dir });
      const normalizedPath = resolvedPath === "/" ? "" : resolvedPath.replace(/^\//, "");
      
      const dirInfo = this._getDirectoryInfo(normalizedPath);
      return !!dirInfo;
    }

    isDirectoryCommandValid({directory, content}) {
      if (!this.currentRepoData || !this.currentRepoData.tree) {
        return false;
      }
      
      const dir = Cast.toString(directory);
      const resolvedPath = this.convertToFullDirectory({ directory: dir });
      const normalizedPath = resolvedPath === "/" ? "" : resolvedPath.replace(/^\//, "");
      
      const contentType = Cast.toString(content);
      
      if (contentType === "file") {
        const fileInfo = this._getFileInfo(normalizedPath);
        return !!fileInfo;
      } else if (contentType === "folder") {
        const dirInfo = this._getDirectoryInfo(normalizedPath);
        return !!dirInfo;
      } else {
        const fileInfo = this._getFileInfo(normalizedPath);
        if (!fileInfo) return false;
        
        const fileName = fileInfo.name.toLowerCase();
        const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")).toLowerCase() : "";
        
        const mediaExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const audioExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma', '.aiff', '.au'];
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
        const musicExts = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma', '.aiff', '.au', '.mid', '.midi'];
        
        switch (contentType) {
          case "media":
            return mediaExts.includes(ext);
          case "audio":
            return audioExts.includes(ext);
          case "image":
            return imageExts.includes(ext);
          case "video":
            return videoExts.includes(ext);
          case "music":
            return musicExts.includes(ext);
          default:
            return false;
        }
      }
    }

    getAbsolutePath({relative}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const rel = Cast.toString(relative);
      return this.convertToFullDirectory({ directory: rel });
    }

    async readFile({filename, format}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const file = Cast.toString(filename);
      const resolvedPath = this._resolvePath(file);
      
      const fileInfo = this._getFileInfo(resolvedPath);
      if (!fileInfo) {
        return "";
      }
      
      const formatType = Cast.toString(format);
      
      if (formatType === "raw") {
        const content = await this._getFileContent(resolvedPath);
        return content || "";
      } else {
        const content = await this._getFileContent(resolvedPath);
        return content || "";
      }
    }

    fileNameWithoutExtension({filename}) {
      const str = Cast.toString(filename);
      const lastDotIndex = str.lastIndexOf(".");
      if (lastDotIndex === -1) return str;
      return str.substring(0, lastDotIndex);
    }

    fileExists({filename}) {
      if (!this.currentRepoData) {
        return false;
      }
      
      const file = Cast.toString(filename);
      const resolvedPath = this._resolvePath(file);
      
      const fileInfo = this._getFileInfo(resolvedPath);
      return !!fileInfo;
    }

    folderExists({foldername}) {
      if (!this.currentRepoData) {
        return false;
      }
      
      const folder = Cast.toString(foldername);
      const resolvedPath = this._resolvePath(folder);
      
      const dirInfo = this._getDirectoryInfo(resolvedPath);
      return !!dirInfo;
    }

    async countLines({filename}) {
      if (!this.currentRepoData) {
        return 0;
      }
      
      const file = Cast.toString(filename);
      const resolvedPath = this._resolvePath(file);
      
      const content = await this._getFileContent(resolvedPath);
      if (!content) {
        return 0;
      }
      
      if (content.trim() === "") {
        return 0;
      }
      
      const lines = content.split("\n");
      return lines.length;
    }

    async getFileLastUpdate({type, filepath}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const path = Cast.toString(filepath);
      const resolvedPath = this._resolvePath(path);
      
      const fileInfo = this._getFileInfo(resolvedPath);
      if (!fileInfo) {
        return "";
      }
      
      const cacheKey = `${this.currentRepo}:${resolvedPath}`;
      if (!this.fileCommitCache[cacheKey]) {
        const commits = await this._fetchFileCommits(this.currentRepo, resolvedPath);
        if (!commits || commits.length === 0) {
          return "";
        }
        this.fileCommitCache[cacheKey] = commits[0];
      }
      
      const commit = this.fileCommitCache[cacheKey];
      const date = new Date(commit.commit.author.date);
      
      const updateType = Cast.toString(type);
      switch (updateType) {
        case "date":
          return date.toLocaleDateString();
        case "time":
          return date.toLocaleTimeString();
        case "full":
          return date.toLocaleString();
        default:
          return "";
      }
    }

    async getFileCommitMessage({filepath}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const path = Cast.toString(filepath);
      const resolvedPath = this._resolvePath(path);
      
      const fileInfo = this._getFileInfo(resolvedPath);
      if (!fileInfo) {
        return "";
      }
      
      const cacheKey = `${this.currentRepo}:${resolvedPath}`;
      if (!this.fileCommitCache[cacheKey]) {
        const commits = await this._fetchFileCommits(this.currentRepo, resolvedPath);
        if (!commits || commits.length === 0) {
          return "";
        }
        this.fileCommitCache[cacheKey] = commits[0];
      }
      
      return this.fileCommitCache[cacheKey].commit.message || "";
    }

    async getFileCommitAuthor({filepath}) {
      if (!this.currentRepoData) {
        return "";
      }
      
      const path = Cast.toString(filepath);
      const resolvedPath = this._resolvePath(path);
      
      const fileInfo = this._getFileInfo(resolvedPath);
      if (!fileInfo) {
        return "";
      }
      
      const cacheKey = `${this.currentRepo}:${resolvedPath}`;
      if (!this.fileCommitCache[cacheKey]) {
        const commits = await this._fetchFileCommits(this.currentRepo, resolvedPath);
        if (!commits || commits.length === 0) {
          return "";
        }
        this.fileCommitCache[cacheKey] = commits[0];
      }
      
      return this.fileCommitCache[cacheKey].commit.author.name || "";
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
  }

  Scratch.extensions.register(new GitDataExtension());
})(Scratch);