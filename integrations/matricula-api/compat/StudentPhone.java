package com.example.Matricula_Pedidos.domain.model.enrollments.enrollment_students.vo;

public record StudentPhone(String value) {

  private static final int MAX_LENGTH = 30;

  public StudentPhone {

    if (value != null) {
      value = value.trim();
      if (value.isBlank()) value = null;
    }

    if (value != null && value.length() > MAX_LENGTH) {
      throw new IllegalArgumentException(
          "Student phone cannot exceed "
              + MAX_LENGTH
              + " characters");
    }

    if (value != null && !value.matches("^[+0-9()\\-\\s]+$")) {
      throw new IllegalArgumentException(
          "Student phone has an invalid format");
    }
  }
  public static StudentPhone of(String value) {
    return new StudentPhone(value);
  }
}
