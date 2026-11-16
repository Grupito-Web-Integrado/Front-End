package com.example.Matricula_Pedidos.domain.model.enrollments.enrollment_students.vo;

import java.util.Objects;

public record StudentName(String value) {

  private static final int MAX_LENGTH = 200;

  public StudentName {

    Objects.requireNonNull(
        value,
        "Student name cannot be null");

    value = value.trim();

    if (value.isBlank()) {
      throw new IllegalArgumentException(
          "Student name cannot be blank");
    }

    if (value.length() > MAX_LENGTH) {
      throw new IllegalArgumentException(
          "Student name cannot exceed "
              + MAX_LENGTH
              + " characters");
    }
  }
  public static StudentName of(String value) {
    return new StudentName(value);
  }
}
