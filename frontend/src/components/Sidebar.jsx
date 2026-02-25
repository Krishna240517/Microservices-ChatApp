import { useState, useMemo } from "react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import ConversationItem from "./ConversationItem";
import CreateGroupModal from "./CreateGroupModal";
import ProfilePanel from "./ProfilePanel";
import { FiSearch, FiUsers, FiSettings, FiLogOut, FiPlus, FiX } from "react-icons/fi";

export default function Sidebar() {
    const { conversations, users, isLoadingConversations, createDirectConversation, setActiveConversation, fetchMessages, markAsSeen, fetchAllUsers } = useChatStore();
    const { user, logout } = useAuthStore();
    const { onlineUsers } = useSocketStore();
    const [searchQuery, setSearchQuery] = useState("");
    const [showNewChat, setShowNewChat] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        return conversations.filter((c) => {
            if (c.type === "group") {
                return c.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
            }
            const other = c.participants?.find((p) => p._id !== user?._id);
            return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [conversations, searchQuery, user?._id]);

    const filteredUsers = useMemo(() => {
        if (!userSearchQuery.trim()) return users;
        return users.filter((u) =>
            u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
        );
    }, [users, userSearchQuery]);

    const handleConversationClick = (conversation) => {
        setActiveConversation(conversation);
        fetchMessages(conversation._id);
        if (conversation.unreadCount > 0) {
            markAsSeen(conversation._id);
        }
    };

    const handleStartChat = async (otherUser) => {
        const conv = await createDirectConversation(otherUser._id);
        if (conv) {
            setShowNewChat(false);
            setUserSearchQuery("");
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <>
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-header-left">
                        <div className="user-avatar-small" onClick={() => setShowProfile(true)}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <h2>Chats</h2>
                    </div>
                    <div className="sidebar-header-actions">
                        <button className="icon-btn" onClick={() => { setShowNewChat(true); fetchAllUsers(); }} title="New Chat">
                            <FiPlus />
                        </button>
                        <button className="icon-btn" onClick={() => setShowGroupModal(true)} title="New Group">
                            <FiUsers />
                        </button>
                        <button className="icon-btn" onClick={handleLogout} title="Logout">
                            <FiLogOut />
                        </button>
                    </div>
                </div>

                <div className="sidebar-search">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {showNewChat && (
                    <div className="new-chat-panel">
                        <div className="new-chat-header">
                            <h3>New Chat</h3>
                            <button className="icon-btn" onClick={() => { setShowNewChat(false); setUserSearchQuery(""); }}>
                                <FiX />
                            </button>
                        </div>
                        <div className="sidebar-search">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="user-list">
                            {filteredUsers.map((u) => (
                                <div key={u._id} className="user-item" onClick={() => handleStartChat(u)}>
                                    <div className="user-avatar-small">
                                        {u.name?.charAt(0).toUpperCase()}
                                        {onlineUsers.includes(u._id) && <span className="online-dot" />}
                                    </div>
                                    <div className="user-item-info">
                                        <span className="user-item-name">{u.name}</span>
                                        <span className="user-item-email">{u.email}</span>
                                    </div>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && (
                                <p className="empty-state">No users found</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="conversation-list">
                    {isLoadingConversations ? (
                        <div className="loading-conversations">
                            <span className="spinner" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="empty-conversations">
                            <p>No conversations yet</p>
                            <p className="empty-subtitle">Start a new chat to begin messaging</p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <ConversationItem
                                key={conv._id}
                                conversation={conv}
                                onClick={() => handleConversationClick(conv)}
                                currentUserId={user?._id}
                                onlineUsers={onlineUsers}
                            />
                        ))
                    )}
                </div>
            </div>

            {showGroupModal && (
                <CreateGroupModal onClose={() => setShowGroupModal(false)} />
            )}
            {showProfile && (
                <ProfilePanel onClose={() => setShowProfile(false)} />
            )}
        </>
    );
}
