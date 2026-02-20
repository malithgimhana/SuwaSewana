// ==========================================
// HEALCONNECT - MAIN JAVASCRIPT
// Include this file in all pages for header/footer functionality
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // 1. MOBILE NAVIGATION MENU
    // ==========================================
    const createMobileMenu = () => {
        const navContent = document.querySelector('.nav-content');
        const navLinks = document.querySelector('.nav-links');
        
        if (!navContent || !navLinks) return;
        
        // Create hamburger button
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        hamburger.setAttribute('aria-label', 'Toggle menu');
        
        // Insert hamburger before nav-links
        navContent.insertBefore(hamburger, navLinks);
        
        // Toggle menu on click
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking on links
        const navItems = navLinks.querySelectorAll('a');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 968) {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navContent.contains(e.target) && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    };
    
    createMobileMenu();
    
    
    // ==========================================
    // 2. DROPDOWN MENU
    // ==========================================
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        const dropdownLink = dropdown.querySelector('a');
        
        // Toggle dropdown on click
        dropdownLink.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Close dropdown on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            }
        });
    }
    
    
    // ==========================================
    // 3. NAVBAR SCROLL EFFECT
    // ==========================================
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Add shadow when scrolled
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }
    
    
    // ==========================================
    // 4. SMOOTH SCROLLING FOR ANCHOR LINKS
    // ==========================================
    const smoothScroll = () => {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Skip if it's just "#" or empty
                if (href === '#' || href === '') return;
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
                    const targetPosition = target.offsetTop - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };
    
    smoothScroll();
    
    
    // ==========================================
    // 5. BACK TO TOP BUTTON (Optional)
    // ==========================================
    const addBackToTop = () => {
        // Create back to top button
        const backToTopBtn = document.createElement('button');
        backToTopBtn.className = 'back-to-top';
        backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        backToTopBtn.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(backToTopBtn);
        
        // Show/hide button based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        // Scroll to top on click
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    };
    
    // Uncomment to enable back to top button
    // addBackToTop();
    
    
    // ==========================================
    // 6. AUTH UI IN NAVBAR
    // ==========================================
    const setupAuthUI = async () => {
        const loginBtn = document.querySelector('.login-btn');
        if (!loginBtn) return;
        const loginLink = loginBtn.closest('a');
        if (!loginLink) return;

        const sanitize = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));

        try {
            const response = await fetch('../api/auth/session.php', { method: 'POST' });
            const data = await response.json();
            if (!data.authenticated || !data.user) return;

            const role = data.user.role;
            const dashboardHref = role === 'admin'
                ? '../dashboard/admin.html'
                : role === 'doctor'
                    ? '../dashboard/doctor.html'
                    : '../dashboard/patient.html';

            loginLink.classList.add('user-menu');
            loginLink.href = '#';
            loginLink.innerHTML = `
                <button class="login-btn" type="button">Hi ${sanitize(data.user.name)}</button>
                <ul class="user-menu-list">
                    <li><a href="${dashboardHref}">Dashboard</a></li>
                    <li><button type="button" class="user-logout-btn">Logout</button></li>
                </ul>
            `;

            const logoutBtn = loginLink.querySelector('.user-logout-btn');
            logoutBtn?.addEventListener('click', async (e) => {
                e.preventDefault();
                await fetch('../api/auth/logout.php', { method: 'POST' });
                window.location.reload();
            });

            loginLink.addEventListener('click', (e) => {
                if (e.target.closest('.user-menu-list')) return;
                e.preventDefault();
                loginLink.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!loginLink.contains(e.target)) {
                    loginLink.classList.remove('active');
                }
            });
        } catch (error) {
            console.error('Auth UI setup failed:', error);
        }
    };

    setupAuthUI();


    // ==========================================
    // 7. APPOINTMENT LINK ACCESS GUARD
    // ==========================================
    const setupAppointmentLinkGuard = () => {
        const isAppointmentHref = (href) => /appointment\/appointment\.html(?:[?#].*)?$/.test(href || '');
        const appointmentLinks = Array.from(document.querySelectorAll('a[href]'))
            .filter((link) => isAppointmentHref(link.getAttribute('href')));

        appointmentLinks.forEach((link) => {
            link.addEventListener('click', async (e) => {
                if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                    return;
                }
                if (link.target === '_blank') return;

                e.preventDefault();

                try {
                    const response = await fetch('../api/auth/session.php', { method: 'POST' });
                    const data = await response.json();

                    if (data.authenticated && data.user && data.user.role === 'patient') {
                        window.location.href = '../appointment/appointment.html';
                        return;
                    }

                    if (!data.authenticated) {
                        alert('Please login to book appointments.');
                        window.location.href = '../login/login.html';
                        return;
                    }

                    alert('Only patients can book appointments. Please login with a patient account.');
                } catch (error) {
                    console.error('Session check failed:', error);
                    alert('Please login to book appointments.');
                    window.location.href = '../login/login.html';
                }
            });
        });
    };

    setupAppointmentLinkGuard();
    
    
    // ==========================================
    // 8. ACTIVE PAGE DETECTION
    // ==========================================
    const setActivePage = () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href');
            if (linkPage === currentPage || 
                (currentPage === '' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
    };
    
    setActivePage();
    
    
    // ==========================================
    // 9. FOOTER YEAR AUTO-UPDATE
    // ==========================================
    const updateCopyrightYear = () => {
        const copyrightElement = document.querySelector('.copyright');
        if (copyrightElement) {
            const currentYear = new Date().getFullYear();
            copyrightElement.innerHTML = copyrightElement.innerHTML.replace(/\d{4}/, currentYear);
        }
    };
    
    updateCopyrightYear();
    
    
    // ==========================================
    // 10. EXTERNAL LINKS (Open in new tab)
    // ==========================================
    const handleExternalLinks = () => {
        const links = document.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
            if (!link.hostname.includes(window.location.hostname)) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    };
    
    handleExternalLinks();
    
    
    // ==========================================
    // 11. LOADING ANIMATION
    // ==========================================
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
    
    
    // ==========================================
    // 12. CONSOLE MESSAGE
    // ==========================================
    console.log('%c🏥 HealConnect', 'color: #10B981; font-size: 24px; font-weight: bold;');
    console.log('%cYour Health, Our Priority', 'color: #059669; font-size: 14px;');
    console.log('%cWebsite loaded successfully!', 'color: #666; font-size: 12px;');
    
});


// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}


// ==========================================
// EXPORT FOR USE IN OTHER SCRIPTS (Optional)
// ==========================================
window.HealConnect = {
    smoothScroll: (target) => {
        const element = document.querySelector(target);
        if (element) {
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const targetPosition = element.offsetTop - navbarHeight - 20;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    },
    
    closeMenu: () => {
        const navLinks = document.querySelector('.nav-links');
        const hamburger = document.querySelector('.hamburger-menu');
        if (navLinks) navLinks.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
        document.body.classList.remove('menu-open');
    },
    
    openDropdown: () => {
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) dropdown.classList.add('active');
    },
    
    closeDropdown: () => {
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
};
