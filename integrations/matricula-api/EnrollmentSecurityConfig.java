package com.example.Matricula_Pedidos.integration.web;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class EnrollmentSecurityConfig {
  @Bean
  SecurityWebFilterChain enrollmentSecurity(ServerHttpSecurity http) {
    return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
      .authorizeExchange(auth->auth
        .pathMatchers(HttpMethod.GET,"/actuator/health").permitAll()
        .pathMatchers("/api/matriculas/**").authenticated()
        .anyExchange().denyAll())
      .oauth2ResourceServer(oauth->oauth.jwt(jwt->{}))
      .build();
  }
}
