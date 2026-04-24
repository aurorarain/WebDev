package com.emotion.service;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * 项目构建服务 - 处理 GitHub 仓库克隆和前端构建
 */
@Slf4j
@Service
public class ProjectBuildService {

    @Value("${file.embedded-projects-dir:./embedded-projects}")
    private String embeddedProjectsDir;

    /**
     * 构建结果 DTO
     */
    @Data
    public static class BuildResult {
        private boolean success;
        private String message;
        private String projectPath;
        private String frontendBuildDir;
        private String suggestedStartCmd;
        private int suggestedPort;
        private String readmeContent;
    }

    /**
     * 克隆 GitHub 仓库并构建项目
     *
     * @param githubUrl GitHub 仓库地址
     * @param slug      项目标识（用作目录名）
     * @param branch    分支名（null 或空则使用默认分支）
     * @return 构建结果
     */
    public BuildResult cloneAndBuild(String githubUrl, String slug, String branch) {
        BuildResult result = new BuildResult();
        try {
            Path projectDir = Path.of(embeddedProjectsDir, slug);

            // 如果目录已存在则先删除
            if (Files.exists(projectDir)) {
                deleteDirectory(projectDir.toFile());
            }

            // 克隆仓库（指定分支或使用默认分支）
            if (branch != null && !branch.isBlank()) {
                log.info("正在克隆 {} (分支: {}) 到 {}", githubUrl, branch, projectDir);
                exec(projectDir.getParent().toString(), "git", "clone", "--branch", branch, "--depth", "1", githubUrl, projectDir.toString());
            } else {
                log.info("正在克隆 {} (默认分支) 到 {}", githubUrl, projectDir);
                exec(projectDir.getParent().toString(), "git", "clone", "--depth", "1", githubUrl, projectDir.toString());
            }

            if (!Files.exists(projectDir)) {
                result.setSuccess(false);
                result.setMessage("Git clone failed");
                return result;
            }

            result.setProjectPath(projectDir.toString());

            // 检测并构建前端
            Path frontendDir = projectDir.resolve("frontend");
            if (Files.exists(frontendDir.resolve("package.json"))) {
                log.info("正在构建前端: {}", frontendDir);
                exec(frontendDir.toString(), "npm", "install");
                exec(frontendDir.toString(), "npm", "run", "build");

                Path distDir = frontendDir.resolve("dist");
                if (Files.exists(distDir)) {
                    result.setFrontendBuildDir(distDir.toString());
                }
            }

            // 检测后端类型（Spring Boot + Maven）
            Path backendDir = projectDir.resolve("backend");
            if (Files.exists(backendDir.resolve("pom.xml"))) {
                log.info("检测到 Spring Boot 后端");
                exec(backendDir.toString(), "mvn", "clean", "package", "-DskipTests");

                // 查找构建产物 JAR
                Path targetDir = backendDir.resolve("target");
                File[] jars = targetDir.toFile().listFiles(
                        (dir, name) -> name.endsWith(".jar") && !name.contains("-original"));
                if (jars != null && jars.length > 0) {
                    int port = 8081; // 默认嵌入式项目端口
                    result.setSuggestedPort(port);
                    result.setSuggestedStartCmd(String.format(
                            "java -Xmx512m -Xms128m -jar %s --server.port=%d",
                            jars[0].getAbsolutePath(), port));
                }
            }

            // 检测并读取 README
            String[] readmeFiles = {"README.md", "Readme.md", "readme.md"};
            for (String readmeFile : readmeFiles) {
                Path readmePath = projectDir.resolve(readmeFile);
                if (Files.exists(readmePath)) {
                    result.setReadmeContent(Files.readString(readmePath));
                    log.info("检测到 README: {}", readmeFile);
                    break;
                }
            }

            result.setSuccess(true);
            result.setMessage("Project cloned and built successfully");
            return result;

        } catch (Exception e) {
            log.error("构建失败: {}", e.getMessage());
            result.setSuccess(false);
            result.setMessage("Build failed: " + e.getMessage());
            return result;
        }
    }

    /**
     * 在指定工作目录执行命令
     */
    private void exec(String workingDir, String... command) throws Exception {
        exec(new File(workingDir), command);
    }

    /**
     * 在指定工作目录执行命令，等待完成并检查退出码
     */
    private void exec(File workingDir, String... command) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(workingDir);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        // 读取命令输出
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                log.debug("[build] {}", line);
            }
        }

        // 等待命令完成（最长 10 分钟）
        if (!process.waitFor(10, TimeUnit.MINUTES)) {
            process.destroyForcibly();
            throw new RuntimeException("Command timed out: " + String.join(" ", command));
        }

        if (process.exitValue() != 0) {
            throw new RuntimeException("Command failed (exit " + process.exitValue() + "): "
                    + String.join(" ", command) + "\n" + output);
        }
    }

    /**
     * 递归删除目录
     */
    private void deleteDirectory(File dir) {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectory(file);
                } else {
                    file.delete();
                }
            }
        }
        dir.delete();
    }
}
