import { create } from "zustand";
import { USER_API } from "../lib/axios";
import toast from "react-hot-toast";

const useAuthStore = create((set, get) => ({
    user: null,
    isLoading: false,
    isCheckingAuth: true,
    pendingEmail: null, // for OTP flow

    signup: async (data) => {
        set({ isLoading: true });
        try {
            const res = await USER_API.post("/signup", data);
            set({ pendingEmail: data.email });
            toast.success(res.data.msg);
            return { success: true, needsOtp: true };
        } catch (err) {
            const msg = err.response?.data?.msg || "Signup failed";
            toast.error(msg);
            return { success: false };
        } finally {
            set({ isLoading: false });
        }
    },

    verifyOtp: async (data) => {
        set({ isLoading: true });
        try {
            const res = await USER_API.post("/verify-otp", data);
            set({ user: res.data.user, pendingEmail: null });
            toast.success(res.data.msg);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.msg || "OTP verification failed";
            toast.error(msg);
            return { success: false };
        } finally {
            set({ isLoading: false });
        }
    },

    login: async (data) => {
        set({ isLoading: true });
        try {
            const res = await USER_API.post("/login", data);
            if (res.status === 200) {
                set({ user: res.data.user });
                toast.success(res.data.msg);
                return { success: true };
            }
        } catch (err) {
            const msg = err.response?.data?.msg || "Login failed";
            if (err.response?.status === 403) {
                // Account not verified
                set({ pendingEmail: data.email });
                toast.error(msg);
                return { success: false, needsOtp: true };
            }
            toast.error(msg);
            return { success: false };
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        try {
            await USER_API.post("/logout");
            set({ user: null });
            toast.success("Logged out");
        } catch (err) {
            toast.error("Logout failed");
        }
    },

    checkAuth: async () => {
        set({ isCheckingAuth: true });
        try {
            const res = await USER_API.get("/profile");
            set({ user: res.data });
        } catch {
            set({ user: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    updateProfile: async (data) => {
        set({ isLoading: true });
        try {
            const res = await USER_API.patch("/update", data);
            set({ user: { ...get().user, name: res.data.name } });
            toast.success(res.data.msg);
        } catch (err) {
            toast.error(err.response?.data?.msg || "Update failed");
        } finally {
            set({ isLoading: false });
        }
    },
}));

export default useAuthStore;
