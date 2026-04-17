package com.trailbuddy.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpVerificationRequest {
    @NotBlank(message = "OTP is required")
    private String otp;

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}

