// Main App Class
class App {
    constructor() {
        // Initialize elements
        this.initElements();
        // Initialize app
        this.init();
    }

    initElements() {
        // Navbar elements
        this.navbar = document.querySelector('.navbar');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.navToggler = document.querySelector('.navbar-toggler');
        this.navCollapse = document.querySelector('.navbar-collapse');

        // Scroll elements
        this.scrollTopBtn = document.querySelector('.scroll-top');
        this.sections = document.querySelectorAll('section[id]');

        // Animation elements
        this.fadeElements = document.querySelectorAll('.fade-in');
        this.heroCards = document.querySelectorAll('.floating-card');
        this.statCards = document.querySelectorAll('.stat-card h3');
    }

    init() {
        // Add event listeners
        this.addEventListeners();
        
        // Initialize animations
        this.initAnimations();
        
        // Initialize scroll handling
        this.handleScroll();

        // Initialize counters
        this.initCounters();
    }

    addEventListeners() {
        // Scroll events
        window.addEventListener('scroll', () => this.handleScroll());

        // Smooth scroll for navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleNavClick(e));
        });

        // Mobile menu handling
        if (this.navToggler && this.navCollapse) {
            document.addEventListener('click', (e) => this.handleMobileMenu(e));
        }

        // Scroll top button
        if (this.scrollTopBtn) {
            this.scrollTopBtn.addEventListener('click', () => this.scrollToTop());
        }
    }

    handleScroll() {
        const scrollY = window.scrollY;

        // Navbar scroll effect
        if (scrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }

        // Scroll top button visibility
        if (this.scrollTopBtn) {
            if (scrollY > 300) {
                this.scrollTopBtn.classList.add('active');
            } else {
                this.scrollTopBtn.classList.remove('active');
            }
        }

        // Active nav link update
        this.updateActiveNavLink();

        // Parallax effect for floating cards
        this.handleParallax(scrollY);
    }

    handleNavClick(e) {
        e.preventDefault();
        const targetId = e.currentTarget.getAttribute('href');
        
        if (targetId === '#') return;

        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            const offsetTop = targetSection.offsetTop - this.navbar.offsetHeight;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            if (this.navCollapse.classList.contains('show')) {
                this.navToggler.click();
            }
        }
    }

    handleMobileMenu(e) {
        if (!this.navCollapse.contains(e.target) && !this.navToggler.contains(e.target)) {
            if (this.navCollapse.classList.contains('show')) {
                this.navToggler.click();
            }
        }
    }

    updateActiveNavLink() {
        const fromTop = window.scrollY + this.navbar.offsetHeight;

        this.sections.forEach(section => {
            const { offsetTop, offsetHeight, id } = section;

            if (fromTop >= offsetTop && fromTop < offsetTop + offsetHeight) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    handleParallax(scrollY) {
        this.heroCards.forEach((card, index) => {
            const speed = index % 2 === 0 ? 0.5 : 0.3;
            const yPos = -(scrollY * speed);
            card.style.transform = `translateY(${yPos}px)`;
        });
    }

    initAnimations() {
        const observerOptions = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        this.fadeElements.forEach(element => {
            observer.observe(element);
        });
    }

    initCounters() {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        this.statCards.forEach(card => counterObserver.observe(card));
    }

    animateCounter(element) {
        const target = parseInt(element.textContent.replace(/[^0-9]/g, ''));
        const suffix = element.textContent.replace(/[0-9]/g, '');
        const duration = 2000;
        const steps = 60;
        const stepValue = target / steps;
        let current = 0;

        const updateCounter = () => {
            current += stepValue;
            if (current >= target) {
                element.textContent = target + suffix;
            } else {
                element.textContent = Math.floor(current) + suffix;
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
});

// Newsletter Form Handling
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;
        
        // Add your newsletter subscription logic here
        console.log('Newsletter subscription for:', email);
        
        // Show success message
        alert('Terima kasih telah berlangganan newsletter kami!');
        newsletterForm.reset();
    });
}