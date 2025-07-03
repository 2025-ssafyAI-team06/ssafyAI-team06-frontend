import "regenerator-runtime/runtime"; // if needed for async/await in older browsers

const chatContainer = document.getElementById("chat-container");
const messageForm = document.getElementById("message-form");
const userInput = document.getElementById("user-input");
const newChatBtn = document.getElementById("new-chat-btn");
const welcomeMessage = document.getElementById("welcome-message");
const apiSelector = document.getElementById("api-selector");
const footballBtn = document.getElementById("football-btn");
const goalPost = document.getElementById("goal-post");

const BASE_URL = process.env.API_ENDPOINT

// Auto-resize textarea
function autoResizeTextarea() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

userInput.addEventListener('input', autoResizeTextarea);

// Handle Enter key for sending message
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});

// Quick question handlers
document.addEventListener('click', (e) => {
    if (e.target.closest('.quick-question')) {
        const button = e.target.closest('.quick-question');
        const question = button.dataset.question;
        if (question) {
            userInput.value = question;
            autoResizeTextarea();
            messageForm.dispatchEvent(new Event('submit'));
        }
    }
});

// 메시지 창 생성
function createMessageBubble(content, sender = "user") {
    const wrapper = document.createElement("div");
    wrapper.classList.add("mb-6", "flex", "items-start", "space-x-4", "animate-fade-in");

    const avatar = document.createElement("div");
    avatar.classList.add(
        "w-12",
        "h-12",
        "rounded-full",
        "flex-shrink-0",
        "flex",
        "items-center",
        "justify-center",
        "font-bold",
        "text-white",
        "shadow-lg"
    );

    if (sender === "assistant") {
        avatar.classList.add("bg-gradient-to-br", "from-green-500", "to-green-600");
        avatar.innerHTML = '<i class="fas fa-futbol"></i>';
    } else {
        avatar.classList.add("bg-gradient-to-br", "from-blue-500", "to-blue-600");
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    }

    const bubble = document.createElement("div");
    bubble.classList.add(
        "max-w-full",
        "md:max-w-3xl",
        "p-4",
        "rounded-2xl",
        "whitespace-pre-wrap",
        "leading-relaxed",
        "shadow-md",
        "backdrop-blur-sm"
    );

    if (sender === "assistant") {
        bubble.classList.add("bg-white/90", "text-gray-800", "border", "border-green-100");
    } else {
        bubble.classList.add("bg-gradient-to-r", "from-blue-500", "to-blue-600", "text-white");
    }

    // Format content with markdown-like formatting
    const formattedContent = formatMessage(content);
    bubble.innerHTML = formattedContent;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    return wrapper;
}

function formatMessage(content) {
    // Simple markdown-like formatting
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
}

function createLoadingMessage() {
    const wrapper = document.createElement("div");
    wrapper.classList.add("mb-6", "flex", "items-start", "space-x-4", "animate-fade-in");
    wrapper.id = "loading-message";

    const avatar = document.createElement("div");
    avatar.classList.add(
        "w-12",
        "h-12",
        "rounded-full",
        "flex-shrink-0",
        "flex",
        "items-center",
        "justify-center",
        "font-bold",
        "text-white",
        "shadow-lg",
        "bg-gradient-to-br",
        "from-green-500",
        "to-green-600"
    );
    avatar.innerHTML = '<i class="fas fa-futbol"></i>';

    const bubble = document.createElement("div");
    bubble.classList.add(
        "max-w-full",
        "md:max-w-3xl",
        "p-4",
        "rounded-2xl",
        "bg-white/90",
        "text-gray-800",
        "border",
        "border-green-100",
        "shadow-md",
        "backdrop-blur-sm"
    );
    
    bubble.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
            <span class="text-gray-600">월드컵 정보를 찾고 있습니다...</span>
        </div>
    `;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    return wrapper;
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Goal animation function
function playGoalAnimation() {
    // Create a clone of the football for animation
    const footballClone = footballBtn.cloneNode(true);
    footballClone.style.position = 'absolute';
    footballClone.style.zIndex = '1000';
    footballClone.style.pointerEvents = 'none';
    
    // Get the position of the original football
    const rect = footballBtn.getBoundingClientRect();
    const container = footballBtn.parentElement;
    const containerRect = container.getBoundingClientRect();
    
    footballClone.style.left = (rect.left - containerRect.left) + 'px';
    footballClone.style.top = (rect.top - containerRect.top) + 'px';
    
    container.appendChild(footballClone);
    
    // Start the animation
    footballClone.classList.add('goal-animation');
    
    // Shake the goal net
    goalPost.classList.add('net-shake');
    
    // Clean up after animation
    setTimeout(() => {
        footballClone.remove();
        goalPost.classList.remove('net-shake');
    }, 800);
}

async function getAssistantResponse(userMessage) {
    const url = `${BASE_URL}/chat`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({"message": userMessage}),
    });

    if (!response.ok) {
        throw new Error("Network response was not ok");
    }

    const data = await response.json();
    if (typeof data === "string") return data;
    return data.reply ?? '답변을 받아오지 못했습니다.';
}

messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Play goal animation
    playGoalAnimation();

    // Hide welcome message
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }

    // Add user message
    chatContainer.appendChild(createMessageBubble(message, "user"));

    // Clear input and reset height
    userInput.value = "";
    userInput.style.height = 'auto';
    scrollToBottom();

    // Add loading message
    const loadingMessage = createLoadingMessage();
    chatContainer.appendChild(loadingMessage);
    scrollToBottom();

    try {
        const response = await getAssistantResponse(message);
        
        // Remove loading message
        const loadingElement = document.getElementById("loading-message");
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // Add assistant response
        chatContainer.appendChild(createMessageBubble(response, "assistant"));
        scrollToBottom();
    } catch (error) {
        console.error("Error fetching assistant response:", error);
        
        // Remove loading message
        const loadingElement = document.getElementById("loading-message");
        if (loadingElement) {
            loadingElement.remove();
        }
        
        const errMsg = "죄송합니다. 응답을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        chatContainer.appendChild(createMessageBubble(errMsg, "assistant"));
        scrollToBottom();
    }
});

newChatBtn.addEventListener("click", async () => {
    // Clear UI
    chatContainer.innerHTML = "";
    
    // Show welcome message again
    if (welcomeMessage) {
        welcomeMessage.style.display = 'block';
        chatContainer.appendChild(welcomeMessage);
    }
    
    // Reset textarea
    userInput.style.height = 'auto';
});

console.log("월드컵 정보 어시스턴트가 시작되었습니다.");