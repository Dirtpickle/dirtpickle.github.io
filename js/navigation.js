// Navigation and Menu Functionality

// Mobile menu setup function
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileBackdrop = document.getElementById('mobile-backdrop');
    const hamburgerLines = document.querySelectorAll('.hamburger-line');

    if (!mobileToggle || !mobileMenu || !mobileBackdrop) return;

    // Remove previous event listeners if any (by cloning)
    const newToggle = mobileToggle.cloneNode(true);
    mobileToggle.parentNode.replaceChild(newToggle, mobileToggle);
    const newBackdrop = mobileBackdrop.cloneNode(true);
    mobileBackdrop.parentNode.replaceChild(newBackdrop, mobileBackdrop);

    // Toggle mobile menu
    function toggleMobileMenu() {
        const isOpen = mobileMenu.classList.contains('active');
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    // Open mobile menu
    function openMobileMenu() {
        mobileMenu.classList.add('active');
        newBackdrop.classList.add('active');
        newToggle.setAttribute('aria-expanded', 'true');
        if (hamburgerLines.length >= 3) {
            hamburgerLines[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            hamburgerLines[1].style.opacity = '0';
            hamburgerLines[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        }
        document.body.style.overflow = 'hidden';
    }

    // Close mobile menu
    function closeMobileMenu() {
        mobileMenu.classList.remove('active');
        newBackdrop.classList.remove('active');
        newToggle.setAttribute('aria-expanded', 'false');
        if (hamburgerLines.length >= 3) {
            hamburgerLines[0].style.transform = 'rotate(0deg) translate(0px, 0px)';
            hamburgerLines[1].style.opacity = '1';
            hamburgerLines[2].style.transform = 'rotate(0deg) translate(0px, 0px)';
        }
        document.body.style.overflow = '';
    }

    // Event listeners
    newToggle.addEventListener('click', toggleMobileMenu);
    newBackdrop.addEventListener('click', closeMobileMenu);

    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // Close menu when clicking on menu links
    const mobileMenuLinks = mobileMenu.querySelectorAll('.mobile-nav-link, .mobile-dropdown-item');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Setup mobile dropdown toggles
    const mobileDropdownToggles = mobileMenu.querySelectorAll('.mobile-dropdown-toggle');
    mobileDropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = this.parentElement;
            const menu = dropdown.querySelector('.mobile-dropdown-menu');
            const isOpen = dropdown.classList.contains('open');

            // Close other mobile dropdowns
            mobileMenu.querySelectorAll('.mobile-nav-dropdown').forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    otherDropdown.classList.remove('open');
                }
            });

            // Toggle current dropdown
            if (isOpen) {
                dropdown.classList.remove('open');
            } else {
                dropdown.classList.add('open');
            }
        });
    });

    // Handle window resize - close mobile menu if window becomes large
    window.addEventListener('resize', function() {
        if (window.innerWidth > 1024 && mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });
}

// Dropdown functionality
function setupDropdowns() {
    // Support both old and new class names for compatibility
    const desktopDropdowns = document.querySelectorAll('.dropdown-toggle, .dropdown-trigger');

    desktopDropdowns.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const dropdown = this.parentElement;
            const menu = dropdown.querySelector('.dropdown-menu');

            // Close other dropdowns
            document.querySelectorAll('.nav-dropdown, .dropdown').forEach(otherDropdown => {
                if (otherDropdown !== dropdown) {
                    const otherMenu = otherDropdown.querySelector('.dropdown-menu');
                    if (otherMenu) {
                        otherMenu.classList.remove('show');
                    }
                    otherDropdown.classList.remove('active');
                }
            });

            // Toggle current dropdown
            if (menu) {
                menu.classList.toggle('show');
            }
            dropdown.classList.toggle('active');
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown, .dropdown')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
            document.querySelectorAll('.nav-dropdown, .dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });

    // Close dropdowns when scrolling
    document.addEventListener('scroll', function() {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
        document.querySelectorAll('.nav-dropdown, .dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });

    // Close dropdowns on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
            document.querySelectorAll('.nav-dropdown, .dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
}

// Export functions for global access
window.setupMobileMenu = setupMobileMenu;
window.setupDropdowns = setupDropdowns;