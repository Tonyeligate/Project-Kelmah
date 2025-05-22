class WebSocketService {
    constructor() {
        this.ws = null;
        this.subscribers = new Set();
    }

    connect(userId, token) {
        this.ws = new WebSocket(`ws://your-backend-url/ws?token=${token}`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.subscribers.forEach(callback => callback(data));
        };

        this.ws.onclose = () => {
            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.connect(userId, token), 5000);
        };
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    sendMessage(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
}

export const wsService = new WebSocketService(); 