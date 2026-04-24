package com.emotion.service;

import com.emotion.entity.Project;
import com.emotion.model.ProcessStatus;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 项目进程管理器 - 管理嵌入式项目进程的生命周期
 * 服务器只有 2GB 内存，因此同一时间只允许运行一个项目
 */
@Slf4j
@Service
public class ProjectProcessManager {

    /** 空闲超时：10 分钟 */
    private static final long IDLE_TIMEOUT_MS = 10 * 60 * 1000L;
    /** 健康检查超时：60 秒 */
    private static final long HEALTH_CHECK_TIMEOUT_MS = 60 * 1000L;
    /** 优雅关闭等待时间：5 秒 */
    private static final long SHUTDOWN_WAIT_MS = 5000L;

    private final Map<Long, ProcessInfo> runningProcesses = new ConcurrentHashMap<>();

    /**
     * 进程信息内部类
     */
    @Data
    private static class ProcessInfo {
        private Process process;
        private final long startTime;
        private volatile long lastAccessTime;
        private volatile ProcessStatus.State state;
        private volatile String message;

        public ProcessInfo(long startTime) {
            this.startTime = startTime;
        }
    }

    /**
     * 启动项目进程
     * 如果有其他项目在运行，先将其停止（受限于服务器内存）
     */
    public synchronized ProcessStatus startProject(Long projectId, Project project) {
        // 检查是否有其他项目正在运行，如有则先停止
        for (Map.Entry<Long, ProcessInfo> entry : runningProcesses.entrySet()) {
            if (!entry.getKey().equals(projectId)) {
                log.info("停止项目 {} 以释放资源给项目 {}", entry.getKey(), projectId);
                stopProject(entry.getKey());
            }
        }

        // 检查该项目是否已经在运行
        ProcessInfo existing = runningProcesses.get(projectId);
        if (existing != null && existing.getState() == ProcessStatus.State.RUNNING) {
            existing.setLastAccessTime(System.currentTimeMillis());
            return ProcessStatus.running(getPid(existing.getProcess()));
        }

        String startCmd = project.getBackendStartCmd();
        if (startCmd == null || startCmd.isBlank()) {
            return ProcessStatus.error("No start command configured");
        }

        try {
            // 创建进程信息并标记为启动中
            ProcessInfo info = new ProcessInfo(System.currentTimeMillis());
            info.setState(ProcessStatus.State.STARTING);
            info.setMessage("Starting...");
            info.setLastAccessTime(System.currentTimeMillis());
            runningProcesses.put(projectId, info);

            // 解析并执行启动命令
            String[] command = startCmd.split("\\s+");
            ProcessBuilder pb = new ProcessBuilder(command);
            if (project.getProjectPath() != null && !project.getProjectPath().isBlank()) {
                pb.directory(new java.io.File(project.getProjectPath()));
            }
            pb.environment().put("JAVA_OPTS", "-Xmx512m -Xms128m");
            pb.redirectErrorStream(true);

            Process process = pb.start();
            info.setProcess(process);

            log.info("已为项目 {} 启动进程: {}", projectId, startCmd);

            // 轮询健康检查 URL，等待服务就绪
            String healthUrl = project.getHealthCheckUrl();
            if (healthUrl != null && !healthUrl.isBlank()) {
                long start = System.currentTimeMillis();
                while (System.currentTimeMillis() - start < HEALTH_CHECK_TIMEOUT_MS) {
                    // 检查进程是否已退出
                    if (!process.isAlive()) {
                        info.setState(ProcessStatus.State.ERROR);
                        info.setMessage("Process exited unexpectedly");
                        runningProcesses.remove(projectId);
                        return ProcessStatus.error("Process exited unexpectedly during startup");
                    }
                    try {
                        java.net.HttpURLConnection conn = (java.net.HttpURLConnection)
                                java.net.URI.create(healthUrl).toURL().openConnection();
                        conn.setConnectTimeout(2000);
                        conn.setReadTimeout(2000);
                        if (conn.getResponseCode() == 200) {
                            info.setState(ProcessStatus.State.RUNNING);
                            info.setMessage("Running");
                            log.info("项目 {} 健康检查通过", projectId);
                            return ProcessStatus.running(getPid(process));
                        }
                    } catch (Exception ignored) {
                        // 健康检查尚未就绪，继续等待
                    }
                    Thread.sleep(2000);
                }
                // 健康检查超时
                info.setState(ProcessStatus.State.ERROR);
                info.setMessage("Health check timeout");
                process.destroyForcibly();
                runningProcesses.remove(projectId);
                return ProcessStatus.error("Health check timeout after 60 seconds");
            }

            // 没有配置健康检查 URL，等待 2 秒后假设启动成功
            Thread.sleep(2000);
            if (process.isAlive()) {
                info.setState(ProcessStatus.State.RUNNING);
                info.setMessage("Running");
                return ProcessStatus.running(getPid(process));
            } else {
                info.setState(ProcessStatus.State.ERROR);
                info.setMessage("Process exited unexpectedly");
                runningProcesses.remove(projectId);
                return ProcessStatus.error("Process exited unexpectedly");
            }
        } catch (Exception e) {
            log.error("启动项目 {} 失败: {}", projectId, e.getMessage());
            runningProcesses.remove(projectId);
            return ProcessStatus.error("Failed to start: " + e.getMessage());
        }
    }

    /**
     * 停止项目进程
     * 先尝试优雅关闭，等待 5 秒后强制终止
     */
    public synchronized ProcessStatus stopProject(Long projectId) {
        ProcessInfo info = runningProcesses.get(projectId);
        if (info == null) {
            return ProcessStatus.stopped();
        }

        try {
            info.setState(ProcessStatus.State.STOPPING);
            info.setMessage("Stopping...");
            Process process = info.getProcess();

            if (process != null && process.isAlive()) {
                process.destroy();
                if (!process.waitFor(SHUTDOWN_WAIT_MS, TimeUnit.MILLISECONDS)) {
                    process.destroyForcibly();
                    process.waitFor(2, TimeUnit.SECONDS);
                }
            }
            runningProcesses.remove(projectId);
            log.info("项目 {} 已停止", projectId);
            return ProcessStatus.stopped();
        } catch (Exception e) {
            log.error("停止项目 {} 时出错: {}", projectId, e.getMessage());
            runningProcesses.remove(projectId);
            return ProcessStatus.stopped();
        }
    }

    /**
     * 获取项目进程当前状态
     */
    public ProcessStatus getStatus(Long projectId) {
        ProcessInfo info = runningProcesses.get(projectId);
        if (info == null) {
            return ProcessStatus.stopped();
        }
        // 检测进程是否意外退出
        if (info.getProcess() != null && !info.getProcess().isAlive()
                && info.getState() == ProcessStatus.State.RUNNING) {
            runningProcesses.remove(projectId);
            return ProcessStatus.error("Process died unexpectedly");
        }
        info.setLastAccessTime(System.currentTimeMillis());
        return new ProcessStatus(info.getState(), info.getMessage(),
                info.getProcess() != null ? getPid(info.getProcess()) : null);
    }

    /**
     * 定时检查空闲超时（每 60 秒执行一次）
     * 超过 10 分钟无访问则自动关闭
     */
    @Scheduled(fixedRate = 60000)
    public void checkIdleTimeout() {
        long now = System.currentTimeMillis();
        for (Map.Entry<Long, ProcessInfo> entry : runningProcesses.entrySet()) {
            ProcessInfo info = entry.getValue();
            if (info.getState() == ProcessStatus.State.RUNNING
                    && now - info.getLastAccessTime() > IDLE_TIMEOUT_MS) {
                log.info("自动停止空闲项目 {}", entry.getKey());
                stopProject(entry.getKey());
            }
        }
    }

    /**
     * 获取进程 PID
     */
    private Integer getPid(Process process) {
        try {
            return (int) process.pid();
        } catch (Exception e) {
            return null;
        }
    }
}
