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

// Generate filter buttons HTML based on filter mappings
function generateFilterButtons(filterMappings, pageType = 'home') {
    if (!filterMappings || Object.keys(filterMappings).length === 0) {
        // Fallback to default filters if no mappings exist
        const defaultFilters = {
            home: ['all', 'featured', 'game-development', 'tattoo', 'aseprite', 'after effects', 'animation', '3d', 'illustration'],
            art: ['all', 'traditional', 'flash', 'aseprite', 'after effects', 'animation', 'illustration'],
            character: ['all', 'traditional', 'flash', 'aseprite']
        };
        
        const filters = defaultFilters[pageType] || defaultFilters.home;
        return filters.map(filter => {
            const displayName = filter === 'all' ? 'All' :
                               filter === 'featured' ? 'Featured' :
                               filter === 'game-development' ? 'Game Development' :
                               filter === 'aseprite' ? 'Pixel Art' :
                               filter === 'after effects' ? 'Motion Graphics' :
                               filter.charAt(0).toUpperCase() + filter.slice(1);
            
            const activeClass = (pageType === 'home' && filter === 'featured') || 
                              (pageType !== 'home' && filter === 'all') ? ' active' : '';
            
            return `                    <button class="filter-pill${activeClass}" data-filter="${filter}">${displayName}</button>`;
        }).join('\n');
    }
    
    // Generate buttons from filter mappings
    const buttons = [];
    
    // Always include 'All' button first
    const allActiveClass = pageType !== 'home' ? ' active' : '';
    buttons.push(`                    <button class="filter-pill${allActiveClass}" data-filter="all">All</button>`);
    
    // Add 'Featured' button for home page
    if (pageType === 'home') {
        buttons.push(`                    <button class="filter-pill active" data-filter="featured">Featured</button>`);
    }
    
    // Add buttons based on filter mappings
    Object.keys(filterMappings).forEach(filterKey => {
        const displayName = filterKey.replace(/-/g, ' ')
                                   .replace(/\b\w/g, c => c.toUpperCase())
                                   .replace('Tattoo Flash', 'Tattoo Flash')
                                   .replace('Motion Graphics', 'Motion Graphics')
                                   .replace('Pixel Art', 'Pixel Art')
                                   .replace('3d', '3D');
        
        buttons.push(`                    <button class="filter-pill" data-filter="${filterKey}">${displayName}</button>`);
    });
    
    return buttons.join('\n');
}

// Video-specific genre detection - from JSON tags
function getVideoGenre(tags) {
    // Check explicit tags first
    for (const tag of tags) {
        if (tag === 'trailer' || tag === 'game-trailer') return 'Game Trailer';
        if (tag === 'promo' || tag === 'promotional' || tag === 'promotional-video') return 'Promotional Video';
        if (tag === 'ad' || tag === 'advertisement' || tag === 'advert') return 'Advertisement';
        if (tag === 'motion-graphics' || tag === 'motion') return 'Motion Graphics';
        if (tag === 'tutorial') return 'Tutorial';
        if (tag === 'demo' || tag === 'gameplay') return 'Gameplay Demo';
    }

    // If no explicit tags, check for 3D workType
    if (tags.includes('3d') || tags.includes('modeling') || tags.includes('render')) return '3D Animation';

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

    return '3D Modeling'; // Default for 3D workType
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
function generateDescription(title, workType, tags) {
    // Use workType to determine description category
    let descriptionCategory = 'illustration'; // default
    if (workType) {
        const workTypeLower = workType.toLowerCase();
        if (workTypeLower.includes('character')) descriptionCategory = 'character-design';
        else if (workTypeLower.includes('game')) descriptionCategory = 'game-art';
        else if (workTypeLower.includes('tattoo')) descriptionCategory = 'tattoo';
        else if (workTypeLower.includes('3d')) descriptionCategory = '3d';
        else if (workTypeLower.includes('video')) descriptionCategory = 'video';
        else if (workTypeLower.includes('audio') || workTypeLower.includes('music')) descriptionCategory = 'audio';
    }
    
    const categoryData = SEO_DESCRIPTIONS[descriptionCategory] || SEO_DESCRIPTIONS['illustration'];

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
        return { content: [], tags: [], workTypes: [] };
    }

    try {
        const data = fs.readFileSync(DATABASE_PATH, 'utf8');
        const database = JSON.parse(data);
        console.log(`✅ Loaded ${database.content.length} items from database`);
        return database;
    } catch (error) {
        console.error(`❌ Error loading database: ${error.message}`);
        return { content: [], tags: [], workTypes: [] };
    }
}

// Transform CMS database item to website format
function transformItem(item) {
    const tags = item.tags || [];

    // Add cache buster based on file modification time or database timestamp
    const cacheBuster = `?v=${Date.now()}`;

    // Base transformation
    const transformed = {
        title: item.title,
        type: item.type,
        workType: item.workType || 'Creative Work',
        description: generateDescription(item.title, item.workType, tags),
        tags: tags,
        nsfw: item.nsfw || false,
        featured: item.featured || false,
        ...(item.linkUrl && { linkUrl: item.linkUrl })
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
            genre: getVideoGenre(tags),
            duration: estimateVideoDuration(tags),
            ...(tags.includes('3d') && {
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

// Update filter buttons in HTML files based on filter mappings
function updateFilterButtons(htmlFile, filterMappings, pageType) {
    if (!fs.existsSync(htmlFile)) {
        console.log(`⚠️ ${htmlFile} doesn't exist, skipping filter button update...`);
        return;
    }

    try {
        let content = fs.readFileSync(htmlFile, 'utf8');
        
        // Find the filter container section
        const filterContainerStart = content.indexOf('<div class="filter-container">');
        if (filterContainerStart === -1) {
            console.log(`⚠️ No filter container found in ${htmlFile}`);
            return;
        }
        
        const filterContainerEnd = content.indexOf('</div>', filterContainerStart);
        if (filterContainerEnd === -1) {
            console.log(`⚠️ Malformed filter container in ${htmlFile}`);
            return;
        }
        
        // Generate new filter buttons
        const newFilterButtons = generateFilterButtons(filterMappings, pageType);
        
        // Replace the content inside filter-container
        const beforeContainer = content.slice(0, filterContainerStart);
        const afterContainer = content.slice(filterContainerEnd);
        
        const newFilterSection = `<div class="filter-container">
${newFilterButtons}
                </div>`;
        
        content = beforeContainer + newFilterSection + afterContainer;
        
        fs.writeFileSync(htmlFile, content);
        console.log(`✅ Updated filter buttons in ${htmlFile}`);
        
    } catch (error) {
        console.error(`❌ Error updating filter buttons in ${htmlFile}:`, error.message);
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

// Helper function to get platform icons
function getPlatformIcon(platform) {
    const icons = {
        'google-play': '▶',
        'app-store': '',
        'itch-io': '🎮',
        'steam': '🎮',
        'github': '⚡',
        'website': '🌐',
        'custom': '🔗'
    };
    return icons[platform] || '🔗';
}

function generateGameDevelopmentPage() {
    const gamesDir = './games';
    let games = [];

    // Load database to check for embed entries
    const database = loadContentDatabase();
    const embedEntries = database.content.filter(item => item.type === 'embed' && item.workType === 'Game Development');

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
        const gamesHTML = games.map((game, index) => {
            // Generate external links HTML if available
            const externalLinksHTML = (game.externalLinks && game.externalLinks.length > 0)
                ? `
                        <div class="game-external-links" id="game-links-${index}">
                            ${game.externalLinks.map(link => {
                                const platformLabels = {
                                    'google-play': 'Get it on Google Play',
                                    'app-store': 'Download on the App Store',
                                    'itch-io': 'Play on itch.io',
                                    'steam': 'Get it on Steam',
                                    'github': 'View on GitHub',
                                    'website': 'Visit Website'
                                };
                                const label = link.platform === 'custom' ? (link.label || 'Visit') : platformLabels[link.platform];
                                return `
                            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="game-platform-link" data-platform="${link.platform}">
                                <span class="platform-icon">${getPlatformIcon(link.platform)}</span>
                                <span class="platform-label">${label}</span>
                            </a>`;
                            }).join('')}
                        </div>`
                : '';

            return `                    <div class="game-container">
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
                        </iframe>${externalLinksHTML}
                    </div>`;
        }).join('\n');

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
    console.log(`   • Tags available: ${database.tags.length}`);
    console.log(`   • Work types: ${database.workTypes.join(', ')}\n`);

    // Define all the pages and what they should contain
    const pages = [
        { file: 'index.html', dataName: 'allData', filter: item => !item.hidden }, // All items for home page
        { file: 'art.html', dataName: 'allArtData', filter: item => (item.type === 'image' || item.type === 'video') && !item.hidden }, // All visual art
        { file: '3d.html', dataName: 'threeDData', filter: item => (item.workType === '3D Art' || item.tags.includes('3d')) && !item.hidden },
        { file: 'video.html', dataName: 'galleryData', filter: item => item.type === 'video' && !item.hidden },
        { file: 'audio.html', dataName: 'musicData', filter: item => item.type === 'audio' && !item.hidden }
    ];

    // Update each page with its filtered and sorted content
    pages.forEach(page => {
        const items = database.content
            .filter(page.filter)
            .sort((a, b) => {
                // 1. Featured items first
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;

                // 2. Sort by sortOrder (lower numbers first)
                const aOrder = a.sortOrder !== undefined ? a.sortOrder : 999999;
                const bOrder = b.sortOrder !== undefined ? b.sortOrder : 999999;
                if (aOrder !== bOrder) return aOrder - bOrder;

                // 3. Fall back to creation date (newest first)
                return new Date(b.created || 0) - new Date(a.created || 0);
            });
        updatePageData(page.file, page.dataName, items);
    });

    // Update filter buttons based on filter mappings
    console.log('\n🎛️ Updating filter buttons...');
    const filterMappings = database.filterMappings || {};
    
    // Update filter buttons for key pages
    const filterPages = [
        { file: 'index.html', pageType: 'home' },
        { file: 'art.html', pageType: 'art' }
    ];
    
    filterPages.forEach(({ file, pageType }) => {
        updateFilterButtons(file, filterMappings, pageType);
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
