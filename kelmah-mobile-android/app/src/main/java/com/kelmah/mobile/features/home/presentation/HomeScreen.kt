package com.kelmah.mobile.features.home.presentation

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
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
import com.kelmah.mobile.core.session.KelmahUserRole
import com.kelmah.mobile.core.session.kelmahUserRole
import com.kelmah.mobile.core.storage.SessionUser
import com.kelmah.mobile.core.utils.RelativeTimeFormatter
import com.kelmah.mobile.features.jobs.data.JobSummary
import com.kelmah.mobile.features.jobs.data.RecommendationFeedState
import com.kelmah.mobile.features.jobs.presentation.JobsViewModel
import com.kelmah.mobile.features.messaging.data.ConversationSummary
import com.kelmah.mobile.features.messaging.presentation.MessagesViewModel
import com.kelmah.mobile.features.notifications.data.NotificationItem
import com.kelmah.mobile.features.notifications.data.actionLabel
import com.kelmah.mobile.features.notifications.presentation.NotificationsViewModel
import java.util.Locale

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
    val displayName = currentUser?.displayName
        ?: stringResource(id = R.string.home_display_name_fallback, role.title)
    val headline = if (role == KelmahUserRole.HIRER) {
        stringResource(id = R.string.home_headline_hirer)
    } else {
        stringResource(id = R.string.home_headline_worker)
    }
    val primaryJobs = if (role == KelmahUserRole.HIRER) jobsState.hirerJobs else jobsState.recommendedJobs
    val unreadMessages = messagesState.conversations.sumOf { it.unreadCount }
    val unreadAlerts = notificationsState.unreadCount
    val savedJobs = jobsState.savedJobs.size
    val activeJobs = jobsState.hirerJobs.count { it.status.equals("open", ignoreCase = true) || it.status.equals("in-progress", ignoreCase = true) }
    val urgentJobs = primaryJobs.count { it.isUrgent }
    val priorityUnreadChats = stringResource(id = R.string.home_priority_unread_chats)
    val priorityNewAlerts = stringResource(id = R.string.home_priority_new_alerts)
    val priorityUrgentJobs = stringResource(id = R.string.home_priority_urgent_jobs)
    val priorityActiveJobs = stringResource(id = R.string.home_priority_active_jobs)
    val nextActionReply = stringResource(id = R.string.home_next_action_reply_chats)
    val nextActionAlerts = stringResource(id = R.string.home_next_action_review_alerts)
    val nextActionApplyUrgent = stringResource(id = R.string.home_next_action_apply_urgent)
    val nextActionTrackActive = stringResource(id = R.string.home_next_action_track_active)
    val prioritySignals = buildList {
        if (unreadMessages > 0) {
            add(HomePrioritySignal(priorityUnreadChats, unreadMessages, onOpenMessages))
        }
        if (unreadAlerts > 0) {
            add(HomePrioritySignal(priorityNewAlerts, unreadAlerts, onOpenNotifications))
        }
        if (role == KelmahUserRole.WORKER && urgentJobs > 0) {
            add(HomePrioritySignal(priorityUrgentJobs, urgentJobs, onBrowseJobs))
        }
        if (role == KelmahUserRole.HIRER && activeJobs > 0) {
            add(HomePrioritySignal(priorityActiveJobs, activeJobs, onBrowseJobs))
        }
    }
    val nextBestAction = when {
        unreadMessages > 0 -> HomePrioritySignal(nextActionReply, unreadMessages, onOpenMessages)
        unreadAlerts > 0 -> HomePrioritySignal(nextActionAlerts, unreadAlerts, onOpenNotifications)
        role == KelmahUserRole.WORKER && urgentJobs > 0 -> HomePrioritySignal(nextActionApplyUrgent, urgentJobs, onBrowseJobs)
        role == KelmahUserRole.HIRER && activeJobs > 0 -> HomePrioritySignal(nextActionTrackActive, activeJobs, onBrowseJobs)
        else -> null
    }
    val mutedPanelColors = kelmahMutedPanelColors()
    val commandMetrics = listOf(
        KelmahCommandMetric(label = "Jobs", value = primaryJobs.size.toString()),
        KelmahCommandMetric(label = "Chats", value = unreadMessages.toString()),
        KelmahCommandMetric(label = "Alerts", value = unreadAlerts.toString()),
    )
    val commandSignals = buildList {
        prioritySignals.take(6).forEach { signal ->
            add(
                KelmahCommandSignal(
                    label = signal.label,
                    value = signal.count.toString(),
                    onClick = signal.onOpen,
                ),
            )
        }
        if (isEmpty()) {
            add(KelmahCommandSignal(label = "No pending signals", value = "Live"))
        }
    }

    LaunchedEffect(currentUser?.id, role) {
        jobsViewModel.refreshHome(role)
    }

    KelmahScreenBackground {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp, vertical = 20.dp)
                .animateContentSize(),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
        item {
            KelmahReveal(index = 0) {
                KelmahCommandDeck(
                    title = displayName,
                    subtitle = headline,
                    eyebrow = if (role == KelmahUserRole.HIRER) "Hiring Command Deck" else "Worker Command Deck",
                    metrics = commandMetrics,
                    signals = commandSignals,
                )
            }
        }

        item {
            KelmahReveal(index = 1) {
                KelmahGlassPanel {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            text = if (role == KelmahUserRole.HIRER) {
                                stringResource(id = R.string.home_overview_title_hirer)
                            } else {
                                stringResource(id = R.string.home_overview_title_worker)
                            },
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = if (role == KelmahUserRole.HIRER) {
                                stringResource(id = R.string.home_overview_desc_hirer)
                            } else {
                                stringResource(id = R.string.home_overview_desc_worker)
                            },
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            SummaryCard(
                                modifier = Modifier.weight(1f),
                                label = if (role == KelmahUserRole.HIRER) {
                                    stringResource(id = R.string.home_summary_active_jobs)
                                } else {
                                    stringResource(id = R.string.home_summary_good_jobs)
                                },
                                value = if (role == KelmahUserRole.HIRER) activeJobs else primaryJobs.size,
                            )
                            SummaryCard(
                                modifier = Modifier.weight(1f),
                                label = if (role == KelmahUserRole.HIRER) {
                                    stringResource(id = R.string.home_summary_new_chats)
                                } else {
                                    stringResource(id = R.string.home_summary_saved_jobs)
                                },
                                value = if (role == KelmahUserRole.HIRER) unreadMessages else savedJobs,
                            )
                            SummaryCard(
                                modifier = Modifier.weight(1f),
                                label = stringResource(id = R.string.home_summary_alerts),
                                value = unreadAlerts,
                            )
                        }
                        if (prioritySignals.isNotEmpty()) {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(prioritySignals.take(4), key = { signal -> signal.label }) { signal ->
                                    AssistChip(
                                        onClick = signal.onOpen,
                                        modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                                        label = { Text("${signal.label} ${signal.count}") },
                                    )
                                }
                            }
                        }
                        nextBestAction?.let { action ->
                            Card(colors = mutedPanelColors) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                        Text(
                                            text = stringResource(id = R.string.home_next_best_action),
                                            style = MaterialTheme.typography.labelLarge,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                        Text(
                                            text = "${action.label} (${action.count})",
                                            style = MaterialTheme.typography.titleSmall,
                                            fontWeight = FontWeight.SemiBold,
                                        )
                                    }
                                    Button(onClick = action.onOpen) {
                                        Text(stringResource(id = R.string.common_open))
                                    }
                                }
                            }
                        }
                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Button(
                                onClick = onBrowseJobs,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(min = KelmahPrimaryActionMinHeight),
                            ) {
                                Text(
                                    if (role == KelmahUserRole.HIRER) {
                                        stringResource(id = R.string.home_open_market)
                                    } else {
                                        stringResource(id = R.string.home_find_work)
                                    },
                                )
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                OutlinedButton(
                                    onClick = onOpenMessages,
                                    modifier = Modifier
                                        .weight(1f)
                                        .heightIn(min = KelmahSecondaryActionMinHeight),
                                ) {
                                    Text(stringResource(id = R.string.home_messages))
                                }
                                OutlinedButton(
                                    onClick = onOpenNotifications,
                                    modifier = Modifier
                                        .weight(1f)
                                        .heightIn(min = KelmahSecondaryActionMinHeight),
                                ) {
                                    Text(stringResource(id = R.string.home_alerts))
                                }
                            }
                        }
                    }
                }
            }
        }

        if (prioritySignals.isNotEmpty()) {
            item {
                KelmahReveal(index = 2) {
                    KelmahGlassPanel(muted = true) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Text(
                                text = stringResource(id = R.string.home_priority_queue),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold,
                            )
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                items(prioritySignals, key = { signal -> signal.label }) { signal ->
                                    AssistChip(
                                        onClick = signal.onOpen,
                                        modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                                        label = { Text("${signal.label}: ${signal.count}") },
                                    )
                                }
                            }
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
                    stringResource(id = R.string.home_recent_hiring_activity)
                } else if (jobsState.recommendationState == RecommendationFeedState.FALLBACK) {
                    stringResource(id = R.string.home_urgent_jobs_now)
                } else if (jobsState.recommendationState == RecommendationFeedState.PROFILE_INCOMPLETE) {
                    stringResource(id = R.string.home_more_jobs_profile)
                } else if (jobsState.recommendationState == RecommendationFeedState.FAILED) {
                    stringResource(id = R.string.home_jobs_feed)
                } else {
                    stringResource(id = R.string.home_jobs_for_you)
                },
                actionLabel = if (role == KelmahUserRole.HIRER) {
                    stringResource(id = R.string.home_open_market)
                } else {
                    stringResource(id = R.string.home_find_work)
                },
                onAction = onBrowseJobs,
            )
        }

        if (role == KelmahUserRole.WORKER && !jobsState.recommendationContextMessage.isNullOrBlank()) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = recommendationBannerColor(jobsState.recommendationState))) {
                    Text(
                        text = jobsState.recommendationContextMessage.orEmpty(),
                        modifier = Modifier.padding(16.dp),
                        color = recommendationBannerTextColor(jobsState.recommendationState),
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
                        Text(stringResource(id = R.string.home_loading_jobs))
                    }
                }
            }
        } else if (primaryJobs.isEmpty()) {
            item {
                EmptyHomeSection(
                    title = if (role == KelmahUserRole.HIRER) {
                        stringResource(id = R.string.home_empty_hiring_title)
                    } else if (jobsState.recommendationState == RecommendationFeedState.PROFILE_INCOMPLETE) {
                        stringResource(id = R.string.home_empty_profile_incomplete_title)
                    } else if (jobsState.recommendationState == RecommendationFeedState.FALLBACK) {
                        stringResource(id = R.string.home_empty_fallback_title)
                    } else if (jobsState.recommendationState == RecommendationFeedState.FAILED) {
                        stringResource(id = R.string.home_empty_failed_title)
                    } else {
                        stringResource(id = R.string.home_empty_jobs_title)
                    },
                    description = if (role == KelmahUserRole.HIRER) {
                        stringResource(id = R.string.home_empty_hiring_desc)
                    } else if (jobsState.recommendationState == RecommendationFeedState.PROFILE_INCOMPLETE) {
                        stringResource(id = R.string.home_empty_profile_incomplete_desc)
                    } else if (jobsState.recommendationState == RecommendationFeedState.FALLBACK) {
                        stringResource(id = R.string.home_empty_fallback_desc)
                    } else if (jobsState.recommendationState == RecommendationFeedState.FAILED) {
                        stringResource(id = R.string.home_empty_failed_desc)
                    } else {
                        stringResource(id = R.string.home_empty_jobs_desc)
                    },
                )
            }
        } else {
            itemsIndexed(primaryJobs, key = { _, job -> job.id }) { index, job ->
                KelmahReveal(index = 3 + index) {
                    HomeJobCard(
                        role = role,
                        job = job,
                        onOpen = { onOpenJob(job.id) },
                    )
                }
            }
        }

        item {
            SectionHeader(
                title = stringResource(id = R.string.home_messages_section),
                actionLabel = stringResource(id = R.string.home_messages_open_action),
                onAction = onOpenMessages,
            )
        }

        if (messagesState.conversations.isEmpty()) {
            item {
                EmptyHomeSection(
                    title = if (role == KelmahUserRole.WORKER) {
                        stringResource(id = R.string.home_empty_messages_worker_title)
                    } else {
                        stringResource(id = R.string.home_empty_messages_hirer_title)
                    },
                    description = if (role == KelmahUserRole.WORKER) {
                        stringResource(id = R.string.home_empty_messages_worker_desc)
                    } else {
                        stringResource(id = R.string.home_empty_messages_hirer_desc)
                    },
                )
            }
        } else {
            itemsIndexed(messagesState.conversations.take(3), key = { _, conversation -> conversation.id }) { index, conversation ->
                KelmahReveal(index = 10 + index) {
                    ConversationPreviewCard(conversation = conversation, onOpen = { onOpenConversation(conversation.id) })
                }
            }
        }

        item {
            SectionHeader(
                title = stringResource(id = R.string.home_alerts_section),
                actionLabel = stringResource(id = R.string.home_alerts_open_action),
                onAction = onOpenNotifications,
            )
        }

        if (notificationsState.notifications.isEmpty()) {
            item {
                EmptyHomeSection(
                    title = stringResource(id = R.string.home_empty_alerts_title),
                    description = if (role == KelmahUserRole.WORKER) {
                        stringResource(id = R.string.home_empty_alerts_desc_worker)
                    } else {
                        stringResource(id = R.string.home_empty_alerts_desc_hirer)
                    },
                )
            }
        } else {
            itemsIndexed(notificationsState.notifications.take(3), key = { _, notification -> notification.id }) { index, notification ->
                KelmahReveal(index = 14 + index) {
                    NotificationPreviewCard(notification = notification, onOpen = { onOpenNotification(notification) })
                }
            }
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
        colors = kelmahMutedPanelColors(),
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
private fun HomeSignalPill(
    modifier: Modifier = Modifier,
    label: String,
    count: Int,
) {
    Card(
        modifier = modifier,
        colors = kelmahPanelColors(),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
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
        colors = kelmahPanelColors(),
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
                    AssistChip(
                        onClick = {},
                        enabled = false,
                        label = { Text(stringResource(id = R.string.home_match_fit_chip, formatMatchScore(job.matchScore))) },
                    )
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
                    Text(
                        stringResource(id = R.string.home_proposals_count, job.proposalCount),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            val meta = listOfNotNull(
                RelativeTimeFormatter.relativeOrFallback(job.postedAt),
                if (job.isUrgent) stringResource(id = R.string.common_urgent) else null,
            )
            if (meta.isNotEmpty()) {
                Text(meta.joinToString(" • "), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (role == KelmahUserRole.WORKER) {
                Text(
                    stringResource(id = R.string.home_tap_open_job),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

@Composable
private fun recommendationBannerColor(state: RecommendationFeedState) = when (state) {
    RecommendationFeedState.FAILED -> MaterialTheme.colorScheme.errorContainer
    RecommendationFeedState.FALLBACK,
    RecommendationFeedState.PROFILE_INCOMPLETE -> MaterialTheme.colorScheme.secondaryContainer
    RecommendationFeedState.PERSONALIZED,
    RecommendationFeedState.IDLE -> MaterialTheme.colorScheme.surfaceVariant
}

@Composable
private fun recommendationBannerTextColor(state: RecommendationFeedState) = when (state) {
    RecommendationFeedState.FAILED -> MaterialTheme.colorScheme.onErrorContainer
    RecommendationFeedState.FALLBACK,
    RecommendationFeedState.PROFILE_INCOMPLETE -> MaterialTheme.colorScheme.onSecondaryContainer
    RecommendationFeedState.PERSONALIZED,
    RecommendationFeedState.IDLE -> MaterialTheme.colorScheme.onSurfaceVariant
}

private fun formatMatchScore(score: Double?): String {
    if (score == null) return "0"
    return if (score % 1.0 == 0.0) {
        score.toInt().toString()
    } else {
        String.format(Locale.US, "%.1f", score)
    }
}

private data class HomePrioritySignal(
    val label: String,
    val count: Int,
    val onOpen: () -> Unit,
)

@Composable
private fun ConversationPreviewCard(
    conversation: ConversationSummary,
    onOpen: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onOpen),
        colors = kelmahPanelColors(),
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
                    AssistChip(
                        onClick = {},
                        enabled = false,
                        label = { Text(stringResource(id = R.string.home_unread_count, conversation.unreadCount)) },
                    )
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
                text = RelativeTimeFormatter.relativeOrFallback(conversation.lastMessageAt)
                    ?: stringResource(id = R.string.common_just_now),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = stringResource(id = R.string.home_tap_open_chat),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
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
        colors = kelmahPanelColors(),
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
                    AssistChip(
                        onClick = {},
                        enabled = false,
                        label = { Text(stringResource(id = R.string.common_new)) },
                    )
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
                    text = RelativeTimeFormatter.relativeOrFallback(notification.createdAt)
                        ?: stringResource(id = R.string.common_just_now),
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
            Text(
                text = stringResource(id = R.string.home_tap_open_alert),
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
            )
        }
    }
}

@Composable
private fun EmptyHomeSection(
    title: String,
    description: String,
) {
    Card(colors = kelmahPanelColors()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
            Text(description, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
