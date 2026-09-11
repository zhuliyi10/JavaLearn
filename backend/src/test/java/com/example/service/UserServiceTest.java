package com.example.service;

import com.example.model.User;
import com.example.model.dto.CreateUserRequest;
import com.example.model.dto.UserResponse;
import com.example.repository.UserRepository;
import com.example.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    UserService userService;

    @Test
    void findAll_returnsMappedResponses() {
        User user = new User("Alice", "alice@example.com", "hash");
        when(userRepository.findAll()).thenReturn(List.of(user));

        List<UserResponse> result = userService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Alice");
    }

    @Test
    void create_duplicateEmail_throwsException() {
        when(userRepository.findByEmail("alice@example.com"))
            .thenReturn(Optional.of(new User("Alice", "alice@example.com", "hash")));

        assertThatThrownBy(() -> userService.create(new CreateUserRequest("Bob", "alice@example.com", "pass")))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Email already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    void create_newEmail_savesUser() {
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass")).thenReturn("hashed");
        User saved = new User("Bob", "bob@example.com", "hashed");
        when(userRepository.save(any())).thenReturn(saved);

        UserResponse result = userService.create(new CreateUserRequest("Bob", "bob@example.com", "pass"));

        assertThat(result.email()).isEqualTo("bob@example.com");
    }

    @Test
    void findById_notFound_throwsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99L))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}
