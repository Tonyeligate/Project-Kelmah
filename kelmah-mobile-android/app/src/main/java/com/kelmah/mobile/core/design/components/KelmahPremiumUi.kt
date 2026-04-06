package com.kelmah.mobile.core.design.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CardColors
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

val KelmahPrimaryActionMinHeight: Dp = 48.dp
val KelmahSecondaryActionMinHeight: Dp = 44.dp
val KelmahSectionSpacing: Dp = 12.dp

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
        )
    } else {
        Brush.radialGradient(
            colors = listOf(
                Color(0x26B8860B),
                Color.Transparent,
            ),
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
