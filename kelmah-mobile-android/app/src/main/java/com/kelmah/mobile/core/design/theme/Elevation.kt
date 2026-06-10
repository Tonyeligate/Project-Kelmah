package com.kelmah.mobile.core.design.theme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Stitch elevation tokens mapped from the Tailwind shadow scale.
 *
 * Card:     0 4px 20px rgba(0,0,0,0.04)
 * Elevated: 0 8px 30px rgba(0,0,0,0.08)
 * Modal:    0 20px 40px rgba(0,0,0,0.15)
 *
 * Compose shadows are single-value; these approximate the blur radius so
 * components share a consistent elevation language across the app.
 */
object KelmahElevation {
	val none: Dp = 0.dp
	val card: Dp = 4.dp
	val elevated: Dp = 8.dp
	val modal: Dp = 20.dp
	val fab: Dp = 12.dp
}
