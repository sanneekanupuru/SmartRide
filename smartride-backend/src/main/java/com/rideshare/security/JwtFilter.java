package com.rideshare.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();
        String method = request.getMethod();

        // --------------------- PUBLIC ENDPOINTS ---------------------
        if (path.startsWith("/api/v1/auth/") ||
                path.equals("/api/v1/admin/login") || // ✅ fixed
                path.startsWith("/api/v1/driver/login") || path.startsWith("/api/v1/driver/register") ||
                path.startsWith("/api/v1/passenger/login") || path.startsWith("/api/v1/passenger/register") ||
                path.startsWith("/api/v1/rides/search") ||
                path.matches("/api/v1/rides/\\d+") ||
                "OPTIONS".equalsIgnoreCase(method)) {   // allow preflight
            filterChain.doFilter(request, response);
            return;
        }

        // --------------------- JWT VALIDATION ---------------------
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.validateToken(token)) {
                String username = jwtUtil.getUsernameFromToken(token);
                String role = jwtUtil.getRoleFromToken(token);

                GrantedAuthority authority = new SimpleGrantedAuthority(role);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(username, null, List.of(authority));

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
