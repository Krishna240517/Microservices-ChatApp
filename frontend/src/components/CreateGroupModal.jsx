import { useState } from "react";
import useChatStore from "../store/useChatStore";
import useSocketStore from "../store/useSocketStore";
import { FiX, FiSearch, FiCheck } from "react-icons/fi";

export default function CreateGroupModal({ onClose }) {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const { users, createGroupConversation } = useChatStore();
    const { onlineUsers } = useSocketStore();

    const filteredUsers = users.filter((u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleUser = (user) => {
        setSelectedUsers((prev) =>
            prev.find((u) => u._id === user._id)
                ? prev.filter((u) => u._id !== user._id)
                : [...prev, user]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        await createGroupConversation(
            groupName.trim(),
            selectedUsers.map((u) => u._id)
        );
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>New Group</h2>
                    <button className="icon-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>
                <div className="modal-body">
                    <input
                        type="text"
                        className="modal-input"
                        placeholder="Group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        autoFocus
                    />

                    {selectedUsers.length > 0 && (
                        <div className="selected-users">
                            {selectedUsers.map((u) => (
                                <span key={u._id} className="selected-chip" onClick={() => toggleUser(u)}>
                                    {u.name} <FiX size={12} />
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="modal-search">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search users to add..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="modal-user-list">
                        {filteredUsers.map((u) => {
                            const isSelected = selectedUsers.find((s) => s._id === u._id);
                            return (
                                <div
                                    key={u._id}
                                    className={`user-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => toggleUser(u)}
                                >
                                    <div className="user-avatar-small">
                                        {u.name?.charAt(0).toUpperCase()}
                                        {onlineUsers.includes(u._id) && <span className="online-dot" />}
                                    </div>
                                    <div className="user-item-info">
                                        <span className="user-item-name">{u.name}</span>
                                        <span className="user-item-email">{u.email}</span>
                                    </div>
                                    {isSelected && (
                                        <FiCheck className="check-icon" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button
                        className="create-btn"
                        onClick={handleCreate}
                        disabled={!groupName.trim() || selectedUsers.length === 0}
                    >
                        Create Group ({selectedUsers.length})
                    </button>
                </div>
            </div>
        </div>
    );
}
