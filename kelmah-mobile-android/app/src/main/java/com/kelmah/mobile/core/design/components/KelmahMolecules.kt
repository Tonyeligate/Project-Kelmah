package com.kelmah.mobile.core.design.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kelmah.mobile.core.design.theme.KelmahElevation
import com.kelmah.mobile.core.design.theme.KelmahSpacing
import com.kelmah.mobile.core.design.theme.StitchInfo
import com.kelmah.mobile.core.design.theme.StitchSuccess
import com.kelmah.mobile.core.design.theme.StitchWarning

data class KelmahFilterTabItem(
    val label: String,
    val count: String? = null,
)

data class KelmahQuickActionItem(
    val label: String,
    val tone: KelmahChipTone = KelmahChipTone.Surface,
    val onClick: () -> Unit,
)

data class KelmahStatBentoItem(
    val label: String,
    val value: String,
    val helper: String? = null,
    val tone: KelmahChipTone = KelmahChipTone.Surface,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KelmahHomeTopBar(
    greeting: String,
    name: String,
    modifier: Modifier = Modifier,
    notificationCount: Int = 0,
    onNotificationsClick: () -> Unit = {},
    onProfileClick: () -> Unit = {},
) {
    TopAppBar(
        modifier = modifier,
        colors = kelmahTopAppBarColors(),
        title = {
            Column {
                Text(
                    text = greeting,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    text = name,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        },
        actions = {
            IconButton(onClick = onNotificationsClick) {
                Box(contentAlignment = Alignment.TopEnd) {
                    Text("Alerts", style = MaterialTheme.typography.labelMedium)
                    if (notificationCount > 0) {
                        KelmahBadgeDot(text = notificationCount.coerceAtMost(99).toString())
                    }
                }
            }
            IconButton(onClick = onProfileClick) {
                KelmahAvatar(initials = name, size = 34)
            }
        },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KelmahChatTopBar(
    title: String,
    subtitle: String,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier,
    online: Boolean = false,
    onCallClick: (() -> Unit)? = null,
    onMoreClick: (() -> Unit)? = null,
) {
    TopAppBar(
        modifier = modifier,
        colors = kelmahTopAppBarColors(),
        navigationIcon = { KelmahTextIconButton(text = "Back", onClick = onBackClick) },
        title = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
                KelmahAvatar(initials = title, size = 38, online = online)
                Column {
                    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(subtitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        },
        actions = {
            onCallClick?.let { KelmahTextIconButton(text = "Call", onClick = it) }
            onMoreClick?.let { KelmahTextIconButton(text = "More", onClick = it) }
        },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KelmahDetailTopBar(
    title: String,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null,
) {
    TopAppBar(
        modifier = modifier,
        colors = kelmahTopAppBarColors(),
        navigationIcon = { KelmahTextIconButton(text = "Back", onClick = onBackClick) },
        title = {
            Column {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (!subtitle.isNullOrBlank()) {
                    Text(subtitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        },
        actions = {
            if (!actionLabel.isNullOrBlank() && onActionClick != null) {
                KelmahTextIconButton(text = actionLabel, onClick = onActionClick)
            }
        },
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KelmahSettingsTopBar(
    title: String,
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier,
    onSaveClick: (() -> Unit)? = null,
    saveEnabled: Boolean = true,
) {
    TopAppBar(
        modifier = modifier,
        colors = kelmahTopAppBarColors(),
        navigationIcon = { KelmahTextIconButton(text = "Back", onClick = onBackClick) },
        title = { Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) },
        actions = {
            onSaveClick?.let {
                KelmahButton(text = "Save", onClick = it, enabled = saveEnabled, variant = KelmahButtonVariant.Ghost)
            }
        },
    )
}

@Composable
fun KelmahJobCard(
    title: String,
    company: String,
    location: String,
    budget: String,
    status: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    description: String? = null,
    postedAt: String? = null,
    urgent: Boolean = false,
) {
    KelmahMoleculeCard(modifier = modifier, onClick = onClick) {
        Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md), verticalAlignment = Alignment.Top) {
            KelmahInitialTile(text = company)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
                Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm), verticalAlignment = Alignment.CenterVertically) {
                    Text(title, modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                    KelmahSignalChip(text = status, tone = if (urgent) KelmahChipTone.Warning else KelmahChipTone.Primary)
                }
                Text(company, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                if (!description.isNullOrBlank()) {
                    Text(description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm), verticalAlignment = Alignment.CenterVertically) {
                    Text(location, modifier = Modifier.weight(1f), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    postedAt?.let { Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
                Text(budget, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable
fun KelmahJobCardCompact(
    title: String,
    budget: String,
    meta: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    status: String? = null,
) {
    KelmahMoleculeCard(modifier = modifier, onClick = onClick, padding = PaddingValues(KelmahSpacing.md)) {
        Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(meta, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(budget, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                status?.let { KelmahSignalChip(text = it, tone = KelmahChipTone.Surface) }
            }
        }
    }
}

@Composable
fun KelmahMessageListItem(
    sender: String,
    preview: String,
    time: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    unreadCount: Int = 0,
    online: Boolean = false,
) {
    Surface(onClick = onClick, color = Color.Transparent, modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(horizontal = KelmahSpacing.lg, vertical = KelmahSpacing.md),
            horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            KelmahAvatar(initials = sender, online = online)
            Column(modifier = Modifier.weight(1f)) {
                Text(sender, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(preview, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(KelmahSpacing.xs)) {
                Text(time, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                if (unreadCount > 0) KelmahBadgeDot(text = unreadCount.coerceAtMost(99).toString())
            }
        }
    }
}

@Composable
fun KelmahNotificationItem(
    title: String,
    body: String,
    time: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    unread: Boolean = false,
    tone: KelmahChipTone = KelmahChipTone.Info,
) {
    Surface(onClick = onClick, color = if (unread) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.12f) else Color.Transparent, modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(KelmahSpacing.lg),
            horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md),
            verticalAlignment = Alignment.Top,
        ) {
            KelmahToneDot(tone = tone)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(KelmahSpacing.xs)) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Text(body, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(time, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
fun KelmahPaymentMethodCard(
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    trailing: String? = null,
) {
    KelmahRadioCard(
        title = title,
        subtitle = subtitle,
        selected = selected,
        onClick = onClick,
        modifier = modifier,
        leading = { KelmahInitialTile(text = trailing ?: title) },
    )
}

@Composable
fun KelmahWalletBalanceCard(
    balance: String,
    label: String,
    onPrimaryAction: () -> Unit,
    modifier: Modifier = Modifier,
    primaryActionLabel: String = "Add funds",
    secondaryText: String? = null,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.extraLarge,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        elevation = CardDefaults.cardElevation(defaultElevation = KelmahElevation.elevated),
    ) {
        Column(modifier = Modifier.padding(KelmahSpacing.lg), verticalArrangement = Arrangement.spacedBy(KelmahSpacing.md)) {
            Text(label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.78f))
            Text(balance, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onPrimaryContainer)
            secondaryText?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.78f)) }
            KelmahButton(text = primaryActionLabel, onClick = onPrimaryAction, variant = KelmahButtonVariant.Secondary)
        }
    }
}

@Composable
fun KelmahSectionPanel(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null,
    content: @Composable () -> Unit,
) {
    KelmahGlassPanel(modifier = modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(KelmahSpacing.lg), verticalArrangement = Arrangement.spacedBy(KelmahSpacing.md)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md)) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    subtitle?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
                if (!actionLabel.isNullOrBlank() && onActionClick != null) {
                    KelmahButton(text = actionLabel, onClick = onActionClick, variant = KelmahButtonVariant.Ghost)
                }
            }
            content()
        }
    }
}

@Composable
fun KelmahChatBubble(
    message: String,
    time: String,
    fromMe: Boolean,
    modifier: Modifier = Modifier,
    status: String? = null,
) {
    Row(modifier = modifier.fillMaxWidth(), horizontalArrangement = if (fromMe) Arrangement.End else Arrangement.Start) {
        Surface(
            modifier = Modifier.fillMaxWidth(0.78f),
            shape = RoundedCornerShape(
                topStart = 18.dp,
                topEnd = 18.dp,
                bottomStart = if (fromMe) 18.dp else 4.dp,
                bottomEnd = if (fromMe) 4.dp else 18.dp,
            ),
            color = if (fromMe) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainer,
            contentColor = if (fromMe) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface,
        ) {
            Column(modifier = Modifier.padding(horizontal = KelmahSpacing.lg, vertical = KelmahSpacing.md), verticalArrangement = Arrangement.spacedBy(KelmahSpacing.xs)) {
                Text(message, style = MaterialTheme.typography.bodyMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.xs), verticalAlignment = Alignment.CenterVertically) {
                    Text(time, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    status?.let { Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
            }
        }
    }
}

@Composable
fun KelmahChatInputBar(
    value: String,
    onValueChange: (String) -> Unit,
    onSendClick: () -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "Message",
    sendEnabled: Boolean = value.isNotBlank(),
) {
    Surface(color = MaterialTheme.colorScheme.surface.copy(alpha = 0.98f), shadowElevation = KelmahElevation.card, modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(KelmahSpacing.md),
            horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            KelmahSearchField(
                value = value,
                onValueChange = onValueChange,
                placeholder = placeholder,
                modifier = Modifier.weight(1f),
            )
            KelmahButton(text = "Send", onClick = onSendClick, enabled = sendEnabled)
        }
    }
}

@Composable
fun KelmahDateSeparator(
    label: String,
    modifier: Modifier = Modifier,
) {
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md)) {
        KelmahDivider(modifier = Modifier.weight(1f))
        Surface(shape = RoundedCornerShape(999.dp), color = MaterialTheme.colorScheme.surfaceContainer) {
            Text(label, modifier = Modifier.padding(horizontal = KelmahSpacing.md, vertical = KelmahSpacing.xs), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        KelmahDivider(modifier = Modifier.weight(1f))
    }
}

@Composable
fun KelmahJobContextCard(
    title: String,
    client: String,
    budget: String,
    modifier: Modifier = Modifier,
    status: String? = null,
    onClick: (() -> Unit)? = null,
) {
    KelmahMoleculeCard(modifier = modifier, onClick = onClick, padding = PaddingValues(KelmahSpacing.md)) {
        Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md), verticalAlignment = Alignment.CenterVertically) {
            KelmahInitialTile(text = client)
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(client, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(budget, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                status?.let { KelmahSignalChip(text = it, tone = KelmahChipTone.Info) }
            }
        }
    }
}

@Composable
fun KelmahAmountInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    currency: String = "GHS",
    placeholder: String = "0.00",
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 56.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.outlineVariant, RoundedCornerShape(16.dp))
            .padding(horizontal = KelmahSpacing.lg),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md),
    ) {
        Text(currency, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            textStyle = MaterialTheme.typography.headlineSmall.copy(color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold),
            modifier = Modifier.weight(1f),
            decorationBox = { inner ->
                if (value.isEmpty()) {
                    Text(placeholder, style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                inner()
            },
        )
    }
}

@Composable
fun KelmahFilterTabs(
    tabs: List<KelmahFilterTabItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyRow(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm), contentPadding = PaddingValues(horizontal = KelmahSpacing.lg)) {
        itemsIndexed(tabs) { index, tab ->
            KelmahFilterChip(
                text = tab.count?.let { "${tab.label} $it" } ?: tab.label,
                selected = selectedIndex == index,
                onClick = { onSelect(index) },
            )
        }
    }
}

@Composable
fun KelmahQuickActionChips(
    actions: List<KelmahQuickActionItem>,
    modifier: Modifier = Modifier,
) {
    LazyRow(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm), contentPadding = PaddingValues(horizontal = KelmahSpacing.lg)) {
        items(actions, key = { it.label }) { action ->
            Surface(
                onClick = action.onClick,
                shape = RoundedCornerShape(999.dp),
                color = MaterialTheme.colorScheme.surfaceContainer,
                contentColor = MaterialTheme.colorScheme.onSurface,
            ) {
                Box(modifier = Modifier.padding(horizontal = KelmahSpacing.md, vertical = KelmahSpacing.sm)) {
                    KelmahSignalChip(text = action.label, tone = action.tone, selected = true)
                }
            }
        }
    }
}

@Composable
fun KelmahStatBento(
    stats: List<KelmahStatBentoItem>,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
        stats.chunked(2).forEach { rowStats ->
            Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
                rowStats.forEach { stat ->
                    KelmahMoleculeCard(modifier = Modifier.weight(1f), padding = PaddingValues(KelmahSpacing.md)) {
                        Column(verticalArrangement = Arrangement.spacedBy(KelmahSpacing.xs)) {
                            KelmahSignalChip(text = stat.label, tone = stat.tone)
                            Text(stat.value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold)
                            stat.helper?.let { Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                        }
                    }
                }
                if (rowStats.size == 1) Spacer(modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
fun KelmahEmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(KelmahSpacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(KelmahSpacing.md),
    ) {
        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(64.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Text("K", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.onPrimaryContainer)
            }
        }
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
        Text(message, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        if (!actionLabel.isNullOrBlank() && onActionClick != null) {
            KelmahButton(text = actionLabel, onClick = onActionClick)
        }
    }
}

@Composable
fun KelmahTrustBadgeRow(
    badges: List<String>,
    modifier: Modifier = Modifier,
    tone: KelmahChipTone = KelmahChipTone.Success,
) {
    LazyRow(modifier = modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm), contentPadding = PaddingValues(horizontal = KelmahSpacing.lg)) {
        items(badges, key = { it }) { badge ->
            KelmahSignalChip(text = badge, tone = tone, selected = true)
        }
    }
}

@Composable
private fun KelmahMoleculeCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    padding: PaddingValues = PaddingValues(KelmahSpacing.lg),
    content: @Composable () -> Unit,
) {
    val shape = RoundedCornerShape(18.dp)
    val cardModifier = modifier.fillMaxWidth()
    val border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f))
    if (onClick != null) {
        Surface(
            onClick = onClick,
            modifier = cardModifier,
            shape = shape,
            color = MaterialTheme.colorScheme.surface,
            border = border,
            shadowElevation = KelmahElevation.card,
        ) {
            Box(modifier = Modifier.padding(padding)) { content() }
        }
    } else {
        Surface(
            modifier = cardModifier,
            shape = shape,
            color = MaterialTheme.colorScheme.surface,
            border = border,
            shadowElevation = KelmahElevation.card,
        ) {
            Box(modifier = Modifier.padding(padding)) { content() }
        }
    }
}

@Composable
private fun KelmahInitialTile(
    text: String,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.size(44.dp),
        shape = RoundedCornerShape(14.dp),
        color = MaterialTheme.colorScheme.surfaceContainerHighest,
        contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(text.take(2).uppercase(), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun KelmahBadgeDot(
    text: String,
    modifier: Modifier = Modifier,
) {
    Surface(modifier = modifier.height(18.dp).width(18.dp), shape = CircleShape, color = MaterialTheme.colorScheme.error, contentColor = MaterialTheme.colorScheme.onError) {
        Box(contentAlignment = Alignment.Center) {
            Text(text, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun KelmahToneDot(
    tone: KelmahChipTone,
    modifier: Modifier = Modifier,
) {
    val color = when (tone) {
        KelmahChipTone.Success -> StitchSuccess
        KelmahChipTone.Warning -> StitchWarning
        KelmahChipTone.Info -> StitchInfo
        KelmahChipTone.Error -> MaterialTheme.colorScheme.error
        KelmahChipTone.Primary -> MaterialTheme.colorScheme.primary
        KelmahChipTone.Surface -> MaterialTheme.colorScheme.outline
    }
    Box(modifier = modifier.size(12.dp).clip(CircleShape).background(color))
}

@Composable
private fun KelmahTextIconButton(
    text: String,
    onClick: () -> Unit,
) {
    IconButton(onClick = onClick) {
        Text(text, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
    }
}
