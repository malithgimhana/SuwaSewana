// ==========================================
// CONTACT PAGE - JAVASCRIPT
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    const validators = {
        personName: (value) => /^[A-Za-z][A-Za-z\s'-]{0,11}$/.test(value),
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => /^0\d{9}$/.test(value)
    };
    
    const form = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    // ==========================================
    // FORM VALIDATION AND SUBMISSION
    // ==========================================
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Reset previous errors
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error-active');
        });
        document.querySelector('.checkbox-group').classList.remove('error-active');
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        
        let isValid = true;
        
        // Validate First Name
        const firstName = document.getElementById('firstName');
        if (!validators.personName(firstName.value.trim())) {
            firstName.parentElement.classList.add('error-active');
            isValid = false;
        }
        
        // Validate Last Name
        const lastName = document.getElementById('lastName');
        if (!validators.personName(lastName.value.trim())) {
            lastName.parentElement.classList.add('error-active');
            isValid = false;
        }
        
        // Validate Email
        const email = document.getElementById('email');
        if (!validators.email(email.value.trim())) {
            email.parentElement.classList.add('error-active');
            isValid = false;
        }
        
        // Validate Phone (optional, but if filled should be valid)
        const phone = document.getElementById('phone');
        if (phone.value.trim() !== '') {
            if (!validators.phone(phone.value.trim())) {
                phone.parentElement.classList.add('error-active');
                isValid = false;
            }
        }
        
        // Validate Subject
        const subject = document.getElementById('subject');
        if (subject.value === '') {
            subject.parentElement.classList.add('error-active');
            isValid = false;
        }
        
        // Validate Message
        const message = document.getElementById('message');
        if (message.value.trim() === '' || message.value.trim().length < 10) {
            message.parentElement.classList.add('error-active');
            isValid = false;
        }
        
        // Validate Privacy Checkbox
        const privacy = document.getElementById('privacy');
        if (!privacy.checked) {
            document.querySelector('.checkbox-group').classList.add('error-active');
            isValid = false;
        }
        
        // If validation fails, show error message
        if (!isValid) {
            errorMessage.style.display = 'flex';
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // If all valid, submit form to backend API
        const formData = {
            firstName: firstName.value.trim(),
            lastName: lastName.value.trim(),
            email: email.value.trim(),
            phone: phone.value.trim(),
            subject: subject.value,
            message: message.value.trim()
        };

        const submitButton = form.querySelector('.submit-btn');
        submitButton.disabled = true;

        fetch('../api/contact_messages.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(async (response) => {
                const payload = await response.json().catch(() => ({}));
                if (!response.ok || !payload.ok) {
                    throw new Error(payload.message || 'Failed to send message');
                }

                successMessage.style.display = 'flex';
                successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                form.reset();
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 5000);
            })
            .catch((err) => {
                const span = errorMessage.querySelector('span');
                if (span) {
                    span.textContent = err.message || 'Unable to send your message right now.';
                }
                errorMessage.style.display = 'flex';
                errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            })
            .finally(() => {
                submitButton.disabled = false;
            });
    });
    
    
    // ==========================================
    // REAL-TIME VALIDATION
    // ==========================================
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.parentElement.classList.contains('error-active')) {
                validateField(this);
            }
        });
    });
    
    function validateField(field) {
        const parent = field.closest('.form-group') || field.closest('.checkbox-group');
        
        switch (field.id) {
            case 'firstName':
            case 'lastName':
                if (!validators.personName(field.value.trim())) {
                    parent.classList.add('error-active');
                } else {
                    parent.classList.remove('error-active');
                }
                break;
                
            case 'email':
                if (!validators.email(field.value.trim())) {
                    parent.classList.add('error-active');
                } else {
                    parent.classList.remove('error-active');
                }
                break;
                
            case 'phone':
                if (field.value.trim() !== '') {
                    if (!validators.phone(field.value.trim())) {
                        parent.classList.add('error-active');
                    } else {
                        parent.classList.remove('error-active');
                    }
                } else {
                    parent.classList.remove('error-active');
                }
                break;
                
            case 'subject':
                if (field.value === '') {
                    parent.classList.add('error-active');
                } else {
                    parent.classList.remove('error-active');
                }
                break;
                
            case 'message':
                if (field.value.trim() === '' || field.value.trim().length < 10) {
                    parent.classList.add('error-active');
                } else {
                    parent.classList.remove('error-active');
                }
                break;
                
            case 'privacy':
                if (!field.checked) {
                    parent.classList.add('error-active');
                } else {
                    parent.classList.remove('error-active');
                }
                break;
        }
    }
    
    
    // ==========================================
    // INFO CARDS ANIMATION
    // ==========================================
    const observeCards = () => {
        const cards = document.querySelectorAll('.info-card');
        
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
    // CHARACTER COUNTER FOR MESSAGE (Optional)
    // ==========================================
    const messageField = document.getElementById('message');
    const addCharCounter = () => {
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = 'text-align: right; font-size: 12px; color: #6b7280; margin-top: 5px;';
        messageField.parentElement.appendChild(counter);
        
        const updateCounter = () => {
            const length = messageField.value.length;
            counter.textContent = `${length} characters`;
            
            if (length < 10) {
                counter.style.color = '#e74c3c';
            } else {
                counter.style.color = '#10B981';
            }
        };
        
        messageField.addEventListener('input', updateCounter);
        updateCounter();
    };
    
    // Uncomment to enable character counter
    // addCharCounter();
    
    
    // ==========================================
    // PHONE NUMBER FORMATTING (Optional)
    // ==========================================
    const phoneField = document.getElementById('phone');
    phoneField.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.slice(0, 10);
        e.target.value = value;
    });
    
    
    // ==========================================
    // CONSOLE MESSAGE
    // ==========================================
    console.log('%c📞 Contact Page Loaded', 'color: #10B981; font-size: 16px; font-weight: bold;');
    console.log('%cReady to receive messages!', 'color: #059669; font-size: 12px;');
    
});


// ==========================================
// UTILITY FUNCTION - SEND TO SERVER
// ==========================================
function sendToServer(data) {
    // Example implementation
    fetch('/api/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Success:', result);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
