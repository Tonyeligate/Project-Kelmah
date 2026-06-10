package com.kelmah.mobile.core.design.theme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Stitch 8dp-based spacing scale (source of truth from Tailwind configs).
 */
object KelmahSpacing {
	/** 8dp base unit. */
	val base: Dp = 8.dp

	val xxs: Dp = 2.dp
	val xs: Dp = 4.dp
	val sm: Dp = 8.dp
	val md: Dp = 12.dp
	val lg: Dp = 16.dp
	val xl: Dp = 24.dp
	val xxl: Dp = 32.dp
	val xxxl: Dp = 48.dp

	/** 16dp standard gutter between content blocks. */
	val gutter: Dp = 16.dp

	/** Minimum interactive touch target. */
	val touchTarget: Dp = 48.dp

	/** Mobile screen side margin. */
	val marginMobile: Dp = 16.dp

	/** Desktop / large-screen side margin. */
	val marginDesktop: Dp = 64.dp
}
