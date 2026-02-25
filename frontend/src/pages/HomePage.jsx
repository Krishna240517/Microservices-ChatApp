import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import NoChatSelected from "../components/NoChatSelected";
import useChatStore from "../store/useChatStore";
import useSocketStore from "../store/useSocketStore";
import useAuthStore from "../store/useAuthStore";

export default function HomePage() {
    const { activeConversation, fetchConversations, fetchAllUsers } = useChatStore();
    const { connectSocket, disconnectSocket } = useSocketStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchConversations();
        fetchAllUsers();
    }, [fetchConversations, fetchAllUsers]);

    useEffect(() => {
        if (user?._id) {
            connectSocket(user._id);
        }
        return () => disconnectSocket();
    }, [user?._id, connectSocket, disconnectSocket]);

    return (
        <div className="home-page">
            <div className="chat-container">
                <Sidebar />
                <div className="chat-main">
                    {activeConversation ? <ChatWindow /> : <NoChatSelected />}
                </div>
            </div>
        </div>
    );
}
