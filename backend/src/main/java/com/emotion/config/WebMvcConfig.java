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
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Optional;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final ProjectRepository projectRepository;

    @Value("${file.embedded-projects-dir:./embedded-projects}")
    private String embeddedProjectsDir;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/embedded/**")
                .addResourceLocations("file:" + embeddedProjectsDir + "/");
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir + "/");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                String path = request.getRequestURI();
                if (path.startsWith("/api/site") || path.startsWith("/api/health")) {
                    response.setHeader("Cache-Control", "public, max-age=300");
                } else if (path.startsWith("/api/projects") || path.startsWith("/api/blog")) {
                    response.setHeader("Cache-Control", "public, max-age=60");
                }
                return true;
            }
        });
        registry.addInterceptor(new EmbeddedApiProxyInterceptor(projectRepository));
    }

    @RequiredArgsConstructor
    private class EmbeddedApiProxyInterceptor implements HandlerInterceptor {

        private final ProjectRepository projectRepository;

        @Override
        public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
            String path = request.getRequestURI();
            if (!path.startsWith("/embedded/") || !path.contains("/api/")) {
                return true;
            }

            String[] parts = path.split("/");
            if (parts.length < 4) return true;
            String slug = parts[2];

            Optional<Project> projectOpt = projectRepository.findBySlug(slug);
            if (projectOpt.isEmpty() || projectOpt.get().getBackendPort() == null) {
                response.sendError(404, "Project backend not configured");
                return false;
            }

            int port = projectOpt.get().getBackendPort();
            String apiPath = path.substring(("/embedded/" + slug).length());
            String targetUrl = "http://localhost:" + port + apiPath;

            proxyRequest(request, response, targetUrl);
            return false;
        }

        private void proxyRequest(HttpServletRequest request, HttpServletResponse response, String targetUrl) {
            try {
                String queryString = request.getQueryString();
                if (queryString != null) {
                    targetUrl += "?" + queryString;
                }

                java.net.http.HttpRequest.Builder reqBuilder = java.net.http.HttpRequest.newBuilder()
                        .uri(URI.create(targetUrl));

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

                java.net.http.HttpResponse<byte[]> httpResponse = HTTP_CLIENT.send(
                        reqBuilder.build(),
                        java.net.http.HttpResponse.BodyHandlers.ofByteArray()
                );

                response.setStatus(httpResponse.statusCode());
                httpResponse.headers().map().forEach((name, values) -> {
                    for (String value : values) {
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
                }
            }
        }
    }
}
