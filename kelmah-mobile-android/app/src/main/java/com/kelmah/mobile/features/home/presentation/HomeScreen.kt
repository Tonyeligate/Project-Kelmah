package com.kelmah.mobile.features.home.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.core.session.KelmahUserRole
import com.kelmah.mobile.core.session.kelmahUserRole
import com.kelmah.mobile.core.storage.SessionUser
import com.kelmah.mobile.core.utils.RelativeTimeFormatter
import com.kelmah.mobile.features.jobs.data.JobSummary
import com.kelmah.mobile.features.jobs.presentation.JobsViewModel
import com.kelmah.mobile.features.messaging.data.ConversationSummary
import com.kelmah.mobile.features.messaging.presentation.MessagesViewModel
import com.kelmah.mobile.features.notifications.data.NotificationItem
import com.kelmah.mobile.features.notifications.data.actionLabel
import com.kelmah.mobile.features.notifications.presentation.NotificationsViewModel

@Composable
fun HomeScreen(
    currentUser: SessionUser?,
    jobsViewModel: JobsViewModel,
    messagesViewModel: MessagesViewModel,
    notificationsViewModel: NotificationsViewModel,
    onBrowseJobs: () -> Unit,
    onOpenMessages: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenJob: (String) -> Unit,
    onOpenConversation: (String) -> Unit,
    onOpenNotification: (NotificationItem) -> Unit,
) {
    val role = currentUser.kelmahUserRole
    val jobsState by jobsViewModel.uiState.collectAsStateWithLifecycle()
    val messagesState by messagesViewModel.uiState.collectAsStateWithLifecycle()
    val notificationsState by notificationsViewModel.uiState.collectAsStateWithLifecycle()
    val displayName = currentUser?.displayName ?: "Kelmah ${role.title}"
    val headline = if (role == KelmahUserRole.HIRER) {
        "Track active hiring work, unread follow-up, and fresh alerts from one screen."
    } else {
        "Review your strongest job matches, unread work, and recent alerts before you start applying."
    }
    val primaryJobs = if (role == KelmahUserRole.HIRER) jobsState.hirerJobs else jobsState.recommendedJobs
    val unreadMessages = messagesState.conversations.sumOf { it.unreadCount }
    val unreadAlerts = notificationsState.unreadCount
    val savedJobs = jobsState.savedJobs.size
    val activeJobs = jobsState.hirerJobs.count { it.status.equals("open", ignoreCase = true) || it.status.equals("in-progress", ignoreCase = true) }

    LaunchedEffect(currentUser?.id, role) {
        jobsViewModel.refreshHome(role)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = displayName,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = headline,
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
        }

        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        text = if (role == KelmahUserRole.HIRER) "Hirer command view" else "Worker command view",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        text = if (role == KelmahUserRole.HIRER) {
                            "Use this surface to spot active jobs that need attention, keep candidate conversations moving, and react to alerts faster."
                        } else {
                            "Use this surface to review your best matches, keep saved opportunities close, and react to work alerts faster."
                        },
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        SummaryCard(
                            modifier = Modifier.weight(1f),
                            label = if (role == KelmahUserRole.HIRER) "Active jobs" else "Matches",
                            value = if (role == KelmahUserRole.HIRER) activeJobs else primaryJobs.size,
                        )
                        SummaryCard(
                            modifier = Modifier.weight(1f),
                            label = if (role == KelmahUserRole.HIRER) "Unread chats" else "Saved jobs",
                            value = if (role == KelmahUserRole.HIRER) unreadMessages else savedJobs,
                        )
                        SummaryCard(
                            modifier = Modifier.weight(1f),
                            label = "Alerts",
                            value = unreadAlerts,
                        )
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(onClick = onBrowseJobs, modifier = Modifier.weight(1f)) {
                            Text(if (role == KelmahUserRole.HIRER) "Open Hiring Market" else "Browse Jobs")
                        }
                        OutlinedButton(onClick = onOpenMessages, modifier = Modifier.weight(1f)) {
                            Text("Messages")
                        }
                        OutlinedButton(onClick = onOpenNotifications, modifier = Modifier.weight(1f)) {
                            Text("Alerts")
                        }
                    }
                }
            }
        }

        if (jobsState.homeErrorMessage != null) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                    Text(
                        text = jobsState.homeErrorMessage.orEmpty(),
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onErrorContainer,
                    )
                }
            }
        }

        item {
            SectionHeader(
                title = if (role == KelmahUserRole.HIRER) {
                    "Recent hiring activity"
                } else if (jobsState.recommendationsAreFallback) {
                    "Urgent jobs while matching recovers"
                } else {
                    "Recommended matches"
                },
                actionLabel = if (role == KelmahUserRole.HIRER) "Open market" else "Browse jobs",
                onAction = onBrowseJobs,
            )
        }

        if (role == KelmahUserRole.WORKER && jobsState.recommendationsAreFallback && !jobsState.recommendationContextMessage.isNullOrBlank()) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)) {
                    Text(
                        text = jobsState.recommendationContextMessage.orEmpty(),
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                    )
                }
            }
        }

        if (jobsState.isLoadingHomeFeed && primaryJobs.isEmpty()) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        CircularProgressIndicator(modifier = Modifier.width(20.dp))
                        Text("Loading the latest work intelligence...")
                    }
                }
            }
        } else if (primaryJobs.isEmpty()) {
            item {
                EmptyHomeSection(
                    title = if (role == KelmahUserRole.HIRER) {
                        "No hiring activity yet"
                    } else if (jobsState.recommendationsAreFallback) {
                        "No urgent jobs available"
                    } else {
                        "No recommendations yet"
                    },
                    description = if (role == KelmahUserRole.HIRER) {
                        "Your most recent jobs will appear here once your hiring activity is available."
                    } else if (jobsState.recommendationsAreFallback) {
                        "Kelmah could not recover enough urgent jobs while the recommendation feed is degraded."
                    } else {
                        "Your strongest matches will appear here once the recommendation feed returns results."
                    },
                )
            }
        } else {
            items(primaryJobs, key = { it.id }) { job ->
                HomeJobCard(
                    role = role,
                    job = job,
                    onOpen = { onOpenJob(job.id) },
                )
            }
        }

        item {
            SectionHeader(title = "Recent conversations", actionLabel = "Open messages", onAction = onOpenMessages)
        }

        if (messagesState.conversations.isEmpty()) {
            item {
                EmptyHomeSection(
                    title = "No conversations yet",
                    description = "Messages created from job and hiring flows will appear here for quick follow-up.",
                )
            }
        } else {
            items(messagesState.conversations.take(3), key = { it.id }) { conversation ->
                ConversationPreviewCard(conversation = conversation, onOpen = { onOpenConversation(conversation.id) })
            }
        }

        item {
            SectionHeader(title = "Recent alerts", actionLabel = "Open alerts", onAction = onOpenNotifications)
        }

        if (notificationsState.notifications.isEmpty()) {
            item {
                EmptyHomeSection(
                    title = "No alerts yet",
                    description = "Job, payment, and message alerts will appear here as activity comes in.",
                )
            }
        } else {
            items(notificationsState.notifications.take(3), key = { it.id }) { notification ->
                NotificationPreviewCard(notification = notification, onOpen = { onOpenNotification(notification) })
            }
        }
    }
}

@Composable
private fun SummaryCard(
    modifier: Modifier = Modifier,
    label: String,
    value: Int,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(value.toString(), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(label, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    actionLabel: String,
    onAction: () -> Unit,
) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Text(
            text = actionLabel,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.clickable(onClick = onAction),
        )
    }
}

@Composable
private fun HomeJobCard(
    role: KelmahUserRole,
    job: JobSummary,
    onOpen: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = job.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                if (job.matchScore != null && role == KelmahUserRole.WORKER) {
                    AssistChip(onClick = {}, enabled = false, label = { Text("${job.matchScore}% match") })
                } else if (!job.status.isNullOrBlank()) {
                    AssistChip(onClick = {}, enabled = false, label = { Text(job.status.replaceFirstChar { it.uppercase() }) })
                }
            }
            Text(
                text = job.aiReasoning ?: job.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
            )
            Text(job.locationLabel, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(job.budgetLabel, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                if (role == KelmahUserRole.HIRER && job.proposalCount > 0) {
                    Text("${job.proposalCount} proposals", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                }
            }
            val meta = listOfNotNull(
                RelativeTimeFormatter.relativeOrFallback(job.postedAt),
                if (job.isUrgent) "Priority listing" else null,
            )
            if (meta.isNotEmpty()) {
                Text(meta.joinToString(" • "), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun ConversationPreviewCard(
    conversation: ConversationSummary,
    onOpen: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = conversation.displayTitle,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (conversation.unreadCount > 0) {
                    AssistChip(onClick = {}, enabled = false, label = { Text("${conversation.unreadCount} unread") })
                }
            }
            Text(
                text = conversation.lastMessagePreview,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = RelativeTimeFormatter.relativeOrFallback(conversation.lastMessageAt) ?: "Just now",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun NotificationPreviewCard(
    notification: NotificationItem,
    onOpen: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = notification.title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                if (!notification.isRead) {
                    AssistChip(onClick = {}, enabled = false, label = { Text("Unread") })
                }
            }
            Text(
                text = notification.content,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = RelativeTimeFormatter.relativeOrFallback(notification.createdAt) ?: "Just now",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (!notification.actionLabel.isNullOrBlank()) {
                    Text(
                        text = notification.actionLabel.orEmpty(),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyHomeSection(
    title: String,
    description: String,
) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
            Text(description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
