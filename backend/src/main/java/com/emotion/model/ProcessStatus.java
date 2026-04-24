package com.emotion.model;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 进程状态 DTO - 用于描述嵌入式项目的运行状态
 */
@Data
@AllArgsConstructor
public class ProcessStatus {

    /**
     * 进程状态枚举
     */
    public enum State { STOPPED, STARTING, RUNNING, STOPPING, ERROR }

    private State state;
    private String message;
    private Integer pid;

    /**
     * 创建已停止状态
     */
    public static ProcessStatus stopped() {
        return new ProcessStatus(State.STOPPED, "Stopped", null);
    }

    /**
     * 创建启动中状态
     */
    public static ProcessStatus starting() {
        return new ProcessStatus(State.STARTING, "Starting...", null);
    }

    /**
     * 创建运行中状态
     */
    public static ProcessStatus running(int pid) {
        return new ProcessStatus(State.RUNNING, "Running", pid);
    }

    /**
     * 创建停止中状态
     */
    public static ProcessStatus stopping() {
        return new ProcessStatus(State.STOPPING, "Stopping...", null);
    }

    /**
     * 创建错误状态
     */
    public static ProcessStatus error(String msg) {
        return new ProcessStatus(State.ERROR, msg, null);
    }
}
