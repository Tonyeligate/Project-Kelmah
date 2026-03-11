package com.kelmah.mobile.features.auth.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Login
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Key
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    sessionMessage: String? = null,
    viewModel: AuthViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.isAuthenticated) {
        if (uiState.isAuthenticated) onLoginSuccess()
    }

    Surface {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Text(text = "Kelmah", style = MaterialTheme.typography.displaySmall)
            }
            item {
                Text(
                    text = "Find workers. Find jobs.",
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(AuthMode.entries) { mode ->
                        FilterChip(
                            selected = uiState.mode == mode,
                            onClick = { viewModel.switchMode(mode) },
                            label = { Text(mode.label) },
                            leadingIcon = {
                                Icon(
                                    imageVector = when (mode) {
                                        AuthMode.LOGIN -> Icons.AutoMirrored.Outlined.Login
                                        AuthMode.REGISTER -> Icons.Outlined.PersonAdd
                                        AuthMode.FORGOT_PASSWORD -> Icons.Outlined.Lock
                                        AuthMode.RESET_PASSWORD -> Icons.Outlined.Key
                                        AuthMode.VERIFY_EMAIL -> Icons.Outlined.Email
                                    },
                                    contentDescription = null,
                                )
                            },
                        )
                    }
                }
            }
            item {
                sessionMessage?.let { message ->
                    Text(
                        text = message,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
            item {
                uiState.infoMessage?.let { message ->
                    Text(
                        text = message,
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.bodyMedium,
                    )
                }
            }
            item {
                uiState.errorMessage?.let { message ->
                    Text(text = message, color = MaterialTheme.colorScheme.error)
                }
            }

            if (uiState.mode == AuthMode.REGISTER) {
                item {
                    OutlinedTextField(
                        value = uiState.firstName,
                        onValueChange = viewModel::onFirstNameChanged,
                        label = { Text("First name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                }
                item {
                    OutlinedTextField(
                        value = uiState.lastName,
                        onValueChange = viewModel::onLastNameChanged,
                        label = { Text("Last name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                }
            }

            if (uiState.mode != AuthMode.VERIFY_EMAIL) {
                item {
                    OutlinedTextField(
                        value = uiState.email,
                        onValueChange = viewModel::onEmailChanged,
                        label = { Text("Email address") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                }
            }

            if (uiState.mode == AuthMode.REGISTER) {
                item {
                    OutlinedTextField(
                        value = uiState.phone,
                        onValueChange = viewModel::onPhoneChanged,
                        label = { Text("Phone (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                    )
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("worker" to "Worker", "hirer" to "Hirer").forEach { (value, label) ->
                            FilterChip(
                                selected = uiState.role == value,
                                onClick = { viewModel.onRoleChanged(value) },
                                label = { Text(label) },
                            )
                        }
                    }
                }
            }

            if (uiState.mode == AuthMode.RESET_PASSWORD || uiState.mode == AuthMode.VERIFY_EMAIL) {
                item {
                    OutlinedTextField(
                        value = uiState.token,
                        onValueChange = viewModel::onTokenChanged,
                        label = { Text(if (uiState.mode == AuthMode.RESET_PASSWORD) "Reset code" else "Verification code") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }

            if (uiState.mode == AuthMode.LOGIN || uiState.mode == AuthMode.REGISTER || uiState.mode == AuthMode.RESET_PASSWORD) {
                item {
                    OutlinedTextField(
                        value = uiState.password,
                        onValueChange = viewModel::onPasswordChanged,
                        label = { Text("Password") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                    )
                }
            }

            if (uiState.mode == AuthMode.REGISTER || uiState.mode == AuthMode.RESET_PASSWORD) {
                item {
                    OutlinedTextField(
                        value = uiState.confirmPassword,
                        onValueChange = viewModel::onConfirmPasswordChanged,
                        label = { Text("Confirm password") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                    )
                }
            }

            item {
                Button(
                    onClick = viewModel::submitPrimaryAction,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isLoading,
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(modifier = Modifier.height(18.dp), strokeWidth = 2.dp)
                    } else {
                        Text(
                            when (uiState.mode) {
                                AuthMode.LOGIN -> "Sign in"
                                AuthMode.REGISTER -> "Create account"
                                AuthMode.FORGOT_PASSWORD -> "Send reset link"
                                AuthMode.RESET_PASSWORD -> "Reset password"
                                AuthMode.VERIFY_EMAIL -> "Verify email"
                            },
                        )
                    }
                }
            }

            item {
                if (uiState.mode == AuthMode.LOGIN || uiState.mode == AuthMode.REGISTER) {
                    Column {
                        TextButton(onClick = { viewModel.switchMode(AuthMode.FORGOT_PASSWORD) }) {
                            Text("Forgot password?")
                        }
                        TextButton(onClick = { viewModel.switchMode(AuthMode.VERIFY_EMAIL) }) {
                            Text("Have a verification code?")
                        }
                        TextButton(
                            onClick = viewModel::resendVerificationEmail,
                            enabled = !uiState.isLoading && uiState.email.isNotBlank(),
                        ) {
                            Text("Resend verification email")
                        }
                    }
                } else {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { viewModel.switchMode(AuthMode.LOGIN) }) {
                            Text("Back to sign in")
                        }
                        if (uiState.mode == AuthMode.FORGOT_PASSWORD) {
                            Spacer(modifier = Modifier.width(8.dp))
                            TextButton(
                                onClick = viewModel::resendVerificationEmail,
                                enabled = !uiState.isLoading && uiState.email.isNotBlank(),
                            ) {
                                Text("Resend email")
                            }
                        }
                    }
                }
            }
        }
    }
}
