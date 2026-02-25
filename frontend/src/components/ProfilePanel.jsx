import { useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { FiX, FiEdit3, FiCheck, FiUser } from "react-icons/fi";

export default function ProfilePanel({ onClose }) {
    const { user, updateProfile, isLoading } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(user?.name || "");

    const handleSave = async () => {
        if (newName.trim() && newName !== user?.name) {
            await updateProfile({ newName: newName.trim() });
        }
        setIsEditing(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
                <div className="profile-header">
                    <h2>Profile</h2>
                    <button className="icon-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>
                <div className="profile-body">
                    <div className="profile-avatar-large">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="profile-field">
                        <label>Name</label>
                        {isEditing ? (
                            <div className="profile-edit-row">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    autoFocus
                                />
                                <button className="icon-btn" onClick={handleSave} disabled={isLoading}>
                                    <FiCheck />
                                </button>
                            </div>
                        ) : (
                            <div className="profile-value-row">
                                <span>{user?.name}</span>
                                <button className="icon-btn" onClick={() => setIsEditing(true)}>
                                    <FiEdit3 />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="profile-field">
                        <label>Email</label>
                        <div className="profile-value-row">
                            <span>{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
