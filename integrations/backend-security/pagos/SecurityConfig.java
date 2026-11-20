package com.example.Servicio_Pago.config;

import java.util.Collection;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

/** Protege los registros de pagos de prueba. No implementa pagos bancarios. */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        .requestMatchers("/api/pagos", "/api/pagos/**").hasRole("ADMIN")
        .anyRequest().denyAll())
      .oauth2ResourceServer(resource -> resource.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtRoles())))
      .build();
  }

  private JwtAuthenticationConverter jwtRoles() {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    Converter<Jwt, Collection<GrantedAuthority>> roles = jwt -> {
      java.util.List<GrantedAuthority> result = new java.util.ArrayList<>();
      Map<String,Object> access = jwt.getClaimAsMap("realm_access");
      if (access != null && access.get("roles") instanceof Collection<?> list) {
        for (Object role : list) result.add(new SimpleGrantedAuthority("ROLE_" + role.toString().toUpperCase()));
      }
      return result;
    };
    converter.setJwtGrantedAuthoritiesConverter(roles);
    return converter;
  }
}
