import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { createDirectConversation, createGroupConversation, getUserConversations, sendMessage, getMessages, markConversationAsSeen, addMember, removeMember, leaveGroup, getAllUsers, searchUsers, getLastSeen } from "../controllers/chat.controller.js";
import { upload } from "../config/multer.js";
const router = express.Router();


router.get("/users", isAuth, getAllUsers);
router.get("/users/search", isAuth, searchUsers);
router.get("/users/last-seen/:userId", isAuth, getLastSeen);


router.post("/direct/:id", isAuth, createDirectConversation);
router.post("/group", isAuth, createGroupConversation);
router.get("/conversations", isAuth, getUserConversations);
router.post("/message/:id", isAuth, upload.single('image'), sendMessage);
router.get("/message/:id", isAuth, getMessages);
router.put("/seen/:id", isAuth, markConversationAsSeen);

router.put("/group/add/:id", isAuth, addMember);
router.put("/group/remove/:conversationId/:userId", isAuth, removeMember);
router.put("/group/delete/:id", isAuth, leaveGroup);

export default router;