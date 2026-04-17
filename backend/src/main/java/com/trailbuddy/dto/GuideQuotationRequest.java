package com.trailbuddy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class GuideQuotationRequest {

    @NotBlank
    private String curatedText;

    @NotNull
    private BigDecimal quotedAmount;

    public String getCuratedText() {
        return curatedText;
    }

    public void setCuratedText(String curatedText) {
        this.curatedText = curatedText;
    }

    public BigDecimal getQuotedAmount() {
        return quotedAmount;
    }

    public void setQuotedAmount(BigDecimal quotedAmount) {
        this.quotedAmount = quotedAmount;
    }
}
