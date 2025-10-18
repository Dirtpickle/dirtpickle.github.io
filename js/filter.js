// Filter.js - Gallery filtering functionality

/**
 * Initialize the filtering system for gallery items
 * Sets up filter buttons, event handlers, and filtering logic
 */
function initializeFilter() {
    console.log('Initializing filter system...');
    
    // Get all filter pills and gallery items
    const filterPills = document.querySelectorAll('.filter-pill');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    console.log('Filter pills found:', filterPills.length);
    console.log('Gallery items found:', galleryItems.length);
    
    if (filterPills.length === 0) {
        console.warn('No filter pills found - skipping filter initialization');
        return;
    }
    
    // Add click handlers to filter pills
    filterPills.forEach(pill => {
        pill.addEventListener('click', function() {
            console.log('Filter clicked:', this.dataset.filter);
            
            // Remove active class from all pills
            filterPills.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked pill
            this.classList.add('active');
            
            // Get filter value
            const filterValue = this.dataset.filter;
            
            // Filter gallery items
            filterGalleryItems(filterValue, galleryItems);
        });
    });
    
    // Set default filter (show all or featured)
    const defaultFilter = document.querySelector('.filter-pill[data-filter="all"]') || 
                         document.querySelector('.filter-pill[data-filter="featured"]') ||
                         filterPills[0];
    
    if (defaultFilter) {
        console.log('Setting default filter:', defaultFilter.dataset.filter);
        defaultFilter.click();
    }
}

/**
 * Convert filter value to human-readable title
 * @param {string} filterValue - The filter value
 * @returns {string} - Human-readable title
 */
function formatFilterTitle(filterValue) {
    // Special cases
    const titleMap = {
        'all': 'All Work',
        'featured': 'Featured Work',
        'tattoo-flash': 'Tattoo Flash',
        'character-design': 'Character Design',
        'game-art': 'Game Art',
        'illustration': 'Illustration',
        '3d': '3D Art'
    };

    // Check if we have a special case
    if (titleMap[filterValue]) {
        return titleMap[filterValue];
    }

    // Otherwise, capitalize first letter of each word and replace dashes with spaces
    return filterValue
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Filter gallery items based on the selected filter value
 * @param {string} filterValue - The filter value to apply
 * @param {NodeList} galleryItems - The gallery items to filter
 */
function filterGalleryItems(filterValue, galleryItems) {
    console.log('Filtering items with value:', filterValue);

    let visibleCount = 0;
    
    galleryItems.forEach(item => {
        let shouldShow = false;
        
        if (filterValue === 'all') {
            shouldShow = true;
        } else if (filterValue === 'featured') {
            shouldShow = item.dataset.featured === 'true';
        } else {
            // Check if item has the tag or matches the filter
            const itemTags = item.dataset.tags ? item.dataset.tags.split(',').map(tag => tag.trim()) : [];
            const itemType = item.dataset.type || '';
            
            // Check various matching criteria
            shouldShow = itemTags.includes(filterValue) || 
                        itemType === filterValue ||
                        item.dataset.category === filterValue ||
                        item.classList.contains(filterValue);
        }
        
        if (shouldShow) {
            item.style.display = '';
            item.classList.remove('filtered-out');
            visibleCount++;
        } else {
            item.style.display = 'none';
            item.classList.add('filtered-out');
        }
    });
    
    console.log(`Filter applied: ${visibleCount} items visible`);

    // Update section title and count
    updateFilterDisplay(filterValue, visibleCount);

    // Update URL hash without triggering scroll
    if (filterValue !== 'all') {
        const currentUrl = new URL(window.location);
        currentUrl.hash = `filter-${filterValue}`;
        window.history.replaceState({}, '', currentUrl);
    } else {
        // Remove hash for 'all' filter
        const currentUrl = new URL(window.location);
        currentUrl.hash = '';
        window.history.replaceState({}, '', currentUrl);
    }
    
    // Trigger custom event for other components that might need to know about filtering
    const filterEvent = new CustomEvent('galleryFiltered', {
        detail: { filterValue, visibleCount }
    });
    document.dispatchEvent(filterEvent);
    
    // If no items are visible, show a message
    showNoResultsMessage(visibleCount === 0, filterValue);
}

/**
 * Update the filter display (title and count)
 * @param {string} filterValue - The filter value
 * @param {number} visibleCount - Number of visible items
 */
function updateFilterDisplay(filterValue, visibleCount) {
    const sectionTitle = document.getElementById('section-title');
    const itemCount = document.getElementById('item-count');

    // Update title with formatted name
    if (sectionTitle) {
        sectionTitle.textContent = formatFilterTitle(filterValue);
    }

    // Update item count
    if (itemCount) {
        itemCount.textContent = `${visibleCount} items`;
    }
}

/**
 * Show or hide no results message
 * @param {boolean} show - Whether to show the message
 * @param {string} filterValue - The current filter value
 */
function showNoResultsMessage(show, filterValue) {
    let noResultsMsg = document.querySelector('.no-results-message');
    
    if (show) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.style.cssText = `
                text-align: center;
                padding: 2rem;
                color: #666;
                font-style: italic;
                grid-column: 1 / -1;
            `;
            
            const gallery = document.querySelector('.gallery');
            if (gallery) {
                gallery.appendChild(noResultsMsg);
            }
        }
        
        noResultsMsg.textContent = `No items found for "${formatFilterTitle(filterValue)}"`;
        noResultsMsg.style.display = 'block';
    } else {
        if (noResultsMsg) {
            noResultsMsg.style.display = 'none';
        }
    }
}

/**
 * Initialize filter from URL hash on page load
 */
function initializeFilterFromHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#filter-')) {
        const filterValue = hash.replace('#filter-', '');
        const targetPill = document.querySelector(`[data-filter="${filterValue}"]`);
        if (targetPill) {
            console.log('Initializing filter from URL hash:', filterValue);
            setTimeout(() => targetPill.click(), 100);
        }
    }
}

// Make functions globally available
window.initializeFilter = initializeFilter;
window.filterGalleryItems = filterGalleryItems;
window.initializeFilterFromHash = initializeFilterFromHash;
window.formatFilterTitle = formatFilterTitle;

// Export for module usage
export { initializeFilter, filterGalleryItems, initializeFilterFromHash, formatFilterTitle };