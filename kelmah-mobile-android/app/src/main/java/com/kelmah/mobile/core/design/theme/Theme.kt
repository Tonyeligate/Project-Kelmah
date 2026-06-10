package com.kelmah.mobile.core.design.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = StitchPrimary,
    onPrimary = StitchOnPrimary,
    primaryContainer = StitchPrimaryContainer,
    onPrimaryContainer = StitchOnPrimaryContainer,
    secondary = StitchPrimaryContainer,
    onSecondary = StitchOnPrimaryContainer,
    secondaryContainer = StitchSurfaceContainer,
    onSecondaryContainer = StitchOnSurface,
    background = StitchBackground,
    onBackground = StitchOnSurface,
    surface = StitchSurface,
    onSurface = StitchOnSurface,
    surfaceVariant = StitchSurfaceVariant,
    onSurfaceVariant = StitchOnSurfaceVariant,
    outline = StitchOutline,
    outlineVariant = StitchOutlineVariant,
    tertiary = StitchInfo,
    onTertiary = StitchOnPrimary,
    tertiaryContainer = StitchInfoContainer,
    onTertiaryContainer = StitchOnInfoContainer,
    error = StitchError,
    onError = StitchOnPrimary,
    errorContainer = StitchErrorContainer,
    onErrorContainer = StitchOnErrorContainer,
)

private val DarkColors = darkColorScheme(
    primary = StitchDarkPrimary,
    onPrimary = StitchOnPrimaryContainer,
    primaryContainer = StitchPrimary,
    onPrimaryContainer = StitchDarkOnSurface,
    secondary = StitchDarkPrimary,
    onSecondary = StitchDarkOnSecondary,
    secondaryContainer = StitchDarkSurfaceVariant,
    onSecondaryContainer = StitchDarkOnSurface,
    background = StitchDarkBackground,
    onBackground = StitchDarkOnSurface,
    surface = StitchDarkSurface,
    onSurface = StitchDarkOnSurface,
    surfaceVariant = StitchDarkSurfaceVariant,
    onSurfaceVariant = StitchDarkOnSurfaceVariant,
    outline = StitchOutlineVariant,
    outlineVariant = StitchDarkSurfaceVariant,
    tertiary = StitchInfo,
    onTertiary = StitchDarkOnTertiary,
    error = StitchDarkError,
    onError = StitchDarkOnError,
    errorContainer = StitchDarkErrorContainer,
    onErrorContainer = StitchDarkOnErrorContainer,
)

@Composable
fun KelmahTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = !darkTheme
            insetsController.isAppearanceLightNavigationBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = KelmahTypography,
        shapes = KelmahShapes,
        content = content,
    )
}
