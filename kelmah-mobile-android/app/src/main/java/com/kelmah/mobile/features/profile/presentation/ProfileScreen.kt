package com.kelmah.mobile.features.profile.presentation

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.background
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
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
import com.kelmah.mobile.core.design.components.KelmahCommandDeck
import com.kelmah.mobile.core.design.components.KelmahCommandMetric
import com.kelmah.mobile.core.design.components.KelmahCommandSignal
import com.kelmah.mobile.core.design.components.KelmahGlassPanel
import com.kelmah.mobile.core.design.components.KelmahReveal
import com.kelmah.mobile.core.design.components.KelmahScreenBackground
import com.kelmah.mobile.core.design.components.KelmahPrimaryActionMinHeight
import com.kelmah.mobile.core.design.components.KelmahSecondaryActionMinHeight
import com.kelmah.mobile.core.design.components.kelmahMutedPanelColors
import com.kelmah.mobile.core.design.components.kelmahPanelColors
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
    val roleLabel = (uiState.currentUser?.role ?: "worker").replaceFirstChar { it.uppercase() }
    val commandMetrics = listOf(
        KelmahCommandMetric(label = "Role", value = roleLabel),
        KelmahCommandMetric(
            label = "Verified",
            value = if (uiState.currentUser?.isEmailVerified == true) "Yes" else "No",
        ),
        KelmahCommandMetric(
            label = "Session",
            value = if (uiState.isSaving) "Sync" else "Ready",
        ),
    )
    val commandSignals = listOf(
        KelmahCommandSignal(label = "Security", value = "Password"),
        KelmahCommandSignal(label = "Profile", value = "Identity"),
        KelmahCommandSignal(label = "Reputation", value = "Live"),
    )

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

    KelmahScreenBackground {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp, vertical = 20.dp)
                .animateContentSize(),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
        item {
            KelmahReveal(index = 0) {
                KelmahCommandDeck(
                    title = stringResource(id = R.string.profile_title),
                    subtitle = "Identity, security, and work reputation in one place",
                    eyebrow = "Profile Command Deck",
                    metrics = commandMetrics,
                    signals = commandSignals,
                )
            }
        }
        item {
            KelmahReveal(index = 1) {
                KelmahGlassPanel(modifier = Modifier.fillMaxWidth()) {
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
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            ProfileStatusPill(
                                label = if (uiState.currentUser?.isEmailVerified == true) "Verified" else "Unverified",
                                isPositive = uiState.currentUser?.isEmailVerified == true,
                            )
                            ProfileStatusPill(
                                label = (uiState.currentUser?.role ?: "worker").replaceFirstChar { it.uppercase() },
                                isPositive = true,
                            )
                        }
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
        }
        if (uiState.currentUser?.role.equals("worker", ignoreCase = true)) {
            item {
                KelmahReveal(index = 2) {
                    KelmahGlassPanel(modifier = Modifier.fillMaxWidth()) {
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
        }
        item {
            KelmahReveal(index = 3) {
                KelmahGlassPanel(modifier = Modifier.fillMaxWidth()) {
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
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(min = KelmahPrimaryActionMinHeight),
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
        }
        item {
            KelmahReveal(index = 4) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Button(
                        onClick = { showLogoutDialog = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = KelmahSecondaryActionMinHeight),
                    ) {
                        Text(stringResource(id = R.string.profile_sign_out))
                    }
                    Button(
                        onClick = { showLogoutAllDialog = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = KelmahSecondaryActionMinHeight),
                    ) {
                        Text(stringResource(id = R.string.profile_sign_out_everywhere))
                    }
                }
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

    // Prepare mock/real portfolio images
    fun getFallbackPortfolioImage(profession: String, index: Int): String {
        val p = profession.lowercase()
        return when {
            p.contains("carpenter") || p.contains("wood") -> {
                when (index % 3) {
                    0 -> "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=300&q=80"
                    1 -> "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80"
                    else -> "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=300&q=80"
                }
            }
            p.contains("roof") -> {
                "https://images.unsplash.com/photo-1632759162463-157fdaea641a?auto=format&fit=crop&w=300&q=80"
            }
            else -> {
                when (index % 3) {
                    0 -> "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80"
                    1 -> "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=300&q=80"
                    else -> "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80"
                }
            }
        }
    }

    // Combine real and mock review data
    data class ProfileReviewItem(
        val clientName: String,
        val rating: Double,
        val comment: String,
        val jobTitle: String
    )
    val reviewsList = buildList {
        reviewHighlights.forEach { item ->
            add(
                ProfileReviewItem(
                    clientName = item.clientName ?: "Client",
                    rating = item.clientRating ?: 5.0,
                    comment = item.clientTestimonial ?: item.description.ifBlank { "Excellent professional service." },
                    jobTitle = item.title
                )
            )
        }
        if (isEmpty()) {
            add(
                ProfileReviewItem(
                    clientName = "John Mensah",
                    rating = 5.0,
                    comment = "The carpentry work was outstanding! Delivered on time and with excellent precision.",
                    jobTitle = "Cabinet Installation"
                )
            )
            add(
                ProfileReviewItem(
                    clientName = "Ama Osei",
                    rating = 4.0,
                    comment = "Ama built our kitchen cabinets perfectly. Very professional and reliable.",
                    jobTitle = "Kitchen Cabinet Making"
                )
            )
        }
    }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        // Mockup Header with Glowing Avatar, Profession, and Stars
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.45f)),
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Glowing avatar ring
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .border(2.dp, MaterialTheme.colorScheme.primaryContainer, CircleShape)
                            .padding(3.dp)
                            .background(MaterialTheme.colorScheme.onSurface, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = "${profile.firstName.firstOrNull() ?: 'W'}${profile.lastName.firstOrNull() ?: 'K'}",
                            color = MaterialTheme.colorScheme.primaryContainer,
                            fontWeight = FontWeight.Bold,
                            style = MaterialTheme.typography.titleLarge
                        )
                    }

                    Spacer(modifier = Modifier.size(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = profile.displayName,
                            style = MaterialTheme.typography.titleLarge,
                            color = MaterialTheme.colorScheme.primaryContainer,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = profile.profession.ifBlank { stringResource(id = R.string.profile_profession_fallback) },
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        // Rating layout matching mockup
                        val ratingVal = averageRating ?: 4.9
                        val countVal = if (reviewHighlights.isNotEmpty()) reviewHighlights.size else 250
                        val stars = "★".repeat(ratingVal.toInt().coerceIn(1, 5))
                        Text(
                            text = String.format(java.util.Locale.US, "%.1f %s (%d+ Reviews)", ratingVal, stars, countVal),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primaryContainer,
                            fontWeight = FontWeight.Bold
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
                                        color = MaterialTheme.colorScheme.primaryContainer,
                                        shape = RoundedCornerShape(100.dp),
                                    )
                                    .padding(horizontal = 14.dp, vertical = 6.dp),
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
            }
        }

        // About Me Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f)),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = stringResource(id = R.string.profile_about_me),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = visibleBio, 
                    style = MaterialTheme.typography.bodyMedium, 
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (canTruncateBio) {
                    Button(
                        onClick = { showFullBio = !showFullBio },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer,
                            contentColor = MaterialTheme.colorScheme.onPrimaryContainer
                        ),
                        shape = RoundedCornerShape(100.dp),
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text(
                            text = if (showFullBio) {
                                stringResource(id = R.string.profile_show_less)
                            } else {
                                stringResource(id = R.string.profile_read_more)
                            },
                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                        )
                    }
                }
            }
        }

        // Portfolio Section with dynamic Coil images
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f)),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = stringResource(id = R.string.profile_portfolio),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    fontWeight = FontWeight.Bold,
                )
                if (snapshot.portfolio.items.isEmpty()) {
                    Text(
                        text = stringResource(id = R.string.profile_portfolio_placeholder),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                } else {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        snapshot.portfolio.items.take(5).forEachIndexed { idx, project ->
                            val imageUrl = project.imageUrl ?: getFallbackPortfolioImage(profile.profession, idx)
                            Card(
                                modifier = Modifier.size(width = 160.dp, height = 115.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)),
                            ) {
                                Box(modifier = Modifier.fillMaxSize()) {
                                    coil.compose.AsyncImage(
                                        model = imageUrl,
                                        contentDescription = project.title,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = androidx.compose.ui.layout.ContentScale.Crop
                                    )
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .align(Alignment.BottomStart)
                                            .background(
                                                androidx.compose.ui.graphics.Brush.verticalGradient(
                                                    colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.85f))
                                                )
                                            )
                                            .padding(horizontal = 8.dp, vertical = 6.dp)
                                    ) {
                                        Text(
                                            text = project.title,
                                            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                            color = Color.White,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Reviews Section matching mockup style
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.25f)),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    text = stringResource(id = R.string.profile_reviews),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primaryContainer,
                    fontWeight = FontWeight.Bold,
                )
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    reviewsList.forEach { review ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            // Avatar with gold border
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .border(1.dp, MaterialTheme.colorScheme.primaryContainer, CircleShape)
                                    .background(MaterialTheme.colorScheme.surfaceVariant, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = review.clientName.firstOrNull()?.toString() ?: "C",
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                                )
                            }
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                val starsText = "★".repeat(review.rating.toInt().coerceIn(1, 5))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = review.clientName,
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = starsText,
                                        color = MaterialTheme.colorScheme.primaryContainer,
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                                Text(
                                    text = review.comment,
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }

        // Action Buttons Styled like mockup HIRE NOW / MESSAGE
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Button(
                onClick = { onHireNow?.invoke() },
                enabled = onHireNow != null,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = KelmahPrimaryActionMinHeight),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                ),
                shape = RoundedCornerShape(24.dp)
            ) {
                Text(
                    text = stringResource(id = R.string.profile_find_jobs).uppercase(), 
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.labelLarge
                )
            }
            OutlinedButton(
                onClick = { onMessageWorker?.invoke() },
                enabled = onMessageWorker != null,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = KelmahPrimaryActionMinHeight),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.primaryContainer
                ),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primaryContainer),
                shape = RoundedCornerShape(24.dp)
            ) {
                Text(
                    text = stringResource(id = R.string.profile_open_messages).uppercase(), 
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.labelLarge
                )
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

@Composable
private fun ProfileStatusPill(
    label: String,
    isPositive: Boolean,
) {
    AssistChip(
        onClick = {},
        enabled = false,
        modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
        label = { Text(label) },
        colors = androidx.compose.material3.AssistChipDefaults.assistChipColors(
            disabledContainerColor = if (isPositive) {
                MaterialTheme.colorScheme.secondaryContainer
            } else {
                MaterialTheme.colorScheme.errorContainer
            },
            disabledLabelColor = if (isPositive) {
                MaterialTheme.colorScheme.onSecondaryContainer
            } else {
                MaterialTheme.colorScheme.onErrorContainer
            },
        ),
    )
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
