package com.kelmah.mobile.features.profile.presentation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.features.profile.data.AvailabilityDay
import com.kelmah.mobile.features.profile.data.WorkerProfileSnapshot

@Composable
fun ProfileScreen(
    onLogout: () -> Unit,
    onLogoutAll: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showLogoutAllDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Sign out") },
            text = { Text("You will be signed out of this device.") },
            confirmButton = {
                TextButton(onClick = { showLogoutDialog = false; onLogout() }) { Text("Sign out") }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) { Text("Cancel") }
            },
        )
    }
    if (showLogoutAllDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutAllDialog = false },
            title = { Text("Sign out everywhere") },
            text = { Text("You will be signed out everywhere.") },
            confirmButton = {
                TextButton(onClick = { showLogoutAllDialog = false; onLogoutAll() }) { Text("Sign out all") }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutAllDialog = false }) { Text("Cancel") }
            },
        )
    }

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
                    Text(uiState.currentUser?.email ?: "No email added")
                    Text("Role: ${(uiState.currentUser?.role ?: "worker").replaceFirstChar { it.uppercase() }}")
                    Text(
                        if (uiState.currentUser?.isEmailVerified == true) "Email verified" else "Email not verified yet",
                        color = if (uiState.currentUser?.isEmailVerified == true) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                    )
                }
            }
        }
        if (uiState.currentUser?.role.equals("worker", ignoreCase = true)) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text("Your work details", style = MaterialTheme.typography.titleLarge)
                        Text(
                            "These details help Kelmah show you better jobs.",
                            style = MaterialTheme.typography.bodyMedium,
                        )

                        when {
                            uiState.isLoadingProfileSignals -> {
                                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(modifier = Modifier.width(32.dp), strokeWidth = 2.dp)
                                }
                            }
                            uiState.profileErrorMessage != null -> {
                                Text(uiState.profileErrorMessage ?: "We could not load your work details.", color = MaterialTheme.colorScheme.error)
                                Button(onClick = viewModel::refreshWorkerProfileSignals) {
                                    Text("Try again")
                                }
                            }
                            uiState.profileSnapshot != null -> {
                                uiState.profileSnapshot?.let { snapshot ->
                                    WorkerProfileSignalsContent(snapshot = snapshot)
                                }
                            }
                            else -> {
                                Text("Your work details will show here.")
                            }
                        }
                    }
                }
            }
        }
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("Password", style = MaterialTheme.typography.titleLarge)
                    Text("Change your password.")

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
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Button(
                    onClick = { showLogoutDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Sign out")
                }
                Button(
                    onClick = { showLogoutAllDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Sign out everywhere")
                }
            }
        }
    }
}

@Composable
private fun WorkerProfileSignalsContent(snapshot: WorkerProfileSnapshot) {
    val profile = snapshot.profile
    val visibleSkills = snapshot.visibleSkills
    val completenessProgress = snapshot.completeness.completionPercentage.coerceIn(0, 100) / 100f

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (snapshot.partialWarnings.isNotEmpty()) {
            Text(
                snapshot.partialWarnings.joinToString(" "),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
            )
        }
        Text(
            profile.profession.ifBlank { "Add your job title" },
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        if (profile.bio.isNotBlank()) {
            Text(profile.bio, style = MaterialTheme.typography.bodyMedium)
        }
        ProfileFact("Location", profile.location.ifBlank { "Add your work area" })
        ProfileFact("Rate", profile.hourlyRate?.let { "${profile.currency} ${formatRate(it)}/hr" } ?: "Add your rate")
        ProfileFact(
            "Experience",
            buildString {
                append(profile.experienceLevel?.replaceFirstChar { it.uppercase() } ?: "Add your experience")
                profile.yearsOfExperience?.takeIf { it > 0 }?.let { append(" • ${it}y") }
            },
        )
        ProfileFact(
            "Checks",
            listOfNotNull(
                "Email ${if (profile.isEmailVerified) "verified" else "pending"}",
                "Phone ${if (profile.isPhoneVerified) "verified" else "pending"}",
            ).joinToString(" • "),
        )

        HorizontalDivider()

        Text("Skills people can see", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
        Text(
            if (visibleSkills.isNotEmpty()) visibleSkills.joinToString(" • ") else "Add skills so people can find your work.",
            style = MaterialTheme.typography.bodyMedium,
        )
        ProfileFact(
            "Certificates",
            "${snapshot.credentials.certifications.count { it.isVerified }} verified certifications • ${snapshot.credentials.licenses.size} licenses",
        )
        snapshot.credentials.certifications.take(3).forEach { certification ->
            Text(
                "• ${certification.name}${certification.issuingOrganization.takeIf { it.isNotBlank() }?.let { " · $it" } ?: ""}",
                style = MaterialTheme.typography.bodySmall,
            )
        }

        HorizontalDivider()

        Text("Availability and profile", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
        ProfileFact(
            "Availability",
            when {
                snapshot.availability.isAvailable -> "Available${snapshot.availability.nextAvailable?.let { " • next $it" } ?: ""}"
                snapshot.availability.status == "not_set" -> snapshot.availability.message ?: "Add when you can work"
                else -> "Unavailable${snapshot.availability.nextAvailable?.let { " • next $it" } ?: ""}"
            },
        )
        snapshot.availability.schedule.take(3).forEach { day ->
            Text("• ${formatDay(day)}", style = MaterialTheme.typography.bodySmall)
        }
        LinearProgressIndicator(progress = { completenessProgress }, modifier = Modifier.fillMaxWidth())
        Text(
            "Profile done: ${snapshot.completeness.completionPercentage}% • needed ${snapshot.completeness.requiredCompletion}% • extra ${snapshot.completeness.optionalCompletion}%",
            style = MaterialTheme.typography.bodySmall,
        )
        snapshot.completeness.recommendations.take(3).forEach { recommendation ->
            Text("• $recommendation", style = MaterialTheme.typography.bodySmall)
        }

        HorizontalDivider()

        Text("Past work", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
        Text(
            "${snapshot.portfolio.publishedCount} shown out of ${snapshot.portfolio.totalCount}",
            style = MaterialTheme.typography.bodyMedium,
        )
        if (snapshot.portfolio.items.isEmpty()) {
            Text("Add past work so hirers can trust your profile.", style = MaterialTheme.typography.bodySmall)
        } else {
            snapshot.portfolio.items.take(3).forEach { project ->
                Text(
                    "• ${project.title}${project.skillsUsed.takeIf { it.isNotEmpty() }?.let { " · ${it.joinToString(", ")}" } ?: ""}",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}

@Composable
private fun ProfileFact(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
        Text(value, style = MaterialTheme.typography.bodyMedium)
    }
}

private fun formatRate(value: Double): String =
    if (value % 1.0 == 0.0) value.toInt().toString() else String.format(java.util.Locale.US, "%.2f", value)

private fun formatDay(day: AvailabilityDay): String {
    val dayLabel = day.day.replaceFirstChar { it.uppercase() }
    if (!day.available || day.slots.isEmpty()) {
        return "$dayLabel: unavailable"
    }
    val slots = day.slots.joinToString(", ") { slot -> "${slot.start}-${slot.end}" }
    return "$dayLabel: $slots"
}
