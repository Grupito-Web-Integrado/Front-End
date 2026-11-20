package com.example.Catalogo_Cursos.infrastructure.input.rest.outbox.publisher;
import java.util.HashMap;
import java.util.Map;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.*;

@Configuration
public class OutboxKafkaConfig {
  @Bean
  KafkaTemplate<String,String> catalogKafkaTemplate() {
    String brokers=System.getenv().getOrDefault("SPRING_KAFKA_BOOTSTRAP_SERVERS","localhost:9092");
    Map<String,Object> cfg=new HashMap<>();
    cfg.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,brokers);
    cfg.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,StringSerializer.class);
    cfg.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,StringSerializer.class);
    cfg.put(ProducerConfig.ACKS_CONFIG,"all");
    cfg.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG,true);
    return new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(cfg));
  }
}
