package com.kelmah.mobile.core.design.theme

import androidx.compose.ui.graphics.Color

val StitchPrimary = Color(0xFF705D00)
val StitchPrimaryContainer = Color(0xFFFFD700)
val StitchOnPrimary = Color(0xFFFFFFFF)
val StitchOnPrimaryContainer = Color(0xFF221B00)
val StitchBackground = Color(0xFFF9F9F9)
val StitchSurface = Color(0xFFF9F9F9)
val StitchSurfaceContainerLow = Color(0xFFF3F3F4)
val StitchSurfaceContainer = Color(0xFFEEEEEE)
val StitchSurfaceVariant = Color(0xFFE2E2E2)
val StitchOutline = Color(0xFF7E775F)
val StitchOutlineVariant = Color(0xFFD0C6AB)
val StitchOnSurface = Color(0xFF1A1C1C)
val StitchOnSurfaceVariant = Color(0xFF4D4732)
val StitchError = Color(0xFFBA1A1A)
val StitchErrorContainer = Color(0xFFFFDAD6)
val StitchOnErrorContainer = Color(0xFF410002)
val StitchSuccess = Color(0xFF10B981)
val StitchOnSuccess = Color(0xFF047857)
val StitchWarning = Color(0xFFFFB03A)
val StitchOnWarning = Color(0xFF8A5A00)
val StitchInfo = Color(0xFF3B82F6)
val StitchOnInfo = Color(0xFF1D4ED8)
val StitchInfoContainer = Color(0xFFD7E3FF)
val StitchOnInfoContainer = Color(0xFF001B3F)
val StitchDarkPrimary = Color(0xFFE9C400)
val StitchDarkBackground = Color(0xFF1A1C1C)
val StitchDarkSurface = Color(0xFF2F3131)
val StitchDarkSurfaceVariant = Color(0xFF474A4A)
val StitchDarkOnSurface = Color(0xFFF0F1F1)
val StitchDarkOnSurfaceVariant = Color(0xFFD0C6AB)
val StitchDarkOnSecondary = Color(0xFF161616)
val StitchDarkOnTertiary = Color(0xFF081121)
val StitchDarkError = Color(0xFFFFB4AB)
val StitchDarkOnError = Color(0xFF2E1111)
val StitchDarkErrorContainer = Color(0xFF4A1717)
val StitchDarkOnErrorContainer = Color(0xFFFFD6D6)

// Existing aliases are preserved so current screens inherit Stitch without rewrites.
val KelmahNavy = StitchOnSurface
val KelmahNavyContainer = StitchPrimary
val KelmahNavyMuted = StitchOnSurfaceVariant.copy(alpha = 0.72f)
val KelmahGold = StitchPrimaryContainer
val KelmahGoldBright = Color(0xFFFFE36D)
val KelmahGoldMuted = StitchDarkPrimary
val KelmahBackground = StitchBackground
val KelmahSurface = StitchSurface
val KelmahSurfaceVariant = StitchSurfaceVariant
val KelmahOutline = StitchOutlineVariant
val KelmahDarkBackground = StitchDarkBackground
val KelmahDarkSurface = StitchDarkSurface
val KelmahDarkSurfaceElevated = StitchDarkSurfaceVariant
val KelmahDarkOutline = StitchDarkPrimary.copy(alpha = 0.35f)
val KelmahDarkOnSurface = StitchDarkOnSurface
val KelmahDarkOnSurfaceMuted = StitchDarkOnSurfaceVariant

val KelmahAccentPositive = StitchSuccess
val KelmahAccentWarning = StitchWarning
val KelmahAccentInfo = StitchInfo
