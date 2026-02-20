// ==========================================
// ABOUT US PAGE - JAVASCRIPT
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // 1. COUNTER ANIMATION FOR STATISTICS
    // ==========================================
    const counterAnimation = (element, target, duration = 2000) => {
        let start = 0;
        const increment = target / (duration / 16);
        
        const updateCounter = () => {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        updateCounter();
    };
    
    // Observer for counter animation
    const counters = document.querySelectorAll('[data-count]');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                counterAnimation(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
    
    
    // ==========================================
    // 2. SMOOTH SCROLLING
    // ==========================================
    const smoothScroll = () => {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href === '#' || href === '') return;
                
                const target = document.querySelector(href);
                
                if (target) {
                    e.preventDefault();
                    const navbarHeight = document.querySelector('.navbar').offsetHeight;
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
    // 3. NAVBAR SCROLL EFFECT
    // ==========================================
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        } else {
            navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }
        
        lastScroll = currentScroll;
    });
    
    
    // ==========================================
    // 4. SCROLL ANIMATIONS
    // ==========================================
    const scrollAnimations = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-on-scroll');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe various elements
        const elementsToAnimate = document.querySelectorAll('.mv-card, .feature-item, .timeline-item, .team-member');
        elementsToAnimate.forEach(element => observer.observe(element));
    };
    
    scrollAnimations();
    
    
    // ==========================================
    // 5. BACK TO TOP BUTTON
    // ==========================================
    const backToTop = () => {
        const backToTopBtn = document.createElement('button');
        backToTopBtn.className = 'back-to-top';
        backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        backToTopBtn.setAttribute('aria-label', 'Back to top');
        document.body.appendChild(backToTopBtn);
        
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    };
    
    backToTop();
    
    
    // ==========================================
    // 6. MOBILE NAVIGATION
    // ==========================================
    const createMobileMenu = () => {
        const navContent = document.querySelector('.nav-content');
        const navLinks = document.querySelector('.nav-links');
        
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        hamburger.setAttribute('aria-label', 'Toggle menu');
        
        navContent.insertBefore(hamburger, navLinks);
        
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
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
    // 7. BUTTON CLICK HANDLERS
    // ==========================================
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.textContent.trim();
            
            if (text.includes('Book')) {
                alert('Redirecting to appointment booking...');
                // window.location.href = 'appointments.html';
            } else if (text.includes('Contact')) {
                alert('Redirecting to contact page...');
                // window.location.href = 'contact.html';
            }
        });
    });
    
    
    // ==========================================
    // 8. DROPDOWN MENU
    // ==========================================
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        const dropdownLink = dropdown.querySelector('a');
        
        dropdownLink.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }
    
    
    // ==========================================
    // 9. TIMELINE ANIMATION STAGGER
    // ==========================================
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.2}s`;
    });
    
    
    // ==========================================
    // 10. TEAM MEMBER HOVER EFFECTS
    // ==========================================
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        member.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    
    // ==========================================
    // 11. PARALLAX EFFECT FOR HERO IMAGE
    // ==========================================
    const heroImage = document.querySelector('.about-hero-image');
    if (heroImage) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroSection = document.querySelector('.about-hero');
            
            if (heroSection) {
                const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
                
                if (scrolled < heroBottom) {
                    heroImage.style.transform = `translateY(${scrolled * 0.15}px)`;
                }
            }
        });
    }
    
    
    // ==========================================
    // 12. LOADING ANIMATION
    // ==========================================
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
    
    
    // ==========================================
    // 13. FEATURE CARD STAGGER ANIMATION
    // ==========================================
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
    
    
    // ==========================================
    // 14. MISSION & VISION CARD EFFECTS
    // ==========================================
    const mvCards = document.querySelectorAll('.mv-card');
    mvCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.03)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    
    // ==========================================
    // 15. SOCIAL LINKS ANIMATION
    // ==========================================
    const socialLinks = document.querySelectorAll('.social-links a');
    socialLinks.forEach((link, index) => {
        link.style.animationDelay = `${index * 0.1}s`;
    });
    
    
    // ==========================================
    // 16. CONSOLE MESSAGE
    // ==========================================
    console.log('%c🏥 HealConnect - About Us', 'color: #10B981; font-size: 20px; font-weight: bold;');
    console.log('%cPage loaded successfully!', 'color: #666; font-size: 12px;');
    
    
    // ==========================================
    // 17. ADD RIPPLE EFFECT TO BUTTONS
    // ==========================================
    const addRippleEffect = () => {
        const buttons = document.querySelectorAll('.btn, .login-btn');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                this.appendChild(ripple);
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    };
    
    addRippleEffect();
    
    
    // ==========================================
    // 18. LAZY LOAD IMAGES
    // ==========================================
    const lazyLoadImages = () => {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    };
    
    lazyLoadImages();
    
});


// ==========================================
// ADD THIS CSS FOR ADDITIONAL FEATURES
// ==========================================
/*
Add to your about.css:

.back-to-top {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
    opacity: 0;
    visibility: hidden;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 998;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
}

.back-to-top.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.back-to-top:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(16, 185, 129, 0.5);
}

.hamburger-menu {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
}

.hamburger-line {
    width: 25px;
    height: 3px;
    background-color: #333;
    transition: all 0.3s ease;
    border-radius: 2px;
}

.hamburger-menu.active .hamburger-line:nth-child(1) {
    transform: rotate(45deg) translate(8px, 8px);
    background-color: #10B981;
}

.hamburger-menu.active .hamburger-line:nth-child(2) {
    opacity: 0;
}

.hamburger-menu.active .hamburger-line:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -7px);
    background-color: #10B981;
}

@media (max-width: 968px) {
    .hamburger-menu {
        display: flex;
    }
    
    .nav-links {
        position: fixed;
        top: 70px;
        right: -100%;
        width: 300px;
        max-width: 85%;
        height: calc(100vh - 70px);
        background: white;
        flex-direction: column;
        gap: 0 !important;
        padding: 30px 20px;
        box-shadow: -5px 0 25px rgba(0,0,0,0.15);
        transition: right 0.4s ease;
        overflow-y: auto;
        z-index: 1000;
    }
    
    .nav-links.active {
        right: 0;
    }
}

.ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
}

@keyframes ripple-animation {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

body.loaded {
    animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
*/
