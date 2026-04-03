package com.kelmah.mobile.core.design.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val KelmahFontFamily = FontFamily.SansSerif

val KelmahTypography = Typography(
	displaySmall = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 36.sp,
		lineHeight = 40.sp,
		letterSpacing = (-0.4).sp,
	),
	headlineMedium = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 28.sp,
		lineHeight = 34.sp,
		letterSpacing = (-0.2).sp,
	),
	headlineSmall = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 24.sp,
		lineHeight = 30.sp,
	),
	titleLarge = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 20.sp,
		lineHeight = 26.sp,
	),
	titleMedium = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 18.sp,
		lineHeight = 24.sp,
	),
	titleSmall = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 16.sp,
		lineHeight = 22.sp,
	),
	bodyLarge = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Normal,
		fontSize = 16.sp,
		lineHeight = 24.sp,
	),
	bodyMedium = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Normal,
		fontSize = 15.sp,
		lineHeight = 22.sp,
	),
	bodySmall = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Normal,
		fontSize = 13.sp,
		lineHeight = 18.sp,
	),
	labelLarge = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 14.sp,
		lineHeight = 18.sp,
	),
	labelMedium = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 12.sp,
		lineHeight = 16.sp,
	),
	labelSmall = TextStyle(
		fontFamily = KelmahFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 11.sp,
		lineHeight = 14.sp,
	),
)
