package com.example.Matricula_Pedidos.domain.model.enrollments.enrollment_students.vo;

import java.util.Objects;
import java.util.regex.Pattern;

public record StudentEmail(String value) {

  private static final int MAX_LENGTH = 255;

  private static final Pattern EMAIL_PATTERN = Pattern.compile(
      "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

  public StudentEmail {

    Objects.requireNonNull(
        value,
        "Student email cannot be null");

    value = value.trim();

    if (value.isBlank()) {
      throw new IllegalArgumentException(
          "Student email cannot be blank");
    }

    if (value.length() > MAX_LENGTH) {
      throw new IllegalArgumentException(
          "Student email cannot exceed "
              + MAX_LENGTH
              + " characters");
    }

    if (!EMAIL_PATTERN.matcher(value).matches()) {
      throw new IllegalArgumentException(
          "Student email has an invalid format");
    }

    value = value.toLowerCase();
  }
  public static StudentEmail of(String value) {
    return new StudentEmail(value);
  }
}
