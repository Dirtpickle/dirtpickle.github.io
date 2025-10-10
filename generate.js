const fs = require('fs');
const path = require('path');

// Path to the JSON database created by the CMS
const DATABASE_PATH = './content-database.json';

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

// Video-specific genre detection - from JSON tags
function getVideoGenre(category, tags) {
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

// 3D-specific technique detection - from JSON tags
function get3DTechnique(tags) {
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

// 3D software detection - from JSON tags
function detect3DSoftware(tags) {
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

    return 'Professional 3D Software'; // Default
}

// Estimate video duration based on explicit tags or reasonable defaults
function estimateVideoDuration(tags) {
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

// Generate SEO-optimized description
function generateDescription(title, category, tags) {
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

// Load content from JSON database
function loadContentDatabase() {
    if (!fs.existsSync(DATABASE_PATH)) {
        console.log(`⚠️ Database not found at ${DATABASE_PATH}`);
        console.log('📝 Please use the Content Manager app to create and manage your content.');
        return { content: [], tags: [], categories: [], workTypes: [] };
    }

    try {
        const data = fs.readFileSync(DATABASE_PATH, 'utf8');
        const database = JSON.parse(data);
        console.log(`✅ Loaded ${database.content.length} items from database`);
        return database;
    } catch (error) {
        console.error(`❌ Error loading database: ${error.message}`);
        return { content: [], tags: [], categories: [], workTypes: [] };
    }
}

// Transform CMS database item to website format
function transformItem(item) {
    const tags = item.tags || [];
    const category = item.category || 'uncategorized';

    // Add cache buster based on file modification time or database timestamp
    const cacheBuster = `?v=${Date.now()}`;

    // Base transformation
    const transformed = {
        title: item.title,
        type: item.type,
        category: category,
        workType: item.workType || 'Creative Work',
        description: generateDescription(item.title, category, tags),
        tags: tags,
        nsfw: item.nsfw || false,
        featured: item.featured || false
    };

    // Type-specific transformations
    if (item.type === 'audio') {
        return {
            ...transformed,
            src: item.path
        };
    } else if (item.type === 'video') {
        return {
            ...transformed,
            video: item.path,
            thumbnail: (item.thumbnail || item.path) + cacheBuster,
            genre: getVideoGenre(category, tags),
            duration: estimateVideoDuration(tags),
            ...(category === '3d' && {
                technique: get3DTechnique(tags),
                software: detect3DSoftware(tags)
            })
        };
    } else {
        // Image
        const hasFrames = item.frames && item.frames.length > 0;
        if (hasFrames) {
            // Normalize frame paths to include cache buster and ensure ordering.
            const normalizedFrames = item.frames.map(f => f + cacheBuster);
            return {
                ...transformed,
                image: (item.thumbnail || item.path) + cacheBuster,
                frames: normalizedFrames,
                // Use the first frame as the main fullImage so the lightbox opens on an expected image
                fullImage: normalizedFrames[0]
            };
        } else {
            return {
                ...transformed,
                image: (item.thumbnail || item.path) + cacheBuster,
                fullImage: item.path + cacheBuster
            };
        }
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
        const transformedItems = items.map(transformItem);

        // Special case for audio.html: update only this.tracks (remove playlist update)
        if (htmlFile === 'audio.html' && dataArrayName === 'musicData') {
            // Find the start of this.tracks assignment
            const tracksStart = content.indexOf('this.tracks = [');
            
            if (tracksStart !== -1) {
                // Find the end by looking for the next property assignment (this.audio)
                const nextProperty = content.indexOf('this.audio', tracksStart);
                
                if (nextProperty !== -1) {
                    // Extract everything before tracks assignment and after next property
                    const beforeTracks = content.slice(0, tracksStart);
                    const afterTracks = content.slice(nextProperty);
                    
                    // Create clean tracks assignment
                    const newTracksString = `this.tracks = ${JSON.stringify(transformedItems, null, 16)};
                
                `;
                    
                    // Rebuild the file
                    content = beforeTracks + newTracksString + afterTracks;
                    fs.writeFileSync(htmlFile, content);
                    console.log(`✅ Fixed audio data corruption (robust method) in ${htmlFile} with ${items.length} items`);
                    return;
                }
            }
            
            console.log(`⚠️ Could not find or fix this.tracks array in ${htmlFile}`);
            console.log(`   File may need manual repair`);
            return;
        }

        // Find and replace the data array (standard pattern)
        const arrayPattern = new RegExp(`const ${dataArrayName}\\s*=\\s*\\[[\\s\\S]*?\\];`);
        const newArrayString = `const ${dataArrayName} = ${JSON.stringify(transformedItems, null, 4)};`;

        if (arrayPattern.test(content)) {
            content = content.replace(arrayPattern, newArrayString);
            fs.writeFileSync(htmlFile, content);
            console.log(`✅ Updated ${htmlFile} with ${items.length} items (JSON database)`);
        } else {
            console.log(`⚠️ Could not find ${dataArrayName} array in ${htmlFile}`);
            console.log(`   Looking for pattern: const ${dataArrayName} = [`);
            
            // Try to find what data arrays do exist in the file
            const existingArrays = content.match(/const \w+Data\s*=\s*\[/g);
            if (existingArrays) {
                console.log(`   Found these data arrays: ${existingArrays.join(', ')}`);
            }
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

function generateGameDevelopmentPage() {
    const gamesDir = './games';
    let games = [];

    // Load database to check for embed entries
    const database = loadContentDatabase();
    const embedEntries = database.content.filter(item => item.type === 'embed' && item.category === 'game-development');

    // Check if games directory exists and read games
    if (fs.existsSync(gamesDir)) {
        const gameFiles = fs.readdirSync(gamesDir).filter(file => file.endsWith('.json'));

        if (gameFiles.length > 0) {
            // Only include games that exist in both the database and games folder
            games = gameFiles
                .map(file => {
                    const gameData = JSON.parse(fs.readFileSync(`${gamesDir}/${file}`, 'utf8'));
                    const gamePath = `games/${file}`;

                    // Find the game in database to get thumbnail and verify it exists
                    const dbEntry = embedEntries.find(item => item.path === gamePath);
                    
                    // Only include if it exists in database (not orphaned)
                    if (!dbEntry) {
                        console.log(`⚠️ Game file ${file} found but not in database - skipping`);
                        return null;
                    }

                    return {
                        ...gameData,
                        thumbnail: dbEntry.thumbnail || null,
                        thumbnailOffsetX: dbEntry.thumbnailOffsetX || 0,
                        thumbnailOffsetY: dbEntry.thumbnailOffsetY || 0,
                        description: gameData.description || 'Click to play on itch.io'
                    };
                })
                .filter(game => game !== null); // Remove nulls (orphaned files)
        }
    }

    // Check for database entries without corresponding game files
    const orphanedEntries = embedEntries.filter(entry => {
        const filename = path.basename(entry.path);
        return !fs.existsSync(path.join(gamesDir, filename));
    });

    if (orphanedEntries.length > 0) {
        console.log(`⚠️ Found ${orphanedEntries.length} embed(s) in database without game files:`);
        orphanedEntries.forEach(entry => console.log(`   - ${entry.title} (${entry.path})`));
    }

    // Update existing game-development.html instead of overwriting it
    const htmlFile = './game-development.html';
    if (!fs.existsSync(htmlFile)) {
        console.log(`⚠️ ${htmlFile} doesn't exist, skipping...`);
        return;
    }

    try {
        let content = fs.readFileSync(htmlFile, 'utf8');

        // Generate HTML for each game
        const gamesHTML = games.map((game, index) => `                    <div class="game-container">
                        <div id="game-preview-${index}" class="game-preview">
                            <div class="game-thumbnail">
                                <img src="${game.thumbnail || 'images/placeholder.png'}" alt="${game.title}" class="game-thumbnail-img" style="transform: translate(${game.thumbnailOffsetX}px, ${game.thumbnailOffsetY}px);">
                                <div class="game-play-overlay" data-game-index="${index}">
                                    <div class="game-play-icon"></div>
                                </div>
                                <div class="game-title-overlay">
                                    <h3>${game.title}</h3>
                                    <p>${game.description || 'Click to play on itch.io'}</p>
                                </div>
                            </div>
                        </div>
                        <iframe
                            id="game-iframe-${index}"
                            src=""
                            data-embed-url="${game.embedUrl}"
                            frameborder="0"
                            allowfullscreen
                            width="640"
                            height="380"
                            style="display:none;max-width:100%;border-radius:8px;">
                            <a href="${game.embedUrl}">Play ${game.title} on itch.io</a>
                        </iframe>
                    </div>`).join('\n');

        // Find and replace the project showcase content
        const showcaseStart = '<div class="project-showcase">';
        const showcaseEnd = '</div>';
        const startIdx = content.indexOf(showcaseStart);
        
        if (startIdx !== -1) {
            const startSearchIdx = startIdx + showcaseStart.length;
            
            // Find the matching closing div by counting nested divs
            let divCount = 1;
            let endIdx = startSearchIdx;
            
            while (divCount > 0 && endIdx < content.length) {
                const nextOpenDiv = content.indexOf('<div', endIdx);
                const nextCloseDiv = content.indexOf('</div>', endIdx);
                
                // If no more closing divs found, break
                if (nextCloseDiv === -1) break;
                
                // Check if there's an opening div before the next closing div
                if (nextOpenDiv !== -1 && nextOpenDiv < nextCloseDiv) {
                    // Found opening div first, increment count
                    divCount++;
                    endIdx = nextOpenDiv + 4;
                } else {
                    // Found closing div, decrement count
                    divCount--;
                    endIdx = nextCloseDiv + 6;
                    
                    // If this is our matching closing div, we found the end
                    if (divCount === 0) {
                        endIdx = nextCloseDiv;
                        break;
                    }
                }
            }
            
            if (divCount === 0) {
                const beforeShowcase = content.slice(0, startSearchIdx);
                const afterShowcase = content.slice(endIdx);
                content = beforeShowcase + '\n' + gamesHTML + '\n                ' + afterShowcase;
                
                fs.writeFileSync(htmlFile, content);
                
                if (games.length === 0) {
                    console.log('✅ game-development.html updated (no games)');
                } else {
                    console.log(`✅ game-development.html updated with ${games.length} game(s)`);
                }
                return;
            }
        }
        
        console.log(`⚠️ Could not find project-showcase div in ${htmlFile}`);
        
    } catch (error) {
        console.error(`❌ Error updating ${htmlFile}:`, error.message);
    }
}

// Main execution
function generateAll() {
    console.log('🚀 CMS Database Gallery Generator\n');

    // Load content from JSON database
    const database = loadContentDatabase();

    if (database.content.length === 0) {
        console.log('\n⚠️ No content found in database.');
        console.log('👉 Use the Content Manager desktop app to add and tag your content.');
        return;
    }

    console.log(`\n📊 Database Summary:`);
    console.log(`   • Total items: ${database.content.length}`);
    console.log(`   • Categories: ${database.categories.join(', ')}`);
    console.log(`   • Tags available: ${database.tags.length}`);
    console.log(`   • Work types: ${database.workTypes.join(', ')}\n`);

    // Define all the pages and what they should contain
    const pages = [
        { file: 'index.html', dataName: 'allData', filter: item => !item.hidden }, // Changed to include all items
        { file: 'art.html', dataName: 'characterData', filter: item => item.category === 'character-design' && !item.hidden },
        { file: 'art.html', dataName: 'illustrationData', filter: item => item.category === 'illustration' && !item.hidden },
        { file: 'art.html', dataName: 'gameArtData', filter: item => (item.category === 'game-art' || item.category === 'props' || item.category === 'ui') && !item.hidden },
        { file: 'art.html', dataName: 'tattooData', filter: item => item.category === 'tattoo' && !item.hidden },
        { file: '3d.html', dataName: 'threeDData', filter: item => item.category === '3d' && !item.hidden },
        { file: 'video.html', dataName: 'galleryData', filter: item => item.category === 'video' && !item.hidden },
        { file: 'audio.html', dataName: 'musicData', filter: item => item.type === 'audio' && !item.hidden }
    ];

    // Update each page with its filtered content
    pages.forEach(page => {
        const items = database.content.filter(page.filter);
        updatePageData(page.file, page.dataName, items);
    });

    // Generate game development page
    generateGameDevelopmentPage();

    // Generate SEO files
    generateSitemap();
    generateRobotsTxt();

    console.log('\n✅ All pages updated successfully from JSON database!');
    console.log('\n📋 How it works:');
    console.log('• Content is managed through the Content Manager desktop app');
    console.log('• Tags, categories, and metadata are stored in content-database.json');
    console.log('• This script reads the database and updates your HTML files');
    console.log('• Run this script after making changes in the Content Manager');
}

// Export for testing
module.exports = { generateAll, loadContentDatabase };

// Run if called directly
if (require.main === module) {
    generateAll();
}
