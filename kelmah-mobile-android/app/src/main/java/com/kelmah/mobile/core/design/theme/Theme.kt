package com.kelmah.mobile.core.design.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.foundation.isSystemInDarkTheme

private val LightColors = lightColorScheme(
    primary = KelmahNavy,
    onPrimary = KelmahSurface,
    primaryContainer = KelmahNavyContainer,
    onPrimaryContainer = KelmahSurface,
    secondary = KelmahGold,
    onSecondary = KelmahNavy,
    secondaryContainer = KelmahSurfaceVariant,
    onSecondaryContainer = KelmahNavy,
    background = KelmahBackground,
    onBackground = KelmahNavy,
    surface = KelmahSurface,
    onSurface = KelmahNavy,
    surfaceVariant = KelmahSurfaceVariant,
    onSurfaceVariant = KelmahNavyMuted,
    outline = KelmahOutline,
)

private val DarkColors = darkColorScheme(
    primary = KelmahGoldBright,
    onPrimary = KelmahNavy,
    primaryContainer = KelmahGoldMuted,
    onPrimaryContainer = KelmahDarkOnSurface,
    secondary = KelmahGold,
    onSecondary = KelmahNavy,
    background = KelmahDarkBackground,
    onBackground = KelmahDarkOnSurface,
    surface = KelmahDarkSurface,
    onSurface = KelmahDarkOnSurface,
    surfaceVariant = KelmahDarkSurfaceElevated,
    onSurfaceVariant = KelmahDarkOnSurfaceMuted,
    outline = KelmahDarkOutline,
)

@Composable
fun KelmahTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = KelmahTypography,
        content = content,
    )
}
