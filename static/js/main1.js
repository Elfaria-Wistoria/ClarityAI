class ChatBot {
    destroy() {
        this.removeEventListeners();
        this.clearTimeouts();
        this.messageQueue = [];
    }
    
    clearTimeouts() {
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    }

    constructor() {
        this.messageQueue = [];
        this.isProcessing = false;

        this.initializeElements();
        this.initializeEventListeners();
        this.setupAutoResize();
        this.setupScrollHandling(); // Tambahan baru
        this.loadChatHistory();
    }

    async processMessageQueue() {
        if (this.isProcessing || !this.messageQueue.length) return;
        
        this.isProcessing = true;
        const message = this.messageQueue.shift();
        
        try {
            await this.processMessage(message);
        } finally {
            this.isProcessing = false;
            this.processMessageQueue();
        }
    }

    async handleImageUpload(file) {
        try {
            if (!this.validateImage(file)) return;
            
            const imageData = await this.loadImagePreview(file);
            await this.showImagePreviewModal(imageData);
            
        } catch (error) {
            console.error('Image upload error:', error);
            this.showToast('Failed to process image', 'error');
        }
    }

    handleImageUpload(input) {
        const file = input.files[0];
        if (!file) return;
    
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }
    
        // Show preview modal
        const previewModal = document.getElementById('imagePreviewModal');
        const previewImage = document.getElementById('previewImage');
        const reader = new FileReader();
    
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewModal.classList.remove('hidden');
            previewModal.classList.add('flex');
        };
    
        reader.readAsDataURL(file);
    
        // Handle modal actions
        const confirmBtn = document.getElementById('confirmUpload');
        const cancelBtn = document.getElementById('cancelUpload');
    
        const cleanup = () => {
            previewModal.classList.add('hidden');
            previewModal.classList.remove('flex');
            input.value = '';
        };
    
        const handleConfirm = async () => {
            cleanup();
            await this.analyzeImage(file);
        };
    
        confirmBtn.onclick = handleConfirm;
        cancelBtn.onclick = cleanup;
    }
    
    async analyzeImage(file) {
        try {
            // Show loading
            const loadingIndicator = document.getElementById('analysisLoading');
            loadingIndicator.classList.remove('hidden');
            loadingIndicator.classList.add('flex');
    
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);
    
            // Send to server
            const response = await fetch('/analyze_image', {
                method: 'POST',
                body: formData
            });
    
            if (!response.ok) throw new Error('Failed to analyze image');
            
            const data = await response.json();
    
            // Hide loading
            loadingIndicator.classList.add('hidden');
            loadingIndicator.classList.remove('flex');
    
            if (data.success) {
                // Add image preview message
                await this.addMessage({
                    type: 'user',
                    content: `<div class="image-message">
                        <img src="${URL.createObjectURL(file)}" alt="Uploaded eye image">
                    </div>`
                });
    
                // Add analysis result
                await this.addMessage({
                    type: 'bot',
                    content: `<div class="analysis-result">
                        <h4>Eye Analysis Result</h4>
                        <div class="diagnosis ${data.result.toLowerCase()}-diagnosis">
                            ${data.result}
                        </div>
                        <p class="mt-4">
                            ${this.getAnalysisMessage(data.result)}
                        </p>
                    </div>`
                });
            } else {
                this.showToast(data.message || 'Analysis failed', 'error');
            }
    
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('analysisLoading').classList.add('hidden');
            this.showToast('Failed to analyze image', 'error');
        }
    }
    
    
    getAnalysisMessage(result) {
        if (result.toLowerCase() === 'katarak') {
            return `Berdasarkan analisis AI, ditemukan indikasi katarak pada gambar yang diunggah. 
                    Sangat disarankan untuk melakukan konsultasi dengan dokter mata untuk pemeriksaan 
                    lebih lanjut dan penanganan yang tepat.`;
        }
        return `Berdasarkan analisis AI, tidak terdeteksi adanya katarak pada gambar yang diunggah. 
                Namun, tetap disarankan untuk melakukan pemeriksaan mata rutin dengan dokter mata 
                untuk memastikan kesehatan mata Anda.`;
    }

    // Initialize DOM Elements
    initializeElements() {
        this.chatContainer = document.getElementById('chatContainer');
        this.chatForm = document.querySelector('.chat-form');
        this.messageInput = document.querySelector('.chat-input');
        this.sendButton = document.querySelector('.send-btn');
        this.voiceButton = document.querySelector('.voice-btn');
        this.attachmentButton = document.querySelector('.attachment-btn');
        this.clearButton = document.querySelector('.clear-btn');
        this.voiceModal = document.getElementById('voiceModal');
        this.menuButton = document.querySelector('.menu-btn');
        this.sidebar = document.querySelector('.sidebar');
        this.imageInput = document.getElementById('imageInput');
    }

    // Set up event listeners
    initializeEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Button clicks
        this.sendButton.addEventListener('click', (e) => this.handleSubmit(e));
        this.voiceButton.addEventListener('click', () => this.toggleVoiceRecording());
        this.attachmentButton.addEventListener('click', () => this.handleAttachment());
        this.clearButton.addEventListener('click', () => this.confirmClearChat());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e.target));

        // Mobile menu
        if (this.menuButton) {
            this.menuButton.addEventListener('click', () => this.toggleSidebar());
        }

        // Voice modal close
        if (this.voiceModal) {
            const stopButton = this.voiceModal.querySelector('.stop-recording-btn');
            stopButton.addEventListener('click', () => this.stopVoiceRecording());
        }

        // Outside click handlers
        document.addEventListener('click', (e) => this.handleOutsideClick(e));
    }

    // Setup scroll handling - New Feature
    setupScrollHandling() {
        let isScrolling;
        
        this.chatContainer.addEventListener('scroll', () => {
            window.clearTimeout(isScrolling);
            
            isScrolling = setTimeout(() => {
                const isAtBottom = this.chatContainer.scrollHeight - this.chatContainer.scrollTop <= this.chatContainer.clientHeight + 100;
                if (!isAtBottom) {
                    this.showScrollIndicator();
                }
            }, 66);
        });
    }

    // Show scroll indicator - New Feature
    showScrollIndicator() {
        const existingIndicator = document.querySelector('.scroll-bottom-indicator');
        if (existingIndicator) return;

        const indicator = document.createElement('button');
        indicator.className = 'scroll-bottom-indicator animate__animated animate__fadeIn';
        indicator.innerHTML = '<i class="fas fa-arrow-down"></i>';
        indicator.onclick = () => {
            this.scrollToBottom();
            indicator.remove();
        };
        
        this.chatContainer.appendChild(indicator);

        // Auto remove after 3 seconds
        setTimeout(() => {
            if (document.contains(indicator)) {
                indicator.classList.add('animate__fadeOut');
                setTimeout(() => indicator.remove(), 300);
            }
        }, 3000);
    }

    // Load chat history from server
    async loadChatHistory() {
        try {
            const response = await fetch('/load_history');
            if (!response.ok) throw new Error('Failed to load history');
            
            const history = await response.json();
            this.chatContainer.innerHTML = ''; // Clear existing messages
            
            history.forEach(msg => {
                this.addMessage({
                    type: msg.sender,
                    content: msg.message
                });
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.showToast('Failed to load chat history', 'error');
        }
    }

    // Auto-resize textarea
    setupAutoResize() {
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });
    }

    // Handle form submission
    async handleSubmit(e) {
        e.preventDefault();
        const message = this.messageInput.value.trim();
        
        if (message) {
            // Add user message
            await this.addMessage({
                type: 'user',
                content: message
            });
            
            // Clear input
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';
            
            // Process message
            await this.processMessage(message);
        }
    }

    // Handle enter key press
    handleKeyPress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit(e);
        }
    }

    async addMessage({ type, content }) {
        const messageDiv = document.createElement('div');
        messageDiv.setAttribute('role', 'log');
        messageDiv.setAttribute('aria-live', 'polite');
        messageDiv.className = `message ${type} group animate__animated animate__fadeIn`;
     
        const time = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit', 
            hour12: true
        });
     
        // Format markdown/HTML content
        const formattedContent = content.replace(/\*\*\*(.*?)\*\*\*/g, '<strong>$1</strong>')
                                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
     
        const bubbleContent = `
            <div class="message-bubble ${type} hover:shadow-md transition-all">
                <div class="flex items-center ${type === 'user' ? 'justify-end' : ''} gap-2 mb-1">
                    <span class="text-xs opacity-60">${time}</span>
                </div>
                <div class="text-[15px] leading-relaxed">${formattedContent}</div>
            </div>
            ${this.getMessageActions(type)}
        `;
     
        messageDiv.innerHTML = bubbleContent;
        this.chatContainer.appendChild(messageDiv);
     
        await new Promise(resolve => setTimeout(resolve, 0));
        this.scrollToBottom();
     
        const images = messageDiv.getElementsByTagName('img');
        if (images.length > 0) {
            Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => img.onload = resolve);
            })).then(() => {
                this.scrollToBottom();
            });
        }
     }

    // Enhanced scrollToBottom method
    scrollToBottom() {
        if (this.chatContainer) {
            this.chatContainer.scrollTo({
                top: this.chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    }
  

    // Get message actions HTML
    getMessageActions(type) {
        if (type === 'user') {
            return `
                <div class="flex items-center justify-end gap-3 mt-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button class="message-action-btn" onclick="copyToClipboard(this)">
                        <i class="fas fa-copy text-xs"></i>
                        <span class="text-xs">Copy</span>
                    </button>
                </div>
            `;
        }
        return '';
    }

    // Show typing indicator
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.chatContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    // Hide typing indicator
    hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Process message and get response from server
    async processMessage(message) {
        try {
            this.showTypingIndicator();
            
            const response = await fetch(`/get?msg=${encodeURIComponent(message)}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            
            this.hideTypingIndicator();
            
            await this.addMessage({
                type: 'bot',
                content: data
            });
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.showToast('Failed to get response', 'error');
        }
    }

    // Voice recording handlers
    toggleVoiceRecording() {
        this.voiceModal.style.display = 'flex';
    }

    stopVoiceRecording() {
        this.voiceModal.style.display = 'none';
        this.showToast('Voice recording feature coming soon!', 'info');
    }

    // Handle file attachment
    handleAttachment() {
        this.showToast('File attachment coming soon!', 'info');
    }

    // Clear chat confirmation and execution
    async confirmClearChat() {
        const modal = document.getElementById('clearChatModal');
        const modalContainer = modal.querySelector('.modal-container');
        const cancelBtn = document.getElementById('cancelClear');
        const confirmBtn = document.getElementById('confirmClear');

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const closeModal = () => {
            modalContainer.classList.add('closing');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                modalContainer.classList.remove('closing');
            }, 300);
        };

        const handleConfirm = async () => {
            try {
                const response = await fetch('/clear_history', {
                    method: 'POST'
                });
                
                if (!response.ok) throw new Error('Failed to clear history');
                
                this.chatContainer.innerHTML = '';
                closeModal();
                this.showToast('Chat history cleared successfully', 'success');
            } catch (error) {
                console.error('Error:', error);
                this.showToast('Failed to clear chat history', 'error');
            }
        };

        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };

        cancelBtn.addEventListener('click', closeModal, { once: true });
        confirmBtn.addEventListener('click', handleConfirm, { once: true });
        modal.addEventListener('click', handleOutsideClick, { once: true });
    }

    // Mobile sidebar toggle
    toggleSidebar() {
        this.sidebar?.classList.toggle('active');
    }

    // Handle click outside sidebar
    handleOutsideClick(e) {
        if (this.sidebar?.classList.contains('active') && 
            !e.target.closest('.sidebar') && 
            !e.target.closest('.menu-btn')) {
            this.sidebar.classList.remove('active');
        }
    }

    // Toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate__animated animate__fadeInUp`;
        
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;

        const container = document.getElementById('toastContainer');
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('animate__fadeInUp');
            toast.classList.add('animate__fadeOutDown');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Get toast icon based on type
    getToastIcon(type) {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'exclamation-circle';
            case 'warning': return 'exclamation-triangle';
            default: return 'info-circle';
        }
    }
}

// Copy to clipboard function
function copyToClipboard(button) {
    const messageText = button.closest('.message').querySelector('p').textContent;
    navigator.clipboard.writeText(messageText)
        .then(() => {
            window.chatBot.showToast('Text copied to clipboard', 'success');
        })
        .catch(() => {
            window.chatBot.showToast('Failed to copy text', 'error');
        });
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle.querySelector('i');
        this.themeText = this.themeToggle.querySelector('.theme-text');
        this.init();
    }

    init() {
        // Set default theme to light jika tidak ada theme tersimpan
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            this.updateToggleUI(savedTheme);
        }

        this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateToggleUI(newTheme);
    }

    updateToggleUI(theme) {
        this.themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        this.themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.chatBot = new ChatBot();
    window.themeManager = new ThemeManager();
});