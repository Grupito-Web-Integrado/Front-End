package com.example.Catalogo_Cursos.infrastructure.input.rest.outbox.publisher;
import com.example.Catalogo_Cursos.infrastructure.input.rest.adapter.outbox.OutboxEventRepositoryAdapter;
import com.example.Catalogo_Cursos.infrastructure.input.rest.entity.shared.outbox.OutboxEventEntity;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class OutboxEventPublisherImpl implements OutboxEventPublisher {
  private final OutboxEventRepositoryAdapter repository;
  private final KafkaTemplate<String,String> kafka;

  @Override
  public Mono<Void> publishBatch(int batchSize) {
    return repository.findPending(batchSize).concatMap(this::process).then();
  }
  private Mono<Void> process(OutboxEventEntity event) {
    return publish(event)
      .then(repository.markAsPublished(event.id()).then())
      .onErrorResume(error->repository.increaseRetry(event.id(),
        error.getMessage()==null?"Error Kafka":error.getMessage()).then())
      .then();
  }
  private Mono<Void> publish(OutboxEventEntity event) {
    String aggregate=event.aggregateType().toUpperCase();
    if (!aggregate.matches("COURSE|COURSE_CATEGORY|COURSE_LOCATION|COURSE_SCHEDULE"))
      return Mono.error(new IllegalArgumentException("Aggregate no soportado: "+aggregate));
    ProducerRecord<String,String> record=new ProducerRecord<>(
      "catalog."+aggregate+".events",event.aggregateId(),event.payload().asString());
    record.headers().add("eventType",event.type().getBytes(StandardCharsets.UTF_8));
    record.headers().add("eventId",event.id().toString().getBytes(StandardCharsets.UTF_8));
    return Mono.fromFuture(kafka.send(record)).then();
  }
}
