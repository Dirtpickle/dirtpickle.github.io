const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const simpleGit = require('simple-git');
const { spawn } = require('child_process');

let mainWindow;
let appSettings = {
  portfolioFolder: '',
  categories: {},
  gitConfig: {
    username: '',
    repo: '',
    token: ''
  }
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('select-portfolio-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Portfolio Folder'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    appSettings.portfolioFolder = result.filePaths[0];
    await saveSettings();
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-folder', async (event, title = 'Select Folder') => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Media Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'mp3', 'wav', 'ogg'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    title: 'Select Media Files'
  });

  if (!result.canceled) {
    return result.filePaths;
  }
  return [];
});

ipcMain.handle('get-settings', () => {
  return appSettings;
});

ipcMain.handle('save-settings', async (event, settings) => {
  appSettings = { ...appSettings, ...settings };
  await saveSettings();
  return appSettings;
});

ipcMain.handle('scan-portfolio-folder', async () => {
  if (!appSettings.portfolioFolder) return [];

  try {
    const files = await scanDirectoryForMedia(appSettings.portfolioFolder);
    return files;
  } catch (error) {
    console.error('Error scanning portfolio folder:', error);
    return [];
  }
});

ipcMain.handle('process-files', async (event, filesData) => {
  try {
    const results = [];

    for (const fileData of filesData) {
      const result = await processFile(fileData);
      results.push(result);

      // Send progress update
      mainWindow.webContents.send('file-processed', {
        file: fileData.originalPath,
        success: result.success,
        error: result.error
      });
    }

    return results;
  } catch (error) {
    console.error('Error processing files:', error);
    throw error;
  }
});

ipcMain.handle('generate-thumbnails', async (event, files) => {
  try {
    const results = [];

    for (const file of files) {
      if (isImageFile(file.path)) {
        const result = await generateThumbnail(file.path, file.category);
        results.push(result);

        mainWindow.webContents.send('thumbnail-generated', {
          file: file.path,
          thumbnail: result.thumbnailPath,
          success: result.success
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error generating thumbnails:', error);
    throw error;
  }
});

ipcMain.handle('run-generate-script', async () => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'generate.js');

    if (!fs.existsSync(scriptPath)) {
      reject(new Error('generate.js script not found'));
      return;
    }

    const child = spawn('node', [scriptPath], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      mainWindow.webContents.send('script-output', data.toString());
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      mainWindow.webContents.send('script-error', data.toString());
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject(new Error(`Script exited with code ${code}: ${errorOutput}`));
      }
    });
  });
});

ipcMain.handle('git-commit-and-push', async (event, message) => {
  try {
    if (!appSettings.portfolioFolder) {
      throw new Error('Portfolio folder not set');
    }

    const git = simpleGit(appSettings.portfolioFolder);

    // Add all changes
    await git.add('.');

    // Commit
    await git.commit(message || 'Auto-commit: Portfolio content updated');

    // Push if git config is set
    if (appSettings.gitConfig.username && appSettings.gitConfig.repo && appSettings.gitConfig.token) {
      const remoteUrl = `https://${appSettings.gitConfig.token}@github.com/${appSettings.gitConfig.username}/${appSettings.gitConfig.repo}.git`;
      await git.push('origin', 'main');
    }

    return { success: true };
  } catch (error) {
    console.error('Git operation failed:', error);
    throw error;
  }
});

// Helper functions
async function saveSettings() {
  const settingsPath = path.join(__dirname, 'settings.json');
  await fs.writeJson(settingsPath, appSettings, { spaces: 2 });
}

async function loadSettings() {
  const settingsPath = path.join(__dirname, 'settings.json');
  try {
    if (await fs.pathExists(settingsPath)) {
      appSettings = await fs.readJson(settingsPath);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function scanDirectoryForMedia(dir) {
  const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.avi', '.mp3', '.wav', '.ogg'];
  const files = [];

  async function scanDir(currentDir) {
    const items = await fs.readdir(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        await scanDir(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (mediaExtensions.includes(ext)) {
          files.push({
            path: fullPath,
            name: item,
            size: stat.size,
            modified: stat.mtime,
            category: getCategoryFromPath(fullPath)
          });
        }
      }
    }
  }

  await scanDir(dir);
  return files;
}

function getCategoryFromPath(filePath) {
  const relativePath = path.relative(appSettings.portfolioFolder, filePath);
  const parts = relativePath.split(path.sep);

  // Find category based on folder mapping
  for (const [category, folderPath] of Object.entries(appSettings.categories)) {
    if (filePath.includes(folderPath)) {
      return category;
    }
  }

  // Default category based on first folder
  return parts[0] || 'uncategorized';
}

async function processFile(fileData) {
  try {
    const { originalPath, targetCategory, workType, featured, nsfw } = fileData;

    // Generate new filename
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);

    let newName = baseName;
    if (workType) newName += `-${workType}`;
    if (featured) newName += '-f';
    if (nsfw) newName += '-nsfw';
    newName += ext;

    // Get target folder
    const targetFolder = appSettings.categories[targetCategory];
    if (!targetFolder) {
      throw new Error(`Category ${targetCategory} not mapped to a folder`);
    }

    // Ensure target folder exists
    await fs.ensureDir(targetFolder);

    // Move file
    const targetPath = path.join(targetFolder, newName);
    await fs.move(originalPath, targetPath);

    return {
      success: true,
      originalPath,
      newPath: targetPath,
      newName
    };
  } catch (error) {
    return {
      success: false,
      originalPath: fileData.originalPath,
      error: error.message
    };
  }
}

async function generateThumbnail(imagePath, category) {
  try {
    const categoryFolder = appSettings.categories[category];
    if (!categoryFolder) {
      throw new Error(`Category ${category} not found`);
    }

    const thumbnailsFolder = path.join(categoryFolder, 'thumbnails');
    await fs.ensureDir(thumbnailsFolder);

    const fileName = path.basename(imagePath, path.extname(imagePath));
    const thumbnailPath = path.join(thumbnailsFolder, `${fileName}_thumb.jpg`);

    await sharp(imagePath)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath);

    return {
      success: true,
      originalPath: imagePath,
      thumbnailPath
    };
  } catch (error) {
    return {
      success: false,
      originalPath: imagePath,
      error: error.message
    };
  }
}

function isImageFile(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return imageExtensions.includes(path.extname(filePath).toLowerCase());
}

app.whenReady().then(async () => {
  await loadSettings();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});