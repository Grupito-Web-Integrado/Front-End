package com.example.Matricula_Pedidos.domain.model.enrollments.enrollment_students.vo;

import java.util.Objects;

public record DocumentNumber(String value) {

  private static final int MAX_LENGTH = 50;

  public DocumentNumber {

    if (value != null) {
      value = value.trim();
      if (value.isBlank()) value = null;
    }

    if (value != null && value.length() > MAX_LENGTH) {
      throw new IllegalArgumentException(
          "Document number cannot exceed "
              + MAX_LENGTH
              + " characters");
    }
  }
  public static DocumentNumber of(String value) {
    return new DocumentNumber(value);
  }
}
