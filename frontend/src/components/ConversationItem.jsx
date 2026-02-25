import useSocketStore from "../store/useSocketStore";
import useChatStore from "../store/useChatStore";

export default function ConversationItem({ conversation, onClick, currentUserId, onlineUsers }) {
    const { typingUsers } = useSocketStore();
    const { activeConversation } = useChatStore();

    const isGroup = conversation.type === "group";
    const otherParticipant = !isGroup
        ? conversation.participants?.find((p) => p._id !== currentUserId)
        : null;

    const displayName = isGroup ? conversation.groupName : (otherParticipant?.name || "Unknown");
    const avatar = displayName?.charAt(0).toUpperCase();
    const isOnline = !isGroup && otherParticipant && onlineUsers.includes(otherParticipant._id);
    const isActive = activeConversation?._id === conversation._id;

    const typingInConv = typingUsers[conversation._id] || [];
    const isTyping = typingInConv.length > 0;

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        } else if (diffDays === 1) {
            return "Yesterday";
        } else if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: "short" });
        }
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    return (
        <div className={`conversation-item ${isActive ? "active" : ""}`} onClick={onClick}>
            <div className={`conversation-avatar ${isGroup ? "group-avatar" : ""}`}>
                {avatar}
                {isOnline && <span className="online-dot" />}
            </div>
            <div className="conversation-info">
                <div className="conversation-top">
                    <span className="conversation-name">{displayName}</span>
                    <span className="conversation-time">{formatTime(conversation.lastMessageAt)}</span>
                </div>
                <div className="conversation-bottom">
                    {isTyping ? (
                        <span className="typing-text">typing...</span>
                    ) : (
                        <span className="conversation-last-msg">
                            {conversation.lastMessage || "No messages yet"}
                        </span>
                    )}
                    {conversation.unreadCount > 0 && (
                        <span className="unread-badge">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
