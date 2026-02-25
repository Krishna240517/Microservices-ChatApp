import { FiMessageCircle } from "react-icons/fi";

export default function NoChatSelected() {
    return (
        <div className="no-chat-selected">
            <div className="no-chat-content">
                <div className="no-chat-icon">
                    <FiMessageCircle />
                </div>
                <h2>ChatApp Web</h2>
                <p>Send and receive messages instantly.</p>
                <p className="no-chat-hint">Select a conversation from the sidebar or start a new chat.</p>
            </div>
        </div>
    );
}
