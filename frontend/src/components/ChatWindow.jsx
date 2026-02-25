import { useEffect, useRef } from "react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { FiArrowLeft, FiUsers } from "react-icons/fi";

export default function ChatWindow() {
    const { activeConversation, messages, isLoadingMessages, setActiveConversation } = useChatStore();
    const { user } = useAuthStore();
    const { onlineUsers, typingUsers } = useSocketStore();
    const messageEndRef = useRef(null);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!activeConversation) return null;

    const isGroup = activeConversation.type === "group";
    const otherParticipant = !isGroup
        ? activeConversation.participants?.find((p) => p._id !== user?._id)
        : null;
    const displayName = isGroup ? activeConversation.groupName : (otherParticipant?.name || "Unknown");
    const isOnline = !isGroup && otherParticipant && onlineUsers.includes(otherParticipant._id);

    const typingInConv = typingUsers[activeConversation._id] || [];
    const typingNames = typingInConv
        .map((id) => {
            const p = activeConversation.participants?.find((p) => p._id === id);
            return p?.name?.split(" ")[0] || "Someone";
        });

    const getStatusText = () => {
        if (typingNames.length > 0) {
            return typingNames.join(", ") + (typingNames.length === 1 ? " is typing..." : " are typing...");
        }
        if (isGroup) {
            const count = activeConversation.participants?.length || 0;
            return `${count} participants`;
        }
        return isOnline ? "Online" : "Offline";
    };

    return (
        <div className="chat-window">
            <div className="chat-header">
                <button className="back-btn" onClick={() => setActiveConversation(null)}>
                    <FiArrowLeft />
                </button>
                <div className={`chat-header-avatar ${isGroup ? "group-avatar" : ""}`}>
                    {isGroup ? <FiUsers /> : displayName?.charAt(0).toUpperCase()}
                    {isOnline && <span className="online-dot" />}
                </div>
                <div className="chat-header-info">
                    <h3>{displayName}</h3>
                    <span className={`chat-status ${isOnline ? "online" : ""} ${typingNames.length > 0 ? "typing" : ""}`}>
                        {getStatusText()}
                    </span>
                </div>
            </div>

            <div className="messages-container">
                {isLoadingMessages ? (
                    <div className="loading-messages">
                        <span className="spinner" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-messages">
                        <p>No messages yet</p>
                        <p className="empty-subtitle">Send a message to start the conversation</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => {
                            const prevMsg = messages[idx - 1];
                            const showDateSeparator = !prevMsg ||
                                new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                            return (
                                <div key={msg._id}>
                                    {showDateSeparator && (
                                        <div className="date-separator">
                                            <span>{formatDateSeparator(msg.createdAt)}</span>
                                        </div>
                                    )}
                                    <MessageBubble
                                        message={msg}
                                        isOwn={msg.senderId === user?._id}
                                        senderName={
                                            isGroup
                                                ? activeConversation.participants?.find((p) => p._id === msg.senderId)?.name
                                                : null
                                        }
                                    />
                                </div>
                            );
                        })}
                        <div ref={messageEndRef} />
                    </>
                )}
            </div>

            <MessageInput />
        </div>
    );
}

function formatDateSeparator(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
