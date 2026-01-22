// Utility Functions

// NSFW content toggle functionality
function toggleNSFWBlur(overlayElement) {
    const galleryItem = overlayElement.closest('.gallery-item');
    if (galleryItem) {
        // Add both 'nsfw-revealed' and 'revealed' for CSS compatibility
        galleryItem.classList.add('nsfw-revealed');
        galleryItem.classList.add('revealed');
        overlayElement.style.display = 'none';
    }
}

// Export functions for global access
window.toggleNSFWBlur = toggleNSFWBlur;