const fs = require('fs');
const path = require('path');

// Simple configuration - all supported file types
const SUPPORTED_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
    '.JPG', '.JPEG', '.PNG', '.GIF', '.WEBP', '.SVG',
    '.mp4', '.mov', '.avi', '.webm', '.MP4', '.MOV', '.AVI', '.WEBM',
    '.mp3', '.wav', '.ogg', '.m4a', '.MP3', '.WAV', '.OGG', '.M4A'
];

// SEO-optimized descriptions based on categories and keywords
const SEO_DESCRIPTIONS = {
    'character-design': {
        default: 'Original character design showcasing creative digital artistry',
        keywords: ['character concept', 'digital character art', 'game character design', 'fantasy character', 'character illustration']
    },
    'game-art': {
        default: 'Professional game art asset designed for interactive entertainment',
        keywords: ['game asset', 'game graphics', 'video game art', 'game design element', 'interactive media art']
    },
    'illustration': {
        default: 'Digital illustration showcasing artistic creativity and technical skill',
        keywords: ['digital artwork', 'creative illustration', 'artistic design', 'digital painting', 'conceptual art']
    },
    'tattoo': {
        default: 'Custom tattoo design combining artistic vision with body art aesthetics',
        keywords: ['tattoo artwork', 'body art design', 'ink design', 'tattoo illustration', 'custom tattoo art']
    },
    '3d': {
        default: '3D artwork demonstrating dimensional modeling and digital sculpting skills',
        keywords: ['3D modeling', '3D art', 'digital sculpture', '3D design', 'dimensional artwork']
    },
    'video': {
        default: 'Creative video content showcasing motion graphics and visual storytelling',
        keywords: ['motion graphics', 'video art', 'digital animation', 'visual effects', 'creative video']
    },
    'audio': {
        default: 'Original audio composition demonstrating musical creativity and production skills',
        keywords: ['original music', 'audio composition', 'sound design', 'musical creation', 'digital audio']
    }
};

// Extract explicit tags from filename - tags are always -tag or _tag format
function extractTags(filename) {
    const tags = [];
    
    // Remove file extension first
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Look for patterns like -tag or _tag (no spaces)
    const tagPattern = /[-_]([a-zA-Z0-9]+)/g;
    let match;
    
    while ((match = tagPattern.exec(nameWithoutExt)) !== null) {
        const tag = match[1].toLowerCase().trim();
        if (tag && tag !== 'f') { // Exclude featured flag
            tags.push(tag);
        }
    }
    
    return tags;
}

// Video-specific genre detection - ONLY from explicit tags
function getVideoGenre(filename, category, tags) {
    // Check explicit tags first
    for (const tag of tags) {
        if (tag === 'trailer' || tag === 'game-trailer') return 'Game Trailer';
        if (tag === 'promo' || tag === 'promotional' || tag === 'promotional-video') return 'Promotional Video';
        if (tag === 'ad' || tag === 'advertisement' || tag === 'advert') return 'Advertisement';
        if (tag === 'motion-graphics' || tag === 'motion') return 'Motion Graphics';
        if (tag === 'tutorial') return 'Tutorial';
        if (tag === 'demo' || tag === 'gameplay') return 'Gameplay Demo';
    }
    
    // If no explicit tags, use folder-based defaults
    if (category === '3d') return '3D Animation';
    
    return 'Creative Video'; // Default
}

// 3D-specific technique detection - ONLY from explicit tags
function get3DTechnique(filename, category, tags) {
    // Check explicit tags first
    for (const tag of tags) {
        if (tag === 'sculpt' || tag === 'sculpting' || tag === 'zbrush') return 'Digital Sculpting';
        if (tag === 'architecture' || tag === 'architectural') return 'Architectural Visualization';
        if (tag === 'character' || tag === 'character-modeling') return 'Character Modeling';
        if (tag === 'environment' || tag === 'landscape') return 'Environment Art';
        if (tag === 'product' || tag === 'industrial') return 'Product Visualization';
        if (tag === 'animation' || tag === 'rigging') return '3D Animation';
        if (tag === 'render' || tag === 'rendering' || tag === 'lighting') return '3D Rendering';
        if (tag === 'texture' || tag === 'texturing' || tag === 'material') return 'Texturing & Materials';
    }
    
    return '3D Modeling'; // Default for 3D category
}

// 3D software detection - ONLY from explicit tags
function detect3DSoftware(filename, tags) {
    // Check explicit tags first
    for (const tag of tags) {
        if (tag === 'blender') return 'Blender';
        if (tag === 'maya') return 'Autodesk Maya';
        if (tag === 'max' || tag === '3dsmax') return '3ds Max';
        if (tag === 'cinema4d' || tag === 'c4d') return 'Cinema 4D';
        if (tag === 'zbrush') return 'ZBrush';
        if (tag === 'substance') return 'Substance Suite';
        if (tag === 'houdini') return 'Houdini';
        if (tag === 'unreal') return 'Unreal Engine';
        if (tag === 'unity') return 'Unity 3D';
    }
    
    // Check filename only for software names (common exception)
    const title = filename.toLowerCase();
    if (title.includes('blender')) return 'Blender';
    if (title.includes('maya')) return 'Autodesk Maya';
    if (title.includes('zbrush')) return 'ZBrush';
    
    return 'Professional 3D Software'; // Default
}

// Estimate video duration based on explicit tags or reasonable defaults
function estimateVideoDuration(filename, tags) {
    // Check explicit tags first
    for (const tag of tags) {
        if (tag === 'trailer') return 'PT1M45S'; // ~1:45
        if (tag === 'promo' || tag === 'promotional') return 'PT2M30S'; // ~2:30
        if (tag === 'ad' || tag === 'advertisement') return 'PT1M15S'; // ~1:15
        if (tag === 'motion-graphics') return 'PT45S'; // ~45s
        if (tag === 'tutorial') return 'PT5M'; // ~5:00
    }
    
    return 'PT2M'; // Default 2 minutes
}

// Clean up titles - remove all -tag and _tag portions
function formatTitle(filename) {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    
    // Remove all -tag and _tag patterns to get clean title
    const cleanTitle = nameWithoutExt.replace(/[-_][a-zA-Z0-9]+/g, '');
    
    return cleanTitle
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim() // Remove leading/trailing spaces
        .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize
}

// Generate SEO-optimized description
function generateDescription(filename, category, tags) {
    const title = formatTitle(filename);
    const categoryData = SEO_DESCRIPTIONS[category] || SEO_DESCRIPTIONS['illustration'];
    
    // Check for explicit content tags to create specific descriptions
    for (const tag of tags) {
        if (tag === 'trailer') {
            return `${title} - official game trailer featuring cinematic gameplay footage, story elements, and release information`;
        }
        if (tag === 'promo' || tag === 'promotional') {
            return `${title} - high-energy promotional video showcasing gameplay mechanics, visual style, and key features`;
        }
        if (tag === 'ad' || tag === 'advertisement') {
            return `${title} - professional advertisement featuring dynamic action sequences and visual showcases`;
        }
        if (tag === 'motion-graphics') {
            return `${title} - animated motion graphics piece featuring character design, typography, and brand identity elements`;
        }
        if (tag === 'sculpt' || tag === 'sculpting') {
            return `${title} - time-lapse 3D sculpting process demonstrating organic modeling and texturing techniques`;
        }
        if (tag === 'architecture' || tag === 'architectural') {
            return `${title} - professional 3D visualization featuring architectural design, lighting, and cinematic presentation`;
        }
    }
    
    // Default description with title
    return `${title} - ${categoryData.default}`;
}

// Get media type from file extension
function getMediaType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
    if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) return 'video';
    if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) return 'audio';
    return 'unknown';
}

// Get work type based on explicit filename tags ONLY
function getWorkType(filename, tags) {
    // Check explicit tags first - ONLY work-related tags, not content-type tags
    for (const tag of tags) {
        if (tag === 'professional') return 'Professional';
        if (tag === 'client') return 'Client Work';
        if (tag === 'personal') return 'Personal Project';
        if (tag === 'concept') return 'Concept Art';
        if (tag === 'commission') return 'Commission';
        if (tag === 'portfolio') return 'Portfolio Piece';
        if (tag === 'study') return 'Study';
        if (tag === 'wip') return 'Work in Progress';
        if (tag === 'demo') return 'Demo';
        // Removed 'advert' and 'advertisement' - these are content types, not work types
    }
    
    return 'Creative Work'; // Default
}

// Check if content is NSFW
function isNSFW(filename, tags) {
    return tags.includes('nsfw');
}

// Check if a thumbnail exists for a given file
function findThumbnail(originalPath) {
    const parsedPath = path.parse(originalPath);
    const relativePath = path.relative('.', originalPath);
    const pathParts = relativePath.split(path.sep);
    
    // Handle different folder structures
    let thumbnailDir;
    if (pathParts[0] === 'images' && pathParts.length > 2) {
        // For images/category/file.ext -> thumbnails/images/category/
        thumbnailDir = `thumbnails/${pathParts[0]}/${pathParts[1]}`;
    } else if (pathParts.length > 1) {
        // For category/file.ext -> thumbnails/category/
        thumbnailDir = `thumbnails/${pathParts[0]}`;
    } else {
        // For file.ext -> thumbnails/
        thumbnailDir = 'thumbnails';
    }
    
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
            const thumbPath = `${thumbnailDir}/${pattern}${ext}`;
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
                    const category = path.basename(path.dirname(relativePath));
                    const tags = extractTags(file);
                    
                    items.push({
                        title: formatTitle(file),
                        filename: file,
                        path: relativePath,
                        thumbnail: thumbnailPath,
                        type: mediaType,
                        category: category,
                        workType: getWorkType(file, tags),
                        description: generateDescription(file, category, tags),
                        nsfw: isNSFW(file, tags),
                        tags: tags, // Store extracted tags for debugging
                        ...(mediaType === 'video' && {
                            genre: getVideoGenre(file, category, tags),
                            duration: estimateVideoDuration(file, tags)
                        }),
                        ...(category === '3d' && {
                            technique: get3DTechnique(file, category, tags),
                            software: detect3DSoftware(file, tags)
                        })
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
        console.log(`⚠️ ${htmlFile} doesn't exist, skipping...`);
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
                    workType: item.workType,
                    description: item.description,
                    nsfw: item.nsfw
                };
            } else if (item.type === 'video') {
                return {
                    title: item.title,
                    video: item.path,
                    thumbnail: item.thumbnail,
                    type: 'video',
                    category: item.category,
                    workType: item.workType,
                    description: item.description,
                    genre: item.genre || 'Creative Video',
                    duration: item.duration || 'PT2M',
                    nsfw: item.nsfw,
                    ...(item.technique && { technique: item.technique }),
                    ...(item.software && { software: item.software })
                };
            } else {
                return {
                    title: item.title,
                    image: item.thumbnail || item.path,
                    fullImage: item.path,
                    type: 'image',
                    category: item.category,
                    workType: item.workType,
                    description: item.description,
                    nsfw: item.nsfw
                };
            }
        });
        
        // Special case for audio.html: update both this.tracks and the visible playlist
        if (htmlFile === 'audio.html' && dataArrayName === 'musicData') {
            // Update the JS tracks array
            const tracksPattern = /this\.tracks\s*=\s*\[[^\]]*\]/s;
            const newTracksString = `this.tracks = ${JSON.stringify(transformedItems, null, 20)}`;
            if (tracksPattern.test(content)) {
                content = content.replace(tracksPattern, newTracksString);
            }

            // Update the visible playlist (replace only the inner HTML of the track-list div)
            const trackListStart = '<!-- TRACK_LIST_START -->';
            const trackListEnd = '<!-- TRACK_LIST_END -->';
            const startIdx = content.indexOf(trackListStart);
            const endIdx = content.indexOf(trackListEnd);
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                let playlistHTML = '';
                transformedItems.forEach((track, i) => {
                    playlistHTML += `    <div class=\"track-item${i === 0 ? ' active' : ''}\" data-track=\"${i}\">`;
                    playlistHTML += `\n        <span class=\"track-number\">${String(i+1).padStart(2, '0')}</span>`;
                    playlistHTML += `\n        <span class=\"track-title\">${track.title}</span>`;
                    playlistHTML += `\n        <span class=\"track-duration\">--:--</span>`;
                    playlistHTML += `\n    </div>\n`;
                });
                // Replace only the content between the markers
                content = content.slice(0, startIdx + trackListStart.length) + '\n' + playlistHTML + content.slice(endIdx);
            }

            fs.writeFileSync(htmlFile, content);
            console.log(`✅ Updated ${htmlFile} with ${items.length} items (tag-based categories & playlist)`);
            return;
        }
        
        // Find and replace the data array (standard pattern)
        const arrayPattern = new RegExp(`const ${dataArrayName}\\s*=\\s*\\[[\\s\\S]*?\\];`);
        const newArrayString = `const ${dataArrayName} = ${JSON.stringify(transformedItems, null, 4)};`;
        
        if (arrayPattern.test(content)) {
            content = content.replace(arrayPattern, newArrayString);
            fs.writeFileSync(htmlFile, content);
            console.log(`✅ Updated ${htmlFile} with ${items.length} items (tag-based categories)`);
        } else {
            console.log(`⚠️ Could not find ${dataArrayName} array in ${htmlFile}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${htmlFile}:`, error.message);
    }
}

// Generate sitemap.xml for better SEO
function generateSitemap() {
    const baseUrl = 'https://dirtpickle.com';
    const pages = [
        { url: '/', priority: '1.0', changefreq: 'monthly' },
        { url: '/art.html', priority: '0.9', changefreq: 'monthly' },
        { url: '/game-development.html', priority: '0.9', changefreq: 'monthly' },
        { url: '/3d.html', priority: '0.8', changefreq: 'monthly' },
        { url: '/video.html', priority: '0.8', changefreq: 'monthly' },
        { url: '/audio.html', priority: '0.8', changefreq: 'monthly' },
        { url: '/contact.html', priority: '0.7', changefreq: 'yearly' }
    ];
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
    
    pages.forEach(page => {
        sitemap += `
    <url>
        <loc>${baseUrl}${page.url}</loc>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
    });
    
    sitemap += `
</urlset>`;
    
    fs.writeFileSync('sitemap.xml', sitemap);
    console.log('📄 Generated sitemap.xml for SEO');
}

// Generate robots.txt
function generateRobotsTxt() {
    const robotsTxt = `User-agent: *
Allow: /

# Sitemap location
Sitemap: https://dirtpickle.com/sitemap.xml

# Optimize crawling
Crawl-delay: 1`;
    
    fs.writeFileSync('robots.txt', robotsTxt);
    console.log('🤖 Generated robots.txt for search engines');
}

// Main execution
function generateAll() {
    console.log('🚀 Tag-Based Gallery Generator - Scanning all media...\n');
    
    // Define all the pages and what they should contain
    const pages = [
        { file: 'index.html', dataName: 'featuredData', filter: item => item.filename.includes('-f') },
        { file: 'art.html', dataName: 'characterData', filter: item => item.category === 'character-design' },
        { file: 'art.html', dataName: 'illustrationData', filter: item => item.category === 'illustration' },
        { file: 'art.html', dataName: 'gameArtData', filter: item => item.category === 'game-art' || item.category === 'props' || item.category === 'ui' },
        { file: 'art.html', dataName: 'tattooData', filter: item => item.category === 'tattoo' },
        { file: '3d.html', dataName: 'threeDData', filter: item => item.category === '3d' },
        { file: 'video.html', dataName: 'galleryData', filter: item => item.type === 'video' && (item.path.startsWith('video/') || item.category === 'video') },
        { file: 'audio.html', dataName: 'musicData', filter: item => item.type === 'audio' }
    ];
    
    // Scan all directories once - FIXED: Changed './music' to './audio'
    const allItems = [
        ...scanDirectory('./images'),
        ...scanDirectory('./video'),
        ...scanDirectory('./audio'), // ← FIXED: Now scans the correct directory!
        ...scanDirectory('./3d')
    ];
    
    console.log(`🔍 Found ${allItems.length} total media items\n`);
    
    // Update each page with its filtered content
    pages.forEach(page => {
        const items = allItems.filter(page.filter);
        updatePageData(page.file, page.dataName, items);
    });
    
    // Generate SEO files
    generateSitemap();
    generateRobotsTxt();
    
    console.log('\n✅ All pages updated successfully with tag-based categorization!');
    console.log('\n📋 Tag System:');
    console.log('• Categories come from folder structure only');
    console.log('• Content types come from explicit tags like -trailer, -promo, etc.');
    console.log('• Work types come from tags like -professional, -client, etc.');
    console.log('• No inference from filename content');
}

// Export for testing
module.exports = { generateAll, scanDirectory };

// Run if called directly
if (require.main === module) {
    generateAll();
}