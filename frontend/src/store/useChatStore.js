import { create } from "zustand";
import { CHAT_API } from "../lib/axios";
import toast from "react-hot-toast";

const useChatStore = create((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    users: [],
    isLoadingConversations: false,
    isLoadingMessages: false,
    isLoadingUsers: false,

    fetchConversations: async () => {
        set({ isLoadingConversations: true });
        try {
            const res = await CHAT_API.get("/conversations");
            set({ conversations: res.data });
        } catch (err) {
            console.error("Failed to fetch conversations", err);
        } finally {
            set({ isLoadingConversations: false });
        }
    },

    setActiveConversation: (conversation) => {
        set({ activeConversation: conversation, messages: [] });
    },

    fetchMessages: async (conversationId) => {
        set({ isLoadingMessages: true });
        try {
            const res = await CHAT_API.get(`/message/${conversationId}`);
            set({ messages: res.data.messages });
        } catch (err) {
            console.error("Failed to fetch messages", err);
        } finally {
            set({ isLoadingMessages: false });
        }
    },

    sendMessage: async (conversationId, messageData) => {
        try {
            const res = await CHAT_API.post(`/message/${conversationId}`, messageData);
            set((state) => ({
                messages: [...state.messages, res.data.message],
            }));

            // Update conversation in list
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c._id === conversationId
                        ? { ...c, lastMessage: messageData.text || "📷 Image", lastMessageAt: new Date().toISOString(), unreadCount: 0 }
                        : c
                ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)),
            }));
        } catch (err) {
            toast.error("Failed to send message");
        }
    },

    markAsSeen: async (conversationId) => {
        try {
            await CHAT_API.put(`/seen/${conversationId}`);
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    c._id === conversationId ? { ...c, unreadCount: 0 } : c
                ),
            }));
        } catch (err) {
            console.error("Failed to mark as seen", err);
        }
    },

    createDirectConversation: async (userId) => {
        try {
            const res = await CHAT_API.post(`/direct/${userId}`);
            // Refresh conversations to get populated data
            await get().fetchConversations();
            return res.data;
        } catch (err) {
            toast.error("Failed to create conversation");
            return null;
        }
    },

    createGroupConversation: async (groupName, participantIds) => {
        try {
            const res = await CHAT_API.post("/group", { groupName, participantIds });
            await get().fetchConversations();
            return res.data;
        } catch (err) {
            toast.error("Failed to create group");
            return null;
        }
    },

    fetchAllUsers: async () => {
        set({ isLoadingUsers: true });
        try {
            const res = await CHAT_API.get("/users");
            set({ users: res.data });
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            set({ isLoadingUsers: false });
        }
    },

    searchUsers: async (query) => {
        try {
            const res = await CHAT_API.get(`/users/search?q=${encodeURIComponent(query)}`);
            return res.data;
        } catch (err) {
            return [];
        }
    },

    // Socket handlers
    handleNewMessage: (data) => {
        const { activeConversation } = get();
        if (activeConversation && activeConversation._id === data.conversationId) {
            set((state) => ({
                messages: [...state.messages, data.message],
            }));
            // Auto mark as seen
            get().markAsSeen(data.conversationId);
        }

        // Update conversations list
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c._id === data.conversationId
                    ? {
                        ...c,
                        lastMessage: data.message.text || "📷 Image",
                        lastMessageAt: data.message.createdAt,
                        unreadCount: activeConversation?._id === data.conversationId ? 0 : (c.unreadCount || 0) + 1,
                    }
                    : c
            ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)),
        }));
    },

    handleConversationUpdated: (data) => {
        const { activeConversation } = get();
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c._id === data.conversationId
                    ? {
                        ...c,
                        lastMessage: data.lastMessage,
                        lastMessageAt: data.lastMessageAt,
                        unreadCount: activeConversation?._id === data.conversationId ? 0 : data.unreadCount,
                    }
                    : c
            ),
        }));
    },

    handleNewConversation: (conversation) => {
        set((state) => {
            const exists = state.conversations.find((c) => c._id === conversation._id);
            if (exists) return state;
            return { conversations: [conversation, ...state.conversations] };
        });
        // Refresh to get populated data
        get().fetchConversations();
    },

    handleRemovedFromGroup: (data) => {
        set((state) => ({
            conversations: state.conversations.filter((c) => c._id !== data.conversationId),
            activeConversation: state.activeConversation?._id === data.conversationId ? null : state.activeConversation,
        }));
    },
}));

export default useChatStore;
