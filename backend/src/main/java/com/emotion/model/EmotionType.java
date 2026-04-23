package com.emotion.model;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum EmotionType {
    ANGRY(0, "愤怒", "Angry"),
    DISGUST(1, "厌恶", "Disgust"),
    FEAR(2, "恐惧", "Fear"),
    HAPPY(3, "开心", "Happy"),
    SAD(4, "悲伤", "Sad"),
    SURPRISE(5, "惊讶", "Surprise"),
    NEUTRAL(6, "中性", "Neutral");

    private final int index;
    private final String zhName;
    private final String enName;

    public static EmotionType fromIndex(int index) {
        for (EmotionType type : values()) {
            if (type.index == index) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid emotion index: " + index);
    }
}
