import { useState, useRef, useEffect } from "react";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { FiShield } from "react-icons/fi";

export default function VerifyOtpPage() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
    const { verifyOtp, pendingEmail, isLoading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!pendingEmail) {
            navigate("/signup");
        }
    }, [pendingEmail, navigate]);

    const handleChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);
        const newOtp = [...otp];
        pastedData.split("").forEach((char, i) => {
            if (i < 6) newOtp[i] = char;
        });
        setOtp(newOtp);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpString = otp.join("");
        if (otpString.length !== 6) return;

        const result = await verifyOtp({ email: pendingEmail, otp: otpString });
        if (result?.success) {
            navigate("/");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo otp-logo">
                        <FiShield />
                    </div>
                    <h1>Verify OTP</h1>
                    <p>Enter the 6-digit code sent to <strong>{pendingEmail}</strong></p>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="otp-inputs">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="otp-input"
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>
                    <button type="submit" className="auth-btn" disabled={isLoading || otp.join("").length !== 6}>
                        {isLoading ? <span className="spinner" /> : "Verify"}
                    </button>
                </form>
            </div>
        </div>
    );
}
