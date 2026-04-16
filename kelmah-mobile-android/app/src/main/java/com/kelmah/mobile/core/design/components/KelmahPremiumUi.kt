package com.kelmah.mobile.core.design.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.animation.animateContentSize
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardElevation
import androidx.compose.material3.CardColors
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarColors
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

val KelmahPrimaryActionMinHeight: Dp = 48.dp
val KelmahSecondaryActionMinHeight: Dp = 44.dp
val KelmahSectionSpacing: Dp = 12.dp

data class KelmahCommandMetric(
    val label: String,
    val value: String,
)

data class KelmahCommandSignal(
    val label: String,
    val value: String? = null,
    val onClick: (() -> Unit)? = null,
)

@Composable
fun KelmahScreenBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit,
) {
    val isDark = isSystemInDarkTheme()
    val baseGradient = if (isDark) {
        Brush.linearGradient(
            colors = listOf(
                Color(0xFF050507),
                Color(0xFF0E0F14),
                Color(0xFF151722),
            ),
        )
    } else {
        Brush.linearGradient(
            colors = listOf(
                Color(0xFFF9F7ED),
                Color(0xFFF7F3E3),
                Color(0xFFEDE6D2),
            ),
        )
    }

    val glowGradient = if (isDark) {
        Brush.radialGradient(
            colors = listOf(
                Color(0x33FFD34D),
                Color.Transparent,
            ),
            center = Offset(170f, 120f),
            radius = 760f,
        )
    } else {
        Brush.radialGradient(
            colors = listOf(
                Color(0x26B8860B),
                Color.Transparent,
            ),
            center = Offset(180f, 120f),
            radius = 760f,
        )
    }

    val coolGradient = if (isDark) {
        Brush.radialGradient(
            colors = listOf(
                Color(0x1A5DA8FF),
                Color.Transparent,
            ),
            center = Offset(980f, 170f),
            radius = 700f,
        )
    } else {
        Brush.radialGradient(
            colors = listOf(
                Color(0x145DA8FF),
                Color.Transparent,
            ),
            center = Offset(980f, 170f),
            radius = 700f,
        )
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(baseGradient),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(glowGradient),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(coolGradient),
        )
        content()
    }
}

@Composable
fun kelmahPanelColors(): CardColors {
    val alpha = if (isSystemInDarkTheme()) 0.92f else 0.95f
    return CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = alpha),
    )
}

@Composable
fun kelmahMutedPanelColors(): CardColors {
    val alpha = if (isSystemInDarkTheme()) 0.74f else 0.84f
    return CardDefaults.cardColors(
        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = alpha),
    )
}

@Composable
fun kelmahPanelBorder(): BorderStroke {
    val borderColor = if (isSystemInDarkTheme()) {
        Color(0x40FFD34D)
    } else {
        MaterialTheme.colorScheme.outline.copy(alpha = 0.35f)
    }
    return BorderStroke(1.dp, borderColor)
}

@Composable
fun kelmahPanelElevation(): CardElevation = CardDefaults.cardElevation(
    defaultElevation = if (isSystemInDarkTheme()) 8.dp else 4.dp,
)

@Composable
fun KelmahGlassPanel(
    modifier: Modifier = Modifier,
    muted: Boolean = false,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        modifier = modifier.animateContentSize(
            animationSpec = spring(
                dampingRatio = 0.88f,
                stiffness = 540f,
            ),
        ),
        colors = if (muted) kelmahMutedPanelColors() else kelmahPanelColors(),
        shape = MaterialTheme.shapes.large,
        border = kelmahPanelBorder(),
        elevation = kelmahPanelElevation(),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            content = content,
        )
    }
}

@Composable
fun KelmahCommandDeck(
    title: String,
    subtitle: String,
    modifier: Modifier = Modifier,
    eyebrow: String? = null,
    metrics: List<KelmahCommandMetric> = emptyList(),
    signals: List<KelmahCommandSignal> = emptyList(),
) {
    val isDark = isSystemInDarkTheme()
    val deckGradient = if (isDark) {
        Brush.linearGradient(
            colors = listOf(
                Color(0xD9101116),
                Color(0xC6151722),
                Color(0xCC0D0F14),
            ),
            start = Offset.Zero,
            end = Offset(900f, 900f),
        )
    } else {
        Brush.linearGradient(
            colors = listOf(
                Color(0xF5FFFDF4),
                Color(0xF5F9F2DA),
                Color(0xF5EEE4C8),
            ),
            start = Offset.Zero,
            end = Offset(900f, 900f),
        )
    }

    Card(
        modifier = modifier.animateContentSize(
            animationSpec = spring(
                dampingRatio = 0.9f,
                stiffness = 600f,
            ),
        ),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        border = BorderStroke(1.dp, if (isDark) Color(0x52FFD34D) else Color(0x260F172A)),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isDark) 14.dp else 6.dp),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(deckGradient)
                .padding(horizontal = 16.dp, vertical = 14.dp)
                .animateContentSize(
                    animationSpec = spring(
                        dampingRatio = 0.9f,
                        stiffness = 580f,
                    ),
                ),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (!eyebrow.isNullOrBlank()) {
                AssistChip(
                    onClick = {},
                    enabled = false,
                    modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                    label = {
                        Text(
                            text = eyebrow,
                            style = MaterialTheme.typography.labelLarge,
                        )
                    },
                    colors = AssistChipDefaults.assistChipColors(
                        disabledContainerColor = if (isDark) {
                            Color(0x3DFFD34D)
                        } else {
                            Color(0x1EB8860B)
                        },
                        disabledLabelColor = if (isDark) {
                            Color(0xFFFFEAAE)
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        },
                    ),
                )
            }

            Text(
                text = title,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.ExtraBold,
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            if (metrics.isNotEmpty()) {
                Row {
                    metrics.take(3).forEachIndexed { index, metric ->
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(14.dp),
                            color = if (isDark) {
                                Color(0x2D0A0B10)
                            } else {
                                Color(0x66FFFFFF)
                            },
                            border = BorderStroke(1.dp, if (isDark) Color(0x26FFD34D) else Color(0x1A111111)),
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                            ) {
                                Text(
                                    text = metric.value,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                )
                                Text(
                                    text = metric.label,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        if (index < metrics.take(3).lastIndex) {
                            Spacer(modifier = Modifier.width(8.dp))
                        }
                    }
                }
            }

            if (signals.isNotEmpty()) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(signals.take(6), key = { "${it.label}-${it.value}" }) { signal ->
                        AssistChip(
                            onClick = { signal.onClick?.invoke() },
                            enabled = signal.onClick != null,
                            modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                            label = {
                                val suffix = signal.value?.takeIf { it.isNotBlank() }?.let { " $it" }.orEmpty()
                                Text("${signal.label}$suffix")
                            },
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun kelmahTopAppBarColors(): TopAppBarColors = TopAppBarDefaults.topAppBarColors(
    containerColor = Color.Transparent,
    scrolledContainerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
    titleContentColor = MaterialTheme.colorScheme.onBackground,
    actionIconContentColor = MaterialTheme.colorScheme.primary,
    navigationIconContentColor = MaterialTheme.colorScheme.primary,
)

@Composable
fun KelmahReveal(
    index: Int = 0,
    content: @Composable () -> Unit,
) {
    var isVisible by remember { mutableStateOf(false) }

    LaunchedEffect(index) {
        val staggerDelay = (index * 40L).coerceAtMost(280L)
        delay(staggerDelay)
        isVisible = true
    }

    AnimatedVisibility(
        visible = isVisible,
        enter = fadeIn(animationSpec = tween(durationMillis = 320)) +
            slideInVertically(
                initialOffsetY = { fullHeight -> (fullHeight * 0.14f).toInt() },
                animationSpec = tween(durationMillis = 360),
            ),
    ) {
        content()
    }
}
