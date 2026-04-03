package com.kelmah.mobile.features.profile.presentation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.ButtonDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.R
import com.kelmah.mobile.features.profile.data.AvailabilityDay
import com.kelmah.mobile.features.profile.data.WorkerProfileSnapshot

@Composable
fun ProfileScreen(
    onLogout: () -> Unit,
    onLogoutAll: () -> Unit,
    onHireNow: (() -> Unit)? = null,
    onMessageWorker: (() -> Unit)? = null,
    viewModel: ProfileViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showLogoutAllDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text(stringResource(id = R.string.profile_sign_out)) },
            text = { Text("You will be signed out of this device.") },
            confirmButton = {
                TextButton(onClick = { showLogoutDialog = false; onLogout() }) { Text(stringResource(id = R.string.profile_sign_out)) }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) { Text("Cancel") }
            },
        )
    }
    if (showLogoutAllDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutAllDialog = false },
            title = { Text(stringResource(id = R.string.profile_sign_out_everywhere)) },
            text = { Text("You will be signed out everywhere.") },
            confirmButton = {
                TextButton(onClick = { showLogoutAllDialog = false; onLogoutAll() }) { Text(stringResource(id = R.string.profile_sign_out_all)) }
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
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
            ) {
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
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.32f)),
                ) {
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
                                    WorkerProfileSignalsContent(
                                        snapshot = snapshot,
                                        onHireNow = onHireNow,
                                        onMessageWorker = onMessageWorker,
                                    )
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
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.24f)),
            ) {
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
                    Text(stringResource(id = R.string.profile_sign_out))
                }
                Button(
                    onClick = { showLogoutAllDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(stringResource(id = R.string.profile_sign_out_everywhere))
                }
            }
        }
    }
}

@Composable
private fun WorkerProfileSignalsContent(
    snapshot: WorkerProfileSnapshot,
    onHireNow: (() -> Unit)? = null,
    onMessageWorker: (() -> Unit)? = null,
) {
    val profile = snapshot.profile
    val visibleSkills = snapshot.visibleSkills.take(3)
    val reviewHighlights = snapshot.portfolio.items.filter { it.clientRating != null }.take(2)
    val averageRating = reviewHighlights.mapNotNull { it.clientRating }.takeIf { it.isNotEmpty() }?.average()
    var showFullBio by remember { mutableStateOf(false) }

    val bio = profile.bio.ifBlank {
        "I deliver clean finishing, dependable timelines, and quality craft for every project."
    }
    val canTruncateBio = bio.length > 160
    val visibleBio = if (canTruncateBio && !showFullBio) {
        "${bio.take(160).trimEnd()}..."
    } else {
        bio
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.45f)),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .background(
                                color = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(32.dp),
                            )
                            .border(
                                width = 2.dp,
                                color = MaterialTheme.colorScheme.primary,
                                shape = RoundedCornerShape(32.dp),
                            ),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            "${profile.firstName.firstOrNull() ?: 'W'}${profile.lastName.firstOrNull() ?: 'K'}",
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                        )
                    }

                    Spacer(modifier = Modifier.size(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            profile.displayName,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            profile.profession.ifBlank { "Professional Worker" },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            if (averageRating != null) {
                                String.format(
                                    java.util.Locale.US,
                                    "%.1f stars • %d highlights",
                                    averageRating,
                                    reviewHighlights.size,
                                )
                            } else {
                                "No ratings yet"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                if (visibleSkills.isNotEmpty()) {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        visibleSkills.forEach { skill ->
                            Text(
                                text = skill,
                                modifier = Modifier
                                    .background(
                                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.14f),
                                        shape = RoundedCornerShape(100.dp),
                                    )
                                    .border(
                                        width = 1.dp,
                                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.45f),
                                        shape = RoundedCornerShape(100.dp),
                                    )
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurface,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                    }
                }
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("About Me", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                Text(visibleBio, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                if (canTruncateBio) {
                    TextButton(onClick = { showFullBio = !showFullBio }) {
                        Text(if (showFullBio) "Show less" else "Read more")
                    }
                }
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Portfolio", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                if (snapshot.portfolio.items.isEmpty()) {
                    Text(
                        "Portfolio samples will appear here once added.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        snapshot.portfolio.items.take(5).forEach { project ->
                            Card(
                                modifier = Modifier.size(width = 150.dp, height = 88.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.28f)),
                            ) {
                                Column(
                                    modifier = Modifier.padding(10.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp),
                                ) {
                                    Text(
                                        project.title,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis,
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    Text(
                                        project.skillsUsed.joinToString(", ").ifBlank { project.projectType },
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Reviews", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                if (reviewHighlights.isEmpty()) {
                    Text(
                        "Client review highlights will appear here.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    reviewHighlights.forEach { project ->
                        Text(
                            "• ${project.title}: ${String.format(java.util.Locale.US, "%.1f", project.clientRating ?: 0.0)} stars",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                    }
                }
            }
        }

        Column(
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp, bottom = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Button(
                onClick = { onHireNow?.invoke() },
                enabled = onHireNow != null,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary,
                ),
                shape = RoundedCornerShape(24.dp)
            ) {
                Text("FIND JOBS", fontWeight = FontWeight.Bold)
            }
            OutlinedButton(
                onClick = { onMessageWorker?.invoke() },
                enabled = onMessageWorker != null,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.primary
                ),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(24.dp)
            ) {
                Text("OPEN MESSAGES", fontWeight = FontWeight.Bold)
            }
        }

        ProfileFact("Location", profile.location.ifBlank { "Add your work area" })
        ProfileFact(
            "Rate",
            profile.hourlyRate?.let { "${profile.currency} ${formatRate(it)}/hr" } ?: "Add your rate",
        )

        if (snapshot.partialWarnings.isNotEmpty()) {
            Text(
                snapshot.partialWarnings.joinToString(" "),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
            )
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
