package com.kelmah.mobile.core.design.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = KelmahNavy,
    primaryContainer = KelmahNavyContainer,
    secondary = KelmahGold,
    background = KelmahBackground,
    surface = KelmahSurface,
)

private val DarkColors = darkColorScheme(
    primary = KelmahGold,
    secondary = KelmahNavy,
)

@Composable
fun KelmahTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = KelmahTypography,
        content = content,
    )
}
