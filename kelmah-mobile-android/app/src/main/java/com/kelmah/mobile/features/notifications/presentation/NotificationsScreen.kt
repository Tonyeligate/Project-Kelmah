package com.kelmah.mobile.features.notifications.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.DoneAll
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.core.design.components.KelmahScreenBackground
import com.kelmah.mobile.core.design.components.KelmahReveal
import com.kelmah.mobile.core.design.components.KelmahSecondaryActionMinHeight
import com.kelmah.mobile.core.design.components.kelmahMutedPanelColors
import com.kelmah.mobile.core.design.components.kelmahTopAppBarColors
import com.kelmah.mobile.features.notifications.data.NotificationItem
import com.kelmah.mobile.features.notifications.data.actionLabel
import com.kelmah.mobile.features.notifications.data.actionTarget
import com.kelmah.mobile.features.notifications.data.displayTag
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    onOpenNotification: (NotificationItem) -> Unit = {},
    viewModel: NotificationsViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbars = remember { SnackbarHostState() }
    val totalAlerts = state.notifications.size
    val actionableAlerts = state.notifications.count { it.actionTarget != null }

    LaunchedEffect(state.errorMessage) {
        state.errorMessage?.let {
            snackbars.showSnackbar(it)
            viewModel.clearMessages()
        }
    }
    LaunchedEffect(state.infoMessage) {
        state.infoMessage?.let {
            snackbars.showSnackbar(it)
            viewModel.clearMessages()
        }
    }

    KelmahScreenBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = {
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text("Alerts")
                            Text(
                                text = "Priority updates from messages and jobs",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    },
                    colors = kelmahTopAppBarColors(),
                    actions = {
                        IconButton(onClick = viewModel::refresh) {
                            Icon(Icons.Outlined.Refresh, contentDescription = "Refresh alerts")
                        }
                        IconButton(
                            onClick = viewModel::markAllAsRead,
                            enabled = state.unreadCount > 0 && state.isMutating.not(),
                        ) {
                            Icon(Icons.Outlined.DoneAll, contentDescription = "Mark all as read")
                        }
                    },
                )
            },
            snackbarHost = { SnackbarHost(snackbars) },
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp, vertical = 14.dp),
            ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                FilterChip(
                    selected = state.unreadOnly.not(),
                    onClick = { viewModel.setUnreadOnly(false) },
                    modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                    label = { Text("All") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.secondary,
                        selectedLabelColor = MaterialTheme.colorScheme.onSecondary,
                    ),
                )
                FilterChip(
                    selected = state.unreadOnly,
                    onClick = { viewModel.setUnreadOnly(true) },
                    modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                    label = { Text("New") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = MaterialTheme.colorScheme.secondary,
                        selectedLabelColor = MaterialTheme.colorScheme.onSecondary,
                    ),
                )
                Spacer(modifier = Modifier.weight(1f))
                AssistChip(
                    onClick = {},
                    enabled = false,
                    modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                    label = { Text("${state.unreadCount} new") },
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            KelmahReveal(index = 0) {
                Card(colors = kelmahMutedPanelColors(), shape = MaterialTheme.shapes.large) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        NotificationDensityTile(
                            modifier = Modifier.weight(1f),
                            label = "Total",
                            value = totalAlerts,
                        )
                        NotificationDensityTile(
                            modifier = Modifier.weight(1f),
                            label = "Unread",
                            value = state.unreadCount,
                        )
                        NotificationDensityTile(
                            modifier = Modifier.weight(1f),
                            label = "Action",
                            value = actionableAlerts,
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            when {
                state.isLoading && state.notifications.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            CircularProgressIndicator()
                            Text("Loading alerts...")
                        }
                    }
                }

                state.notifications.isEmpty() -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        EmptyStateCard(
                            title = if (state.unreadOnly) "No new alerts" else "No alerts yet",
                            subtitle = "New job and message updates will show here.",
                        )
                    }
                }

                else -> {
                    GroupedNotificationsList(
                        notifications = state.notifications,
                        isMutating = state.isMutating,
                        onMarkRead = { viewModel.markAsRead(it.id) },
                        onDelete = { viewModel.deleteNotification(it.id) },
                        onOpen = onOpenNotification,
                    )
                }
            }
        }
        }
    }
}

@Composable
internal fun NotificationCard(
    notification: NotificationItem,
    isMutating: Boolean,
    onMarkRead: () -> Unit,
    onDelete: () -> Unit,
    onOpen: () -> Unit,
) {
    val actionTarget = notification.actionTarget

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = actionTarget != null) {
                if (!notification.isRead) onMarkRead()
                onOpen()
            },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (notification.isRead) {
                MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)
            } else {
                MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.35f)
            },
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AssistChip(
                    onClick = {},
                    enabled = false,
                    label = { Text(notification.displayTag) },
                )
                Spacer(modifier = Modifier.weight(1f))
                if (!notification.isRead) {
                    Text(
                        text = "New",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }

            Text(
                text = notification.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = notification.content,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = com.kelmah.mobile.core.utils.RelativeTimeFormatter.relativeOrFallback(notification.createdAt) ?: "Just now",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(modifier = Modifier.weight(1f))

                if (actionTarget != null) {
                    TextButton(
                        onClick = {
                            if (!notification.isRead) onMarkRead()
                            onOpen()
                        },
                        enabled = isMutating.not(),
                        modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                    ) {
                        Text(notification.actionLabel ?: "Open")
                    }
                }

                if (!notification.isRead) {
                    TextButton(
                        onClick = onMarkRead,
                        enabled = isMutating.not(),
                        modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                    ) {
                        Text("Mark as read")
                    }
                }
                IconButton(
                    onClick = onDelete,
                    enabled = isMutating.not(),
                    modifier = Modifier.size(KelmahSecondaryActionMinHeight),
                ) {
                    Icon(Icons.Outlined.DeleteOutline, contentDescription = "Delete alert")
                }
            }

            if (actionTarget != null) {
                Text(
                    text = "Tap to open alert",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}

@Composable
internal fun GroupedNotificationsList(
    notifications: List<NotificationItem>,
    isMutating: Boolean,
    onMarkRead: (NotificationItem) -> Unit,
    onDelete: (NotificationItem) -> Unit,
    onOpen: (NotificationItem) -> Unit,
    currentDateProvider: () -> LocalDate = { LocalDate.now(ZoneOffset.UTC) },
) {
    val currentDate = currentDateProvider()
    val groupedNotifications = remember(notifications, currentDate) {
        groupNotifications(notifications, currentDate)
    }

    LazyColumn(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        itemsIndexed(groupedNotifications, key = { _, section -> section.key }) { sectionIndex, section ->
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = section.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.SemiBold,
                )

                section.buckets.forEachIndexed { bucketIndex, bucket ->
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = bucket.title,
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontWeight = FontWeight.Medium,
                        )

                        bucket.notifications.forEachIndexed { notificationIndex, notification ->
                            KelmahReveal(index = sectionIndex * 9 + bucketIndex * 3 + notificationIndex) {
                                NotificationCard(
                                    notification = notification,
                                    isMutating = isMutating,
                                    onMarkRead = { onMarkRead(notification) },
                                    onDelete = { onDelete(notification) },
                                    onOpen = { onOpen(notification) },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationDensityTile(
    modifier: Modifier = Modifier,
    label: String,
    value: Int,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.9f)),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = value.toString(),
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

private data class NotificationSection(
    val key: String,
    val title: String,
    val buckets: List<NotificationBucket>,
)

private data class NotificationBucket(
    val key: String,
    val title: String,
    val notifications: List<NotificationItem>,
)

private enum class NotificationTimeBucket(
    val key: String,
    val title: String,
) {
    TODAY("today", "Today"),
    YESTERDAY("yesterday", "Yesterday"),
    EARLIER("earlier", "Earlier"),
}

private val notificationObjectIdRegex = Regex("^[0-9a-fA-F]{24}$")

private fun groupNotifications(
    items: List<NotificationItem>,
    currentDate: LocalDate = LocalDate.now(ZoneOffset.UTC),
): List<NotificationSection> {
    if (items.isEmpty()) return emptyList()

    val groupedBySection = items.groupBy { notification ->
        when {
            notification.priority.equals("high", ignoreCase = true) -> "priority"
            notification.actionTarget is com.kelmah.mobile.features.notifications.data.NotificationActionTarget.Conversation -> "messages"
            notification.actionTarget is com.kelmah.mobile.features.notifications.data.NotificationActionTarget.Job -> "jobs"
            else -> "general"
        }
    }

    val orderedSectionKeys = listOf("priority", "messages", "jobs", "general")
    return orderedSectionKeys.mapNotNull { sectionKey ->
        val notificationsInSection = groupedBySection[sectionKey].orEmpty()
        if (notificationsInSection.isEmpty()) {
            null
        } else {
            val sorted = notificationsInSection.sortedWith(
                compareByDescending<NotificationItem> { notificationSortInstant(it) ?: Instant.EPOCH }
                    .thenByDescending { it.id },
            )

            val buckets = NotificationTimeBucket.entries.mapNotNull { bucket ->
                val bucketNotifications = sorted.filter {
                    resolveNotificationBucket(it, currentDate) == bucket
                }
                if (bucketNotifications.isEmpty()) {
                    null
                } else {
                    NotificationBucket(
                        key = "${sectionKey}-${bucket.key}",
                        title = bucket.title,
                        notifications = bucketNotifications,
                    )
                }
            }

            NotificationSection(
                key = sectionKey,
                title = when (sectionKey) {
                    "priority" -> "Priority"
                    "messages" -> "Messages"
                    "jobs" -> "Jobs"
                    else -> "General"
                },
                buckets = buckets,
            )
        }
    }
}

private fun resolveNotificationBucket(
    notification: NotificationItem,
    currentDate: LocalDate,
): NotificationTimeBucket {
    val instant = notificationSortInstant(notification) ?: return NotificationTimeBucket.EARLIER
    val messageDate = instant.atZone(ZoneOffset.UTC).toLocalDate()
    return when {
        messageDate == currentDate -> NotificationTimeBucket.TODAY
        messageDate == currentDate.minusDays(1) -> NotificationTimeBucket.YESTERDAY
        else -> NotificationTimeBucket.EARLIER
    }
}

private fun notificationSortInstant(notification: NotificationItem): Instant? {
    val createdAt = notification.createdAt?.trim().orEmpty()
    if (createdAt.isNotBlank()) {
        runCatching { Instant.parse(createdAt) }.getOrNull()?.let { return it }
        runCatching { java.time.OffsetDateTime.parse(createdAt).toInstant() }.getOrNull()?.let { return it }
        runCatching { java.time.LocalDateTime.parse(createdAt).toInstant(ZoneOffset.UTC) }.getOrNull()?.let { return it }
    }

    val normalizedId = notification.id.trim()
    if (!notificationObjectIdRegex.matches(normalizedId)) {
        return null
    }

    val objectIdEpochSeconds = normalizedId.substring(0, 8).toLongOrNull(16) ?: return null
    return Instant.ofEpochSecond(objectIdEpochSeconds)
}

@Composable
private fun EmptyStateCard(
    title: String,
    subtitle: String,
) {
    Card(colors = kelmahMutedPanelColors()) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Surface(
                modifier = Modifier.size(56.dp),
                shape = RoundedCornerShape(18.dp),
                color = MaterialTheme.colorScheme.primaryContainer,
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Outlined.NotificationsNone,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                    )
                }
            }
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
