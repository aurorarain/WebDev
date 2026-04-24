package com.emotion.config;

import com.emotion.entity.Project;
import com.emotion.repository.ProjectRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.net.URI;
import java.util.Optional;

/**
 * Web MVC 配置 - 处理嵌入式项目的静态文件服务和 API 代理
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final ProjectRepository projectRepository;

    @Value("${file.embedded-projects-dir:./embedded-projects}")
    private String embeddedProjectsDir;

    /**
     * 配置静态资源处理：/embedded/{slug}/** 映射到嵌入式项目的前端构建目录
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/embedded/**")
                .addResourceLocations("file:" + embeddedProjectsDir + "/");
    }

    /**
     * 添加 API 代理拦截器：将 /embedded/{slug}/api/** 请求转发到对应项目的后端
     */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new EmbeddedApiProxyInterceptor(projectRepository));
    }

    /**
     * 嵌入式项目 API 代理拦截器
     * 将前端请求 /embedded/{slug}/api/** 转发到 localhost:{port}/api/**
     */
    @RequiredArgsConstructor
    private static class EmbeddedApiProxyInterceptor implements HandlerInterceptor {

        private final ProjectRepository projectRepository;

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            String path = request.getRequestURI();
            // 只处理包含 /api/ 路径的嵌入式项目请求
            if (!path.startsWith("/embedded/") || !path.contains("/api/")) {
                return true;
            }

            // 从路径中提取 slug: /embedded/{slug}/api/...
            String[] parts = path.split("/");
            if (parts.length < 4) return true;
            String slug = parts[2];

            // 查找项目及其后端端口配置
            Optional<Project> projectOpt = projectRepository.findBySlug(slug);
            if (projectOpt.isEmpty() || projectOpt.get().getBackendPort() == null) {
                response.sendError(404, "Project backend not configured");
                return false;
            }

            int port = projectOpt.get().getBackendPort();
            String apiPath = path.substring(("/embedded/" + slug).length());
            String targetUrl = "http://localhost:" + port + apiPath;

            // 转发请求到项目后端
            proxyRequest(request, response, targetUrl);
            return false;
        }

        /**
         * 执行代理请求转发
         */
        private void proxyRequest(HttpServletRequest request, HttpServletResponse response, String targetUrl) {
            try {
                // 拼接查询字符串
                String queryString = request.getQueryString();
                if (queryString != null) {
                    targetUrl += "?" + queryString;
                }

                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest.Builder reqBuilder = java.net.http.HttpRequest.newBuilder()
                        .uri(URI.create(targetUrl));

                // 处理 POST/PUT 请求体
                String method = request.getMethod();
                if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)) {
                    byte[] body = request.getInputStream().readAllBytes();
                    reqBuilder.method(method, java.net.http.HttpRequest.BodyPublishers.ofByteArray(body));
                    String contentType = request.getContentType();
                    if (contentType != null) {
                        reqBuilder.header("Content-Type", contentType);
                    }
                } else {
                    reqBuilder.method(method, java.net.http.HttpRequest.BodyPublishers.noBody());
                }

                // 发送请求并写入响应
                java.net.http.HttpResponse<byte[]> httpResponse = client.send(
                        reqBuilder.build(),
                        java.net.http.HttpResponse.BodyHandlers.ofByteArray()
                );

                response.setStatus(httpResponse.statusCode());
                httpResponse.headers().map().forEach((name, values) -> {
                    for (String value : values) {
                        // 跳过 content-length 和 transfer-encoding 以避免冲突
                        if (!name.equalsIgnoreCase("content-length")
                                && !name.equalsIgnoreCase("transfer-encoding")) {
                            response.addHeader(name, value);
                        }
                    }
                });
                response.getOutputStream().write(httpResponse.body());
            } catch (Exception e) {
                try {
                    response.sendError(502, "Backend unavailable: " + e.getMessage());
                } catch (Exception ignored) {
                    // 响应已提交，无法再发送错误
                }
            }
        }
    }
}
