import { create } from "zustand";
import { io } from "socket.io-client";
import useChatStore from "./useChatStore";

const SOCKET_URL = "http://localhost:5002";

const useSocketStore = create((set, get) => ({
    socket: null,
    onlineUsers: [],
    typingUsers: {}, // { conversationId: [userId1, userId2] }

    connectSocket: (userId) => {
        const existingSocket = get().socket;
        if (existingSocket?.connected) return;

        const newSocket = io(SOCKET_URL, {
            auth: { userId },
            withCredentials: true,
        });

        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
        });

        newSocket.on("getOnlineUsers", (users) => {
            set({ onlineUsers: users });
        });

        newSocket.on("newMessage", (data) => {
            useChatStore.getState().handleNewMessage(data);
        });

        newSocket.on("conversationUpdated", (data) => {
            useChatStore.getState().handleConversationUpdated(data);
        });

        newSocket.on("newConversation", (conversation) => {
            useChatStore.getState().handleNewConversation(conversation);
        });

        newSocket.on("removedFromGroup", (data) => {
            useChatStore.getState().handleRemovedFromGroup(data);
        });

        newSocket.on("messageSeen", (data) => {
            const chatStore = useChatStore.getState();
            if (chatStore.activeConversation?._id === data.conversationId) {
                // Update seenBy on messages in active conversation
                useChatStore.setState((state) => ({
                    messages: state.messages.map((m) =>
                        m.seenBy && !m.seenBy.includes(data.seenBy)
                            ? { ...m, seenBy: [...m.seenBy, data.seenBy] }
                            : m
                    ),
                }));
            }
        });

        newSocket.on("userTyping", (data) => {
            set((state) => {
                const current = state.typingUsers[data.conversationId] || [];
                if (current.includes(data.userId)) return state;
                return {
                    typingUsers: {
                        ...state.typingUsers,
                        [data.conversationId]: [...current, data.userId],
                    },
                };
            });
        });

        newSocket.on("userStopTyping", (data) => {
            set((state) => {
                const current = state.typingUsers[data.conversationId] || [];
                return {
                    typingUsers: {
                        ...state.typingUsers,
                        [data.conversationId]: current.filter((id) => id !== data.userId),
                    },
                };
            });
        });

        set({ socket: newSocket });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null, onlineUsers: [], typingUsers: {} });
        }
    },

    emitTyping: (conversationId, receiverIds) => {
        const socket = get().socket;
        if (socket) {
            socket.emit("typing", { conversationId, receiverIds });
        }
    },

    emitStopTyping: (conversationId, receiverIds) => {
        const socket = get().socket;
        if (socket) {
            socket.emit("stopTyping", { conversationId, receiverIds });
        }
    },
}));

export default useSocketStore;
