package com.example.Matricula_Pedidos.integration.web;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/** Adaptador experimental, no reemplaza Saga/Outbox de Matricula. */
@RestController
@RequestMapping("/api/matriculas")
public class EnrollmentRestController {
  private final DatabaseClient db;
  private final WebClient catalogo;
  public EnrollmentRestController(DatabaseClient db,
      @Value("http://localhost:8080") String catalogoBase) {
    this.db=db;
    this.catalogo=WebClient.builder().baseUrl(catalogoBase).build();
  }

  public record Solicitud(@NotBlank String courseId, @NotBlank String nombre,
      @NotBlank @Email String correo, String telefono,
      @NotBlank String tipoDocumento, @NotBlank String documento) {}

  private UUID usuario(Jwt jwt) {
    if (jwt==null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
    try {return UUID.fromString(jwt.getSubject());}
    catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"JWT sin subject UUID");
    }
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  public Mono<Map<String,Object>> registrar(@AuthenticationPrincipal Jwt jwt,
      @Valid @RequestBody Solicitud f) {
    UUID student=usuario(jwt);
    final UUID course;
    try {course=UUID.fromString(f.courseId());}
    catch (IllegalArgumentException e) {
      return Mono.error(new ResponseStatusException(HttpStatus.BAD_REQUEST,"ID de curso inválido"));
    }
    return catalogo.get().uri("/api/v1/courses/{id}",course)
      .header(HttpHeaders.AUTHORIZATION,"Bearer "+jwt.getTokenValue())
      .retrieve().bodyToMono(JsonNode.class)
      .onErrorMap(e->new ResponseStatusException(HttpStatus.BAD_GATEWAY,
        "No se pudo comprobar el curso en Catálogo",e))
      .flatMap(c-> {
        if(!"PUBLISHED".equals(c.path("status").asText()))
          return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT,"Curso no publicado"));
        if(c.path("availableSlots").asInt(0)<1)
          return Mono.error(new ResponseStatusException(HttpStatus.CONFLICT,"Sin cupos"));
        if(!c.hasNonNull("price") || !c.hasNonNull("currency"))
          return Mono.error(new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Precio ausente"));
        BigDecimal amount=c.path("price").decimalValue();
        String currency=c.path("currency").asText();
        if(amount.signum()<0 || !currency.matches("[A-Z]{3}"))
          return Mono.error(new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Precio inválido"));
        UUID id=UUID.randomUUID();
        String number="MYA-"+id.toString().substring(0,12).toUpperCase();
        return db.sql("""
          INSERT INTO enrollments(id,enrollment_number,student_id,course_id,status,amount,currency)
          VALUES (:id,:number,:student,:course,'CREADA',:amount,:currency)
          """)
          .bind("id",id).bind("number",number).bind("student",student)
          .bind("course",course).bind("amount",amount).bind("currency",currency)
          .fetch().rowsUpdated()
          .then(db.sql("""
             INSERT INTO enrollment_students(id,enrollment_id,student_id,name,email,phone,document_type,document_number)
             VALUES (:id,:enrollment,:student,:name,:email,:phone,:type,:document)
             """)
             .bind("id",UUID.randomUUID()).bind("enrollment",id).bind("student",student)
             .bind("name",f.nombre().trim()).bind("email",f.correo().trim())
             .bind("phone",f.telefono()==null?"":f.telefono().trim())
             .bind("type",f.tipoDocumento()).bind("document",f.documento().trim())
             .fetch().rowsUpdated())
          .thenReturn(Map.<String,Object>of("id",id.toString(),
             "courseId",course.toString(),"courseName",c.path("name").asText("Curso"),
             "nombre",f.nombre().trim(),"correo",f.correo().trim(),
             "tipoDocumento",f.tipoDocumento(),"documento",f.documento().trim(),
             "telefono",f.telefono()==null?"":f.telefono().trim(),
             "estado","CREADA","importe",amount,"origen","API"))
          .onErrorMap(DataIntegrityViolationException.class,
             e->new ResponseStatusException(HttpStatus.CONFLICT,"Matrícula duplicada o inválida",e));
      });
  }

  private Flux<Map<String,Object>> registros(UUID student, boolean admin) {
    String consulta= """
      SELECT e.id::text AS id,e.course_id::text AS "courseId",s.name AS nombre,
        s.email AS correo,s.phone AS telefono,s.document_type AS "tipoDocumento",
        s.document_number AS documento,e.status AS estado,e.amount AS importe,
        e.created_at::text AS fecha
      FROM enrollments e JOIN enrollment_students s ON e.id=s.enrollment_id
      """;
    if(!admin) consulta+=" WHERE e.student_id=:student";
    consulta+=" ORDER BY e.created_at DESC LIMIT 200";
    DatabaseClient.GenericExecuteSpec query=db.sql(consulta);
    if(!admin) query=query.bind("student",student);
    return query.fetch().all().map(record->{
      Map<String,Object> result=new HashMap<>(record);
      result.put("origen","API");
      String id=String.valueOf(record.get("courseId"));
      result.put("courseName","Curso "+id.substring(0,Math.min(id.length(),8)));
      return result;
    });
  }

  @GetMapping
  public Flux<Map<String,Object>> mias(@AuthenticationPrincipal Jwt jwt) {
    return registros(usuario(jwt),false);
  }

  @GetMapping("/admin")
  public Flux<Map<String,Object>> todas(@AuthenticationPrincipal Jwt jwt) {
    UUID student=usuario(jwt);
    Map<String,Object> realm=jwt.getClaimAsMap("realm_access");
    Object roles=realm==null?null:realm.get("roles");
    if(!(roles instanceof java.util.Collection<?> c) || !c.contains("ADMIN"))
      return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
    return registros(student,true);
  }
}
