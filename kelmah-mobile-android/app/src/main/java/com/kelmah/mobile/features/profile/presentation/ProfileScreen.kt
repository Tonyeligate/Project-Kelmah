package com.kelmah.mobile.features.profile.presentation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
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
        if (uiState.currentUser?.role.equals("worker", ignoreCase = true)) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text("Recommendation signals", style = MaterialTheme.typography.titleLarge)
                        Text(
                            "These details shape how Kelmah ranks and explains your mobile job recommendations.",
                            style = MaterialTheme.typography.bodyMedium,
                        )

                        when {
                            uiState.isLoadingProfileSignals -> {
                                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(modifier = Modifier.width(32.dp), strokeWidth = 2.dp)
                                }
                            }
                            uiState.profileErrorMessage != null -> {
                                Text(uiState.profileErrorMessage ?: "Profile signals are unavailable", color = MaterialTheme.colorScheme.error)
                                Button(onClick = viewModel::refreshWorkerProfileSignals) {
                                    Text("Retry profile sync")
                                }
                            }
                            uiState.profileSnapshot != null -> {
                                WorkerProfileSignalsContent(snapshot = uiState.profileSnapshot!!)
                            }
                            else -> {
                                Text("Profile signals will appear here once your worker account is loaded.")
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
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Button(
                    onClick = onLogout,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Sign out")
                }
                Button(
                    onClick = onLogoutAll,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Sign out all devices")
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
        Text(
            profile.profession.ifBlank { "Profession pending" },
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
        )
        if (profile.bio.isNotBlank()) {
            Text(profile.bio, style = MaterialTheme.typography.bodyMedium)
        }
        ProfileFact("Location", profile.location.ifBlank { "Add your working location" })
        ProfileFact("Rate", profile.hourlyRate?.let { "${profile.currency} ${formatRate(it)}/hr" } ?: "Set an hourly rate")
        ProfileFact(
            "Experience",
            buildString {
                append(profile.experienceLevel?.replaceFirstChar { it.uppercase() } ?: "Experience level pending")
                profile.yearsOfExperience?.takeIf { it > 0 }?.let { append(" • ${it}y") }
            },
        )
        ProfileFact(
            "Verification",
            listOfNotNull(
                "Email ${if (profile.isEmailVerified) "verified" else "pending"}",
                "Phone ${if (profile.isPhoneVerified) "verified" else "pending"}",
            ).joinToString(" • "),
        )

        HorizontalDivider()

        Text("Visible skills", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
        Text(
            if (visibleSkills.isNotEmpty()) visibleSkills.joinToString(" • ") else "Add skills so recommendation matches have enough precision.",
            style = MaterialTheme.typography.bodyMedium,
        )
        ProfileFact(
            "Credentials",
            "${snapshot.credentials.certifications.count { it.isVerified }} verified certifications • ${snapshot.credentials.licenses.size} licenses",
        )
        snapshot.credentials.certifications.take(3).forEach { certification ->
            Text(
                "• ${certification.name}${certification.issuingOrganization.takeIf { it.isNotBlank() }?.let { " · $it" } ?: ""}",
                style = MaterialTheme.typography.bodySmall,
            )
        }

        HorizontalDivider()

        Text("Availability and completeness", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
        ProfileFact(
            "Availability",
            when {
                snapshot.availability.isAvailable -> "Available${snapshot.availability.nextAvailable?.let { " • next $it" } ?: ""}"
                snapshot.availability.status == "not_set" -> snapshot.availability.message ?: "Availability not configured"
                else -> "Unavailable${snapshot.availability.nextAvailable?.let { " • next $it" } ?: ""}"
            },
        )
        snapshot.availability.schedule.take(3).forEach { day ->
            Text("• ${formatDay(day)}", style = MaterialTheme.typography.bodySmall)
        }
        LinearProgressIndicator(progress = completenessProgress, modifier = Modifier.fillMaxWidth())
        Text(
            "${snapshot.completeness.completionPercentage}% complete • required ${snapshot.completeness.requiredCompletion}% • optional ${snapshot.completeness.optionalCompletion}%",
            style = MaterialTheme.typography.bodySmall,
        )
        snapshot.completeness.recommendations.take(3).forEach { recommendation ->
            Text("• $recommendation", style = MaterialTheme.typography.bodySmall)
        }

        HorizontalDivider()

        Text("Portfolio proof", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Medium)
        Text(
            "${snapshot.portfolio.publishedCount} published items out of ${snapshot.portfolio.totalCount}",
            style = MaterialTheme.typography.bodyMedium,
        )
        if (snapshot.portfolio.items.isEmpty()) {
            Text("Add portfolio work to support recommendation trust and conversion.", style = MaterialTheme.typography.bodySmall)
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
    if (value % 1.0 == 0.0) value.toInt().toString() else String.format("%.2f", value)

private fun formatDay(day: AvailabilityDay): String {
    val dayLabel = day.day.replaceFirstChar { it.uppercase() }
    if (!day.available || day.slots.isEmpty()) {
        return "$dayLabel: unavailable"
    }
    val slots = day.slots.joinToString(", ") { slot -> "${slot.start}-${slot.end}" }
    return "$dayLabel: $slots"
}
