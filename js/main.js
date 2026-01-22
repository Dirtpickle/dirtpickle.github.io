// Main initialization and coordination script

// Main initialization function
function initializePortfolio() {
    console.log('Initializing portfolio...');

    // Inject shared footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
        fetch('footer.html')
            .then(res => res.text())
            .then(html => {
                footerPlaceholder.outerHTML = html;
            })
            .catch(err => console.log('Footer loading optional:', err));
    }

    // Initialize navigation components
    if (typeof setupMobileMenu === 'function') {
        setupMobileMenu();
    }

    if (typeof setupDropdowns === 'function') {
        setupDropdowns();
    }

    // Initialize filter system (must be done after gallery is loaded)
    if (typeof initializeFilter === 'function') {
        initializeFilter();
    }

    // Initialize filter from URL hash
    if (typeof initializeFilterFromHash === 'function') {
        initializeFilterFromHash();
    }

    // Setup game toggles for interactive game items
    if (typeof setupGameToggles === 'function') {
        setupGameToggles();
    }

    // Initialize gallery lazy loading if present
    if (typeof initVideoLazyLoading === 'function') {
        initVideoLazyLoading();
    }

    // Setup lightbox click-outside to close
    setupLightboxClickOutside();

    console.log('Portfolio initialized successfully');
}

// Setup lightbox click-outside to close handler
function setupLightboxClickOutside() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                if (typeof closeLightbox === 'function') {
                    closeLightbox();
                }
            }
        });
    }
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePortfolio);

// Global utilities and fallbacks
window.initializePortfolio = initializePortfolio;