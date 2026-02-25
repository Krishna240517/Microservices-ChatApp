import { useState, useRef, useCallback, useEffect } from "react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";
import useSocketStore from "../store/useSocketStore";
import { FiSend, FiSmile } from "react-icons/fi";

export default function MessageInput() {
    const [text, setText] = useState("");
    const { activeConversation, sendMessage } = useChatStore();
    const { user } = useAuthStore();
    const { emitTyping, emitStopTyping } = useSocketStore();
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);
    const inputRef = useRef(null);

    const getReceiverIds = useCallback(() => {
        if (!activeConversation?.participants) return [];
        return activeConversation.participants
            .filter((p) => p._id !== user?._id)
            .map((p) => p._id);
    }, [activeConversation, user?._id]);

    const handleTyping = useCallback(() => {
        const receiverIds = getReceiverIds();
        if (receiverIds.length === 0) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            emitTyping(activeConversation._id, receiverIds);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            emitStopTyping(activeConversation._id, receiverIds);
        }, 2000);
    }, [activeConversation, emitTyping, emitStopTyping, getReceiverIds]);

    // Cleanup typing timeout on unmount or conversation change
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTypingRef.current) {
                const receiverIds = getReceiverIds();
                emitStopTyping(activeConversation?._id, receiverIds);
                isTypingRef.current = false;
            }
        };
    }, [activeConversation?._id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !activeConversation) return;

        // Stop typing indicator
        if (isTypingRef.current) {
            const receiverIds = getReceiverIds();
            emitStopTyping(activeConversation._id, receiverIds);
            isTypingRef.current = false;
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }

        await sendMessage(activeConversation._id, { text: text.trim() });
        setText("");
        inputRef.current?.focus();
    };

    return (
        <form className="message-input" onSubmit={handleSend}>
            <div className="message-input-container">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        handleTyping();
                    }}
                    autoFocus
                />
                <button
                    type="submit"
                    className={`send-btn ${text.trim() ? "active" : ""}`}
                    disabled={!text.trim()}
                >
                    <FiSend />
                </button>
            </div>
        </form>
    );
}
