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
        // Remove tag suffixes before formatting
        .replace(/-f$|_f$/, '') // Remove featured tags
        .replace(/-professional$|_professional$/, '') // Remove professional tags
        .replace(/-client$|_client$/, '') // Remove client tags
        .replace(/-personal$|_personal$/, '') // Remove personal tags
        .replace(/-concept$|_concept$/, '') // Remove concept tags
        .replace(/-commission$|_commission$/, '') // Remove commission tags
        .replace(/-portfolio$|_portfolio$/, '') // Remove portfolio tags
        .replace(/-study$|_study$/, '') // Remove study tags
        .replace(/-wip$|_wip$/, '') // Remove wip tags
        .replace(/-demo$|_demo$/, '') // Remove demo tags
        .replace(/[-_]+/g, ' ')   // Replace remaining dashes/underscores with spaces
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

// Get work type based on filename tags (similar to -f for featured)
function getWorkType(filename) {
    const lower = filename.toLowerCase();
    
    // Check for specific tags in filename
    if (lower.includes('-professional') || lower.includes('_professional')) return 'Professional';
    if (lower.includes('-client') || lower.includes('_client')) return 'Client Work';
    if (lower.includes('-personal') || lower.includes('_personal')) return 'Personal Project';
    if (lower.includes('-concept') || lower.includes('_concept')) return 'Concept Art';
    if (lower.includes('-commission') || lower.includes('_commission')) return 'Commission';
    if (lower.includes('-portfolio') || lower.includes('_portfolio')) return 'Portfolio Piece';
    if (lower.includes('-study') || lower.includes('_study')) return 'Study';
    if (lower.includes('-wip') || lower.includes('_wip')) return 'Work in Progress';
    if (lower.includes('-demo') || lower.includes('_demo')) return 'Demo';
    
    return 'Creative Work'; // Default
}

// Check if a thumbnail exists for a given file
function findThumbnail(originalPath) {
    const parsedPath = path.parse(originalPath);
    const category = path.basename(path.dirname(originalPath));
    
    // Common image extensions for thumbnails
    const thumbExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    // Try different thumbnail naming patterns
    const patterns = [
        parsedPath.name, // Exact match
        parsedPath.name + '_thumb', // With _thumb suffix
        parsedPath.name + '-thumb', // With -thumb suffix
        parsedPath.name.replace(/\s+/g, '_'), // Spaces as underscores
        parsedPath.name.replace(/\s+/g, '_') + '_thumb' // Spaces as underscores + thumb
    ];
    
    for (const pattern of patterns) {
        for (const ext of thumbExtensions) {
            const thumbPath = `thumbnails/${category}/${pattern}${ext}`;
            if (fs.existsSync(thumbPath)) {
                return thumbPath;
            }
        }
    }
    
    return null; // No thumbnail found
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
                    const thumbnailPath = findThumbnail(relativePath);
                    
                    items.push({
                        title: formatTitle(file),
                        filename: file,
                        path: relativePath,
                        thumbnail: thumbnailPath, // Add thumbnail if available
                        type: mediaType,
                        category: path.basename(path.dirname(relativePath)),
                        workType: getWorkType(file)
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
                    src: item.path,
                    workType: item.workType
                };
            } else if (item.type === 'video') {
                return {
                    title: item.title,
                    video: item.path,
                    thumbnail: item.thumbnail, // Use thumbnail for video preview
                    type: 'video',
                    category: item.category,
                    workType: item.workType
                };
            } else {
                return {
                    title: item.title,
                    image: item.thumbnail || item.path, // Use thumbnail if available, fallback to original
                    fullImage: item.path, // Keep original path for full view
                    type: 'image',
                    category: item.category,
                    workType: item.workType
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
    
    // Scan all directories once (excluding thumbnails - they're for display only)
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
