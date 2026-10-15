
package com.clubconnect.backend;

import java.util.List;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class ClubsController {

    private final JdbcTemplate jdbcTemplate;

    public ClubsController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // Get all clubs
    @GetMapping("/api/clubs")
    public List<Map<String, Object>> getClubs() {
        String sql = "SELECT * FROM clubs ORDER BY id DESC";
        return jdbcTemplate.queryForList(sql);
    }

    // Register a student for a club
    @PostMapping("/api/register")
    public ResponseEntity<?> register(
            @RequestBody RegistrationRequest request) {

        if (request.studentName() == null ||
            request.studentName().isBlank() ||
            request.rollNumber() == null ||
            request.rollNumber().isBlank() ||
            request.email() == null ||
            request.email().isBlank() ||
            request.clubId() == null) {

            return ResponseEntity.badRequest()
                    .body(Map.of("message", "All fields are required"));
        }

        String sql = """
            INSERT INTO registrations
            (student_name, roll_number, email, club_id)
            VALUES (?, ?, ?, ?)
            """;

        try {
            jdbcTemplate.update(
                sql,
                request.studentName(),
                request.rollNumber(),
                request.email(),
                request.clubId()
            );

            return ResponseEntity.ok(
                Map.of("message", "Registration successful!")
            );

        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message",
                    "Registration failed. Check the club ID or registration details."
                ));
        }
    }

    public record RegistrationRequest(
        String studentName,
        String rollNumber,
        String email,
        Integer clubId
    ) {}
}
