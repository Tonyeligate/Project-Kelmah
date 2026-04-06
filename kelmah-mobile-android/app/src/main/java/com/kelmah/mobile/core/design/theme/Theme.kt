package com.kelmah.mobile.core.design.theme

import android.app.Activity
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColors = lightColorScheme(
    primary = KelmahNavy,
    onPrimary = KelmahSurface,
    primaryContainer = KelmahNavyContainer,
    onPrimaryContainer = KelmahSurface,
    secondary = KelmahGold,
    onSecondary = Color(0xFF141414),
    secondaryContainer = KelmahSurfaceVariant,
    onSecondaryContainer = KelmahNavy,
    background = KelmahBackground,
    onBackground = KelmahNavy,
    surface = KelmahSurface,
    onSurface = KelmahNavy,
    surfaceVariant = KelmahSurfaceVariant,
    onSurfaceVariant = KelmahNavyMuted,
    outline = KelmahOutline,
    tertiary = KelmahAccentInfo,
    onTertiary = KelmahSurface,
    error = Color(0xFFB42318),
    onError = KelmahSurface,
    errorContainer = Color(0xFFFEE4E2),
    onErrorContainer = Color(0xFF7A271A),
)

private val DarkColors = darkColorScheme(
    primary = KelmahGoldBright,
    onPrimary = KelmahNavy,
    primaryContainer = KelmahGoldMuted,
    onPrimaryContainer = KelmahDarkOnSurface,
    secondary = KelmahGold,
    onSecondary = Color(0xFF161616),
    background = KelmahDarkBackground,
    onBackground = KelmahDarkOnSurface,
    surface = KelmahDarkSurface,
    onSurface = KelmahDarkOnSurface,
    surfaceVariant = KelmahDarkSurfaceElevated,
    onSurfaceVariant = KelmahDarkOnSurfaceMuted,
    outline = KelmahDarkOutline,
    tertiary = KelmahAccentInfo,
    onTertiary = Color(0xFF081121),
    error = Color(0xFFFF6B6B),
    onError = Color(0xFF2E1111),
    errorContainer = Color(0xFF4A1717),
    onErrorContainer = Color(0xFFFFD6D6),
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
