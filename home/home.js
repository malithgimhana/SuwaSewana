// ==========================================
// HealConnect - Main JavaScript File
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // 1. MOBILE NAVIGATION TOGGLE
    // ==========================================
    const createMobileMenu = () => {
        const navbar = document.querySelector('.navbar');
        const navContent = document.querySelector('.nav-content');
        
        // Create hamburger menu button
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        hamburger.setAttribute('aria-label', 'Toggle menu');
        
        // Insert hamburger before nav-links
        const navLinks = document.querySelector('.nav-links');
        navContent.insertBefore(hamburger, navLinks);
        
        // Toggle mobile menu
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
        
        // Close menu when clicking on a link
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
    // 2. SMOOTH SCROLLING FOR ANCHOR LINKS
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
    const navbarScrollEffect = () => {
        const navbar = document.querySelector('.navbar');
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Add shadow on scroll
            if (currentScroll > 50) {
                navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            } else {
                navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
            
            lastScroll = currentScroll;
        });
    };
    
    navbarScrollEffect();
    
    
    // ==========================================
    // 4. DROPDOWN MENU FUNCTIONALITY
    // ==========================================
    const dropdownMenu = () => {
        const dropdown = document.querySelector('.dropdown');
        if (!dropdown) return;
        
        const dropdownLink = dropdown.querySelector('a');
        const dropdownMenu = dropdown.querySelector('ul');
        
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
    };
    
    dropdownMenu();
    
    
    // ==========================================
    // 5. SCROLL ANIMATIONS
    // ==========================================
    const scrollAnimations = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        // Observe feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.classList.add('animate-on-scroll');
            observer.observe(card);
        });
        
        // Observe doctor cards
        const doctorCards = document.querySelectorAll('.doctor-card');
        doctorCards.forEach(card => {
            card.classList.add('animate-on-scroll');
            observer.observe(card);
        });
    };
    
    scrollAnimations();
    
    
    // ==========================================
    // 8. BUTTON INTERACTIONS
    // ==========================================
    function buttonInteractions() {
        // Book Appointment buttons
        const appointmentBtns = document.querySelectorAll('.btn-primary');
        appointmentBtns.forEach(btn => {
            if (btn.textContent.includes('Book') || btn.textContent.includes('Schedule')) {
                btn.addEventListener('click', async (e) => {
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
                        return;
                    } catch (error) {
                        console.error('Session check failed:', error);
                        alert('Please login to book appointments.');
                        window.location.href = '../login/login.html';
                        return;
                    }
                });
            }
        });
    }
    
    buttonInteractions();
    
    
    // ==========================================
    // 9. LOADING ANIMATION
    // ==========================================
    const loadingAnimation = () => {
        // Add loaded class to body when page is fully loaded
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
        });
    };
    
    loadingAnimation();
    
    
    // ==========================================
    // 10. HERO IMAGE PARALLAX EFFECT
    // ==========================================
    const parallaxEffect = () => {
        const heroImage = document.querySelector('.hero-image img');
        if (!heroImage) return;
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroSection = document.querySelector('.hero');
            
            if (heroSection) {
                const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
                
                if (scrolled < heroBottom) {
                    heroImage.style.transform = `translateY(${scrolled * 0.3}px)`;
                }
            }
        });
    };
    
    parallaxEffect();
    
    
    // ==========================================
    // 11. FORM VALIDATION (if needed in future)
    // ==========================================
    const formValidation = () => {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const inputs = form.querySelectorAll('input[required], textarea[required]');
                let isValid = true;
                
                inputs.forEach(input => {
                    if (!input.value.trim()) {
                        isValid = false;
                        input.classList.add('error');
                    } else {
                        input.classList.remove('error');
                    }
                });
                
                if (isValid) {
                    console.log('Form is valid - submitting...');
                    // form.submit();
                } else {
                    alert('Please fill in all required fields');
                }
            });
        });
    };
    
    formValidation();
    
    
    // ==========================================
    // 12. DOCTOR CARD HOVER EFFECTS
    // ==========================================
    const doctorCardEffects = () => {
        const doctorCards = document.querySelectorAll('.doctor-card');
        
        doctorCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    };
    
    doctorCardEffects();
    
    
    // ==========================================
    // 13. COUNTER ANIMATION (for statistics if added)
    // ==========================================
    const counterAnimation = (element, target, duration = 2000) => {
        let start = 0;
        const increment = target / (duration / 16);
        
        const updateCounter = () => {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };
        
        updateCounter();
    };
    
    // Example usage: Add data-count attribute to elements
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
    // 14. TYPING EFFECT FOR HERO TEXT (optional)
    // ==========================================
    const typingEffect = () => {
        const heroTitle = document.querySelector('.hero-text h1');
        if (!heroTitle) return;
        
        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.opacity = '1';
        
        let charIndex = 0;
        
        const typeChar = () => {
            if (charIndex < originalText.length) {
                heroTitle.innerHTML += originalText.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, 50);
            }
        };
        
        // Uncomment to enable typing effect
        // typeChar();
    };
    
    typingEffect();
    
    
    // ==========================================
    // 15. LAZY LOADING IMAGES
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
    
    
    // ==========================================
    // 16. CONSOLE MESSAGE
    // ==========================================
    console.log('%c🏥 HealConnect', 'color: #3B82F6; font-size: 24px; font-weight: bold;');
    console.log('%cYour Health, Our Priority', 'color: #10B981; font-size: 14px;');
    console.log('%cWebsite loaded successfully!', 'color: #666; font-size: 12px;');
    
});

// Load doctors from admin-managed data and render on home page.
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('homeDoctorsGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="doctor-summary">Loading doctors...</p>';

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toAssetUrl(path) {
        if (!path) return '../img/meddical_team.png';
        return `../${path}`;
    }

    try {
        const response = await fetch('../api/doctors.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list' })
        });
        const data = await response.json();
        if (!response.ok || data.ok === false) {
            grid.innerHTML = '<p class="doctor-summary">Unable to load doctors right now.</p>';
            return;
        }

        const doctors = (data.doctors || []).slice(0, 6);
        if (doctors.length === 0) {
            grid.innerHTML = '<p class="doctor-summary">No doctors added by admin yet.</p>';
            return;
        }

        grid.innerHTML = doctors.map((doctor) => {
            const fullName = doctor.full_name || 'Doctor';
            const specialty = String(doctor.specialty || doctor.department || '').trim() || 'General Medicine';
            const years = Number(doctor.experience_years || 0);
            const experienceLabel = years > 0 ? `${years}+ years experience` : 'Verified Specialist';
            const summaryRaw = String(doctor.profile_bio || '').trim();
            const summary = summaryRaw !== ''
                ? (summaryRaw.length > 110 ? `${summaryRaw.slice(0, 110)}...` : summaryRaw)
                : `Experienced ${specialty} consultant dedicated to patient care.`;
            return `
                <div class="doctor-card">
                    <div class="doctor-header">
                        <div class="doctor-image">
                            <img src="${escapeHtml(toAssetUrl(doctor.photo_path))}" alt="${escapeHtml(fullName)}">
                        </div>
                        <div class="doctor-info">
                            <h2>${escapeHtml(fullName)}</h2>
                            <span class="specialty">${escapeHtml(specialty)}</span>
                            <p class="doctor-summary">${escapeHtml(summary)}</p>
                            <div class="experience">
                                <svg fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                                </svg>
                                <span>${escapeHtml(experienceLabel)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-actions">
                        <a href="../appointment/appointment.html"><button class="btn btn-primary">Book Now</button></a>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Unable to load doctors on home page:', error);
        grid.innerHTML = '<p class="doctor-summary">Unable to load doctors right now.</p>';
    }
});
