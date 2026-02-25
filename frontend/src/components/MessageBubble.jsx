export default function MessageBubble({ message, isOwn, senderName }) {
    const time = new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className={`message-bubble-wrapper ${isOwn ? "own" : "other"}`}>
            <div className={`message-bubble ${isOwn ? "own" : "other"}`}>
                {senderName && !isOwn && (
                    <span className="message-sender">{senderName}</span>
                )}
                {message.image && (
                    <img src={message.image} alt="attachment" className="message-image" />
                )}
                {message.text && <p className="message-text">{message.text}</p>}
                <div className="message-meta">
                    <span className="message-time">{time}</span>
                    {isOwn && (
                        <span className="message-status">
                            {message.seenBy?.length > 1 ? "✓✓" : "✓"}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
