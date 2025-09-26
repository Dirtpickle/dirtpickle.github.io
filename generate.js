const fs = require('fs');
const path = require('path');

// Simple configuration - all supported file types
const SUPPORTED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP', '.SVG',
    '.mp4', '.mov', '.avi', '.webm', '.MP4', '.MOV', '.AVI', '.WEBM',
    '.mp3', '.wav', '.ogg', '.m4a', '.MP3', '.WAV', '.OGG', '.M4A'
];

// Clean up titles
function formatTitle(filename) {
    return filename
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[-_]+/g, ' ')   // Replace dashes/underscores with spaces
        .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize
}

// Get media type from file extension
function getMediaType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
    if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) return 'video';
    if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) return 'audio';
    return 'unknown';
}

// Universal directory scanner - works for ANY directory
function scanDirectory(dir) {
    if (!fs.existsSync(dir)) return [];
    
    try {
        const items = [];
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                // Recursively scan subdirectories
                const subdirItems = scanDirectory(filePath);
                items.push(...subdirItems);
            } else {
                // Check if it's a supported file
                const ext = path.extname(file);
                if (SUPPORTED_EXTENSIONS.includes(ext)) {
                    const mediaType = getMediaType(file);
                    const relativePath = path.relative('.', filePath).replace(/\\/g, '/');
                    
                    items.push({
                        title: formatTitle(file),
                        filename: file,
                        path: relativePath,
                        type: mediaType,
                        category: path.basename(path.dirname(relativePath))
                    });
                }
            }
        }
        
        return items.sort((a, b) => a.title.localeCompare(b.title));
    } catch (error) {
        console.error(`Error scanning ${dir}:`, error.message);
        return [];
    }
}

// Universal page updater - works for ANY page
function updatePageData(htmlFile, dataArrayName, items) {
    if (!fs.existsSync(htmlFile)) {
        console.log(`⚠ ${htmlFile} doesn't exist, skipping...`);
        return;
    }
    
    try {
        let content = fs.readFileSync(htmlFile, 'utf8');
        
        // Transform items to match expected format
        const transformedItems = items.map(item => {
            if (item.type === 'audio') {
                return {
                    title: item.title,
                    src: item.path
                };
            } else if (item.type === 'video') {
                return {
                    title: item.title,
                    video: item.path,
                    type: 'video',
                    category: item.category
                };
            } else {
                return {
                    title: item.title,
                    image: item.path,
                    type: 'image',
                    category: item.category
                };
            }
        });
        
        // Find and replace the data array
        const arrayPattern = new RegExp(`const ${dataArrayName}\\s*=\\s*\\[[\\s\\S]*?\\];`);
        const newArrayString = `const ${dataArrayName} = ${JSON.stringify(transformedItems, null, 4)};`;
        
        if (arrayPattern.test(content)) {
            content = content.replace(arrayPattern, newArrayString);
            fs.writeFileSync(htmlFile, content);
            console.log(`✅ Updated ${htmlFile} with ${items.length} items`);
        } else {
            console.log(`⚠ Could not find ${dataArrayName} array in ${htmlFile}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${htmlFile}:`, error.message);
    }
}

// Main execution - simple and universal
function generateAll() {
    console.log('🚀 Universal Gallery Generator - Scanning all media...\n');
    
    // Define all the pages and what they should contain
    const pages = [
        { file: 'index.html', dataName: 'featuredData', filter: item => item.filename.includes('-f') },
        { file: 'character-design.html', dataName: 'galleryData', filter: item => item.category === 'character-design' },
        { file: 'game-art.html', dataName: 'galleryData', filter: item => item.category === 'game-art' || item.category === 'props' || item.category === 'ui' },
        { file: 'illustration.html', dataName: 'galleryData', filter: item => item.category === 'illustration' },
        { file: 'tattoo.html', dataName: 'galleryData', filter: item => item.category === 'tattoo' },
        { file: '3d.html', dataName: 'threeDData', filter: item => item.category === '3d' },
        { file: 'video.html', dataName: 'galleryData', filter: item => item.type === 'video' },
        { file: 'audio.html', dataName: 'musicData', filter: item => item.type === 'audio' }
    ];
    
    // Scan all directories once
    const allItems = [
        ...scanDirectory('./images'),
        ...scanDirectory('./video'),
        ...scanDirectory('./music'),
        ...scanDirectory('./3d')
    ];
    
    console.log(`📁 Found ${allItems.length} total media items\n`);
    
    // Update each page with its filtered content
    pages.forEach(page => {
        const items = allItems.filter(page.filter);
        updatePageData(page.file, page.dataName, items);
    });
    
    console.log('\n✅ All pages updated successfully!');
    console.log('\n📋 Summary:');
    console.log('• Just add any media file to any folder');
    console.log('• Run "node generate.js"');
    console.log('• That\'s it - everything updates automatically!');
}

// Export for testing
module.exports = { generateAll, scanDirectory };

// Run if called directly
if (require.main === module) {
    generateAll();
}
