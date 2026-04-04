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
            text = { Text(stringResource(id = R.string.profile_sign_out_this_device)) },
            confirmButton = {
                TextButton(onClick = { showLogoutDialog = false; onLogout() }) { Text(stringResource(id = R.string.profile_sign_out)) }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) { Text(stringResource(id = R.string.common_cancel)) }
            },
        )
    }
    if (showLogoutAllDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutAllDialog = false },
            title = { Text(stringResource(id = R.string.profile_sign_out_everywhere)) },
            text = { Text(stringResource(id = R.string.profile_sign_out_everywhere_message)) },
            confirmButton = {
                TextButton(onClick = { showLogoutAllDialog = false; onLogoutAll() }) { Text(stringResource(id = R.string.profile_sign_out_all)) }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutAllDialog = false }) { Text(stringResource(id = R.string.common_cancel)) }
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
            Text(
                stringResource(id = R.string.profile_title),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
            )
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
                    Text(
                        uiState.currentUser?.displayName
                            ?: stringResource(id = R.string.profile_default_user_name),
                        style = MaterialTheme.typography.titleLarge,
                    )
                    Text(uiState.currentUser?.email ?: stringResource(id = R.string.profile_no_email_added))
                    Text(
                        stringResource(
                            id = R.string.profile_role_label,
                            (uiState.currentUser?.role ?: "worker").replaceFirstChar { it.uppercase() },
                        ),
                    )
                    Text(
                        if (uiState.currentUser?.isEmailVerified == true) {
                            stringResource(id = R.string.profile_email_verified)
                        } else {
                            stringResource(id = R.string.profile_email_not_verified)
                        },
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
                        Text(stringResource(id = R.string.profile_work_details_title), style = MaterialTheme.typography.titleLarge)
                        Text(
                            stringResource(id = R.string.profile_work_details_subtitle),
                            style = MaterialTheme.typography.bodyMedium,
                        )

                        when {
                            uiState.isLoadingProfileSignals -> {
                                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(modifier = Modifier.width(32.dp), strokeWidth = 2.dp)
                                }
                            }
                            uiState.profileErrorMessage != null -> {
                                Text(
                                    uiState.profileErrorMessage
                                        ?: stringResource(id = R.string.profile_work_details_error),
                                    color = MaterialTheme.colorScheme.error,
                                )
                                Button(onClick = viewModel::refreshWorkerProfileSignals) {
                                    Text(stringResource(id = R.string.common_try_again))
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
                                Text(stringResource(id = R.string.profile_work_details_placeholder))
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
                    Text(stringResource(id = R.string.profile_password_title), style = MaterialTheme.typography.titleLarge)
                    Text(stringResource(id = R.string.profile_password_subtitle))

                    uiState.infoMessage?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
                    uiState.errorMessage?.let { Text(it, color = MaterialTheme.colorScheme.error) }

                    OutlinedTextField(
                        value = uiState.currentPassword,
                        onValueChange = viewModel::onCurrentPasswordChanged,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text(stringResource(id = R.string.profile_current_password)) },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                    )
                    OutlinedTextField(
                        value = uiState.newPassword,
                        onValueChange = viewModel::onNewPasswordChanged,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text(stringResource(id = R.string.profile_new_password)) },
                        visualTransformation = PasswordVisualTransformation(),
                        singleLine = true,
                    )
                    OutlinedTextField(
                        value = uiState.confirmPassword,
                        onValueChange = viewModel::onConfirmPasswordChanged,
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text(stringResource(id = R.string.profile_confirm_new_password)) },
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
                            Text(stringResource(id = R.string.profile_change_password))
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
        stringResource(id = R.string.profile_default_bio)
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
                            profile.profession.ifBlank { stringResource(id = R.string.profile_profession_fallback) },
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
                                stringResource(id = R.string.profile_no_ratings)
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
                Text(
                    stringResource(id = R.string.profile_about_me),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(visibleBio, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                if (canTruncateBio) {
                    TextButton(onClick = { showFullBio = !showFullBio }) {
                        Text(
                            if (showFullBio) {
                                stringResource(id = R.string.profile_show_less)
                            } else {
                                stringResource(id = R.string.profile_read_more)
                            },
                        )
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
                Text(
                    stringResource(id = R.string.profile_portfolio),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold,
                )
                if (snapshot.portfolio.items.isEmpty()) {
                    Text(
                        stringResource(id = R.string.profile_portfolio_placeholder),
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
                Text(
                    stringResource(id = R.string.profile_reviews),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold,
                )
                if (reviewHighlights.isEmpty()) {
                    Text(
                        stringResource(id = R.string.profile_reviews_placeholder),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    reviewHighlights.forEach { project ->
                        Text(
                            stringResource(
                                id = R.string.profile_review_highlight,
                                project.title,
                                String.format(java.util.Locale.US, "%.1f", project.clientRating ?: 0.0),
                            ),
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
                Text(stringResource(id = R.string.profile_find_jobs), fontWeight = FontWeight.Bold)
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
                Text(stringResource(id = R.string.profile_open_messages), fontWeight = FontWeight.Bold)
            }
        }

        ProfileFact(
            stringResource(id = R.string.profile_location),
            profile.location.ifBlank { stringResource(id = R.string.profile_add_work_area) },
        )
        ProfileFact(
            stringResource(id = R.string.profile_rate),
            profile.hourlyRate?.let {
                stringResource(
                    id = R.string.profile_rate_value,
                    profile.currency,
                    formatRate(it),
                )
            } ?: stringResource(id = R.string.profile_add_rate),
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
