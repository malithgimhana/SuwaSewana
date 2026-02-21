// ==========================================
// SERVICES PAGE - JAVASCRIPT
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // 1. SERVICE CARD ANIMATIONS
    // ==========================================
    const observeCards = () => {
        const cards = document.querySelectorAll('.service-card, .specialty-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            });
        }, {
            threshold: 0.1
        });
        
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease-out';
            observer.observe(card);
        });
    };
    
    observeCards();
    
    
    // ==========================================
    // 2. SERVICE BUTTON HANDLERS
    // ==========================================
    const serviceButtons = document.querySelectorAll('.service-btn');
    serviceButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const serviceName = this.closest('.service-card').querySelector('h3').textContent;
            console.log('Booking service:', serviceName);
            alert(`You're booking: ${serviceName}\nRedirecting to appointment page...`);
            // window.location.href = 'appointment.html?service=' + encodeURIComponent(serviceName);
        });
    });
    
    
    // ==========================================
    // 3. SPECIALTY ITEM CLICK HANDLERS
    // ==========================================
    const specialtyItems = document.querySelectorAll('.specialty-item');
    specialtyItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', function() {
            const specialtyName = this.querySelector('h4').textContent;
            console.log('Viewing specialty:', specialtyName);
            alert(`Learn more about ${specialtyName}\nRedirecting to department page...`);
            // window.location.href = 'department.html?specialty=' + encodeURIComponent(specialtyName);
        });
    });
    
    
    // ==========================================
    // 4. APPOINTMENT BUTTONS
    // ==========================================
    const appointmentBtns = document.querySelectorAll('.appointment-buttons button');
    appointmentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('btn-primary')) {
                console.log('Opening appointment booking...');
                alert('Redirecting to appointment booking page...');
                // window.location.href = 'appointment.html';
            } else {
                console.log('Opening contact page...');
                alert('Redirecting to contact page...');
                // window.location.href = 'contact.html';
            }
        });
    });
    
    
    // ==========================================
    // 5. DIAGNOSTIC ITEMS HOVER EFFECT
    // ==========================================
    const diagnosticItems = document.querySelectorAll('.diagnostic-item');
    diagnosticItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.borderLeft = '4px solid #10B981';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.borderLeft = 'none';
        });
    });
    
    
    // ==========================================
    // 6. SMOOTH SCROLL TO SECTIONS
    // ==========================================
    const scrollToSection = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const targetPosition = section.offsetTop - navbarHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };
    
    
    // ==========================================
    // 7. COUNTER ANIMATION (Optional)
    // ==========================================
    const animateCounter = (element, target, duration = 2000) => {
        let current = 0;
        const increment = target / (duration / 16);
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };
        
        updateCounter();
    };
    
    
    // ==========================================
    // 8. FILTER SERVICES BY CATEGORY (Future Enhancement)
    // ==========================================
    window.filterServices = function(category) {
        const services = document.querySelectorAll('.service-card, .specialty-item');
        
        services.forEach(service => {
            if (category === 'all' || service.dataset.category === category) {
                service.style.display = 'block';
            } else {
                service.style.display = 'none';
            }
        });
    };
    
    
    // ==========================================
    // 9. SEARCH FUNCTIONALITY (Future Enhancement)
    // ==========================================
    window.searchServices = function(query) {
        const services = document.querySelectorAll('.service-card, .specialty-item');
        const searchQuery = query.toLowerCase();
        
        services.forEach(service => {
            const title = service.querySelector('h3, h4').textContent.toLowerCase();
            const description = service.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchQuery) || description.includes(searchQuery)) {
                service.style.display = 'block';
            } else {
                service.style.display = 'none';
            }
        });
    };
    
    
    // ==========================================
    // 10. CONSOLE MESSAGE
    // ==========================================
    console.log('%c🏥 Services Page Loaded', 'color: #10B981; font-size: 16px; font-weight: bold;');
    console.log('%cAll services initialized successfully!', 'color: #059669; font-size: 12px;');
    
});


// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Format phone numbers
function formatPhoneNumber(phone) {
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

// Format service names for URLs
function formatServiceName(name) {
    return name.toLowerCase().replace(/\s+/g, '-');
}

// Check if service is available
function checkServiceAvailability(serviceName) {
    // This would typically check with a backend
    console.log('Checking availability for:', serviceName);
    return true;
}