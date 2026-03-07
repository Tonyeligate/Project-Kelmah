package com.kelmah.mobile.features.profile.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun ProfileScreen(
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(uiState.shouldLogout) {
        if (uiState.shouldLogout) {
            viewModel.consumeLogoutSignal()
            onLogout()
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Text("Profile", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Text(uiState.currentUser?.displayName ?: "Kelmah User", style = MaterialTheme.typography.titleLarge)
                    Text(uiState.currentUser?.email ?: "Email unavailable")
                    Text("Role: ${(uiState.currentUser?.role ?: "worker").replaceFirstChar { it.uppercase() }}")
                    Text(
                        if (uiState.currentUser?.isEmailVerified == true) "Email verified" else "Email verification pending",
                        color = if (uiState.currentUser?.isEmailVerified == true) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("Security", style = MaterialTheme.typography.titleLarge)
                    Text("Change your password to keep your Kelmah account secure across devices.")

                    uiState.infoMessage?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
                    uiState.errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }

                    OutlinedTextField(
                        value = uiState.currentPassword,
                        onValueChange = viewModel::onCurrentPasswordChanged,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Current password") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                    )
                    OutlinedTextField(
                        value = uiState.newPassword,
                        onValueChange = viewModel::onNewPasswordChanged,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("New password") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                    )
                    OutlinedTextField(
                        value = uiState.confirmPassword,
                        onValueChange = viewModel::onConfirmPasswordChanged,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Confirm new password") },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                    )

                    Button(
                        onClick = viewModel::changePassword,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !uiState.isSaving,
                    ) {
                        if (uiState.isSaving) {
                            CircularProgressIndicator(strokeWidth = 2.dp)
                        } else {
                            Text("Change password")
                        }
                    }
                }
            }
        }
        item {
            Button(
                onClick = onLogout,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Sign out")
            }
        }
    }
}
