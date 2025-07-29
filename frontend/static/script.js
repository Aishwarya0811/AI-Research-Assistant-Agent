class ResearchApp {
    constructor() {
        this.apiUrl = window.location.origin;
        this.currentStep = 1;
        this.loadingMessages = [
            "Analyzing your question...",
            "Breaking down into research areas...",
            "Searching the web for information...",
            "Processing search results...",
            "Generating comprehensive summary...",
            "Finalizing research report..."
        ];
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('researchForm');
        this.questionInput = document.getElementById('researchQuestion');
        this.maxResultsSelect = document.getElementById('maxResults');
        this.submitBtn = document.getElementById('submitBtn');
        
        // Section elements
        this.loadingSection = document.getElementById('loadingSection');
        this.resultsSection = document.getElementById('resultsSection');
        this.errorSection = document.getElementById('errorSection');
        
        // Loading elements
        this.loadingStage = document.getElementById('loadingStage');
        this.progressSteps = document.querySelectorAll('.step');
        
        // Results elements
        this.originalQuestion = document.getElementById('originalQuestion');
        this.subQuestionsList = document.getElementById('subQuestionsList');
        this.summaryContent = document.getElementById('summaryContent');
        this.sourcesList = document.getElementById('sourcesList');
        
        // Button elements
        this.newSearchBtn = document.getElementById('newSearchBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.errorMessage = document.getElementById('errorMessage');
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.newSearchBtn.addEventListener('click', () => this.resetForm());
        this.retryBtn.addEventListener('click', () => this.resetForm());
        
        // Auto-resize textarea
        this.questionInput.addEventListener('input', () => {
            this.questionInput.style.height = 'auto';
            this.questionInput.style.height = this.questionInput.scrollHeight + 'px';
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const question = this.questionInput.value.trim();
        const maxResults = parseInt(this.maxResultsSelect.value);
        
        if (!question) {
            this.showError('Please enter a research question.');
            return;
        }

        this.startResearch(question, maxResults);
    }

    async startResearch(question, maxResults) {
        this.showLoading();
        this.resetProgress();
        
        try {
            // Start the loading animation
            this.startLoadingAnimation();
            
            const response = await fetch(`${this.apiUrl}/api/research`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    max_results: maxResults
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.displayResults(data);
            
        } catch (error) {
            console.error('Research error:', error);
            this.showError(
                error.message.includes('fetch') 
                    ? 'Unable to connect to the research service. Please check your connection and try again.'
                    : `Research failed: ${error.message}`
            );
        }
    }

    startLoadingAnimation() {
        let messageIndex = 0;
        let stepIndex = 1;
        
        // Update loading message every 3 seconds
        const messageInterval = setInterval(() => {
            if (messageIndex < this.loadingMessages.length) {
                this.loadingStage.textContent = this.loadingMessages[messageIndex];
                messageIndex++;
            }
        }, 3000);
        
        // Update progress step every 5 seconds
        const stepInterval = setInterval(() => {
            if (stepIndex <= 4) {
                this.updateProgressStep(stepIndex);
                stepIndex++;
            }
        }, 5000);
        
        // Store intervals to clear them later
        this.messageInterval = messageInterval;
        this.stepInterval = stepInterval;
    }

    updateProgressStep(step) {
        // Remove active class from all steps
        this.progressSteps.forEach(stepEl => stepEl.classList.remove('active'));
        
        // Add active class to current step
        const currentStepEl = document.querySelector(`[data-step="${step}"]`);
        if (currentStepEl) {
            currentStepEl.classList.add('active');
        }
    }

    displayResults(data) {
        this.hideAllSections();
        
        // Clear any intervals
        if (this.messageInterval) clearInterval(this.messageInterval);
        if (this.stepInterval) clearInterval(this.stepInterval);
        
        // Populate results
        this.originalQuestion.textContent = data.question;
        
        // Display sub-questions
        this.subQuestionsList.innerHTML = '';
        data.sub_questions.forEach(subQ => {
            const li = document.createElement('li');
            li.textContent = subQ;
            this.subQuestionsList.appendChild(li);
        });
        
        // Display summary with formatting
        this.summaryContent.innerHTML = this.formatSummary(data.summary);
        
        // Display sources
        this.sourcesList.innerHTML = '';
        data.sources.forEach(source => {
            const sourceDiv = this.createSourceElement(source);
            this.sourcesList.appendChild(sourceDiv);
        });
        
        this.resultsSection.classList.remove('hidden');
        
        // Scroll to results
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    formatSummary(summary) {
        // Convert line breaks to paragraphs and format citations
        return summary
            .split('\n\n')
            .map(paragraph => {
                if (paragraph.trim()) {
                    // Format source citations
                    const formatted = paragraph.replace(
                        /\[Source (\d+)\]/g, 
                        '<span class="citation">[Source $1]</span>'
                    );
                    return `<p>${formatted}</p>`;
                }
                return '';
            })
            .join('');
    }

    createSourceElement(source) {
        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'source-item';
        
        sourceDiv.innerHTML = `
            <div class="source-title">
                <a href="${source.url}" target="_blank" rel="noopener noreferrer">
                    ${source.title}
                </a>
            </div>
            <div class="source-snippet">${source.snippet}</div>
        `;
        
        return sourceDiv;
    }

    showLoading() {
        this.hideAllSections();
        this.loadingSection.classList.remove('hidden');
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Researching...';
    }

    showError(message) {
        this.hideAllSections();
        this.errorMessage.textContent = message;
        this.errorSection.classList.remove('hidden');
        this.resetSubmitButton();
        
        // Clear any intervals
        if (this.messageInterval) clearInterval(this.messageInterval);
        if (this.stepInterval) clearInterval(this.stepInterval);
    }

    hideAllSections() {
        this.loadingSection.classList.add('hidden');
        this.resultsSection.classList.add('hidden');
        this.errorSection.classList.add('hidden');
    }

    resetForm() {
        this.hideAllSections();
        this.resetSubmitButton();
        this.questionInput.focus();
        
        // Clear any intervals
        if (this.messageInterval) clearInterval(this.messageInterval);
        if (this.stepInterval) clearInterval(this.stepInterval);
    }

    resetSubmitButton() {
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = '<i class="fas fa-search"></i> Start Research';
    }

    resetProgress() {
        this.progressSteps.forEach(step => step.classList.remove('active'));
        this.progressSteps[0].classList.add('active');
        this.loadingStage.textContent = this.loadingMessages[0];
    }
}

// Health check function
async function checkApiHealth() {
    try {
        const response = await fetch(`${window.location.origin}/api/health`);
        if (response.ok) {
            console.log('✅ API is healthy');
        } else {
            console.warn('⚠️ API health check failed');
        }
    } catch (error) {
        console.error('❌ API is not accessible:', error);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 AI Research Assistant initialized');
    
    // Check API health
    checkApiHealth();
    
    // Initialize the main app
    window.researchApp = new ResearchApp();
    
    // Add some nice console styling
    console.log('%cWelcome to AI Research Assistant!', 
        'color: #667eea; font-size: 16px; font-weight: bold;');
    console.log('This application uses OpenAI GPT-4 and SerpAPI to conduct comprehensive research.');
});

// Add CSS for citation styling
const style = document.createElement('style');
style.textContent = `
    .citation {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.9em;
    }
`;
document.head.appendChild(style);