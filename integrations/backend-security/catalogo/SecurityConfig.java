package com.example.Catalogo_Cursos.infrastructure.config;

import java.util.Collection;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Sustituye la configuración permitAll del repositorio de catálogo.
 * "keycloak" valida JWT y exige rol ADMIN para escrituras.
 * Sin perfil keycloak, las lecturas son públicas y las escrituras se deniegan.
 * Adaptación de integración: revisar con el responsable del microservicio.
 */
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

  @Bean
  @Profile("keycloak")
  SecurityWebFilterChain secureKeycloak(ServerHttpSecurity http) {
    return http
      .csrf(ServerHttpSecurity.CsrfSpec::disable)
      .authorizeExchange(auth -> auth
        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .pathMatchers("/actuator/health", "/actuator/health/**").permitAll()
        .pathMatchers(HttpMethod.GET, "/api/v1/**").permitAll()
        .pathMatchers(HttpMethod.POST, "/api/v1/**").hasRole("ADMIN")
        .pathMatchers(HttpMethod.PATCH, "/api/v1/**").hasRole("ADMIN")
        .pathMatchers(HttpMethod.PUT, "/api/v1/**").hasRole("ADMIN")
        .pathMatchers(HttpMethod.DELETE, "/api/v1/**").hasRole("ADMIN")
        .anyExchange().denyAll())
      .oauth2ResourceServer(resourceServer -> resourceServer
        .jwt(jwt -> jwt.jwtAuthenticationConverter(realmRoleConverter())))
      .build();
  }

  @Bean
  @Profile("!keycloak")
  SecurityWebFilterChain safeWithoutIdentity(ServerHttpSecurity http) {
    return http
      .csrf(ServerHttpSecurity.CsrfSpec::disable)
      .authorizeExchange(auth -> auth
        .pathMatchers("/actuator/health", "/actuator/health/**").permitAll()
        .pathMatchers(HttpMethod.GET, "/api/v1/**").permitAll()
        .anyExchange().denyAll())
      .build();
  }

  private Converter<Jwt, Mono<AbstractAuthenticationToken>> realmRoleConverter() {
    ReactiveJwtAuthenticationConverter converter = new ReactiveJwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(jwt -> {
      Map<String, Object> access = jwt.getClaimAsMap("realm_access");
      if (access == null) return Flux.empty();
      Object value = access.get("roles");
      if (!(value instanceof Collection<?> roles)) return Flux.empty();
      return Flux.fromIterable(roles)
        .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.toString().toUpperCase()));
    });
    return converter;
  }
}
