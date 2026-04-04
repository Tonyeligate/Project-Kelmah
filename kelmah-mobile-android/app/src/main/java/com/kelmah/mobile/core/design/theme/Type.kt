package com.kelmah.mobile.core.design.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val KelmahDisplayFontFamily = FontFamily.Serif
private val KelmahBodyFontFamily = FontFamily.SansSerif

val KelmahTypography = Typography(
	displayLarge = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 44.sp,
		lineHeight = 48.sp,
		letterSpacing = (-0.6).sp,
	),
	displayMedium = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 40.sp,
		lineHeight = 44.sp,
		letterSpacing = (-0.5).sp,
	),
	displaySmall = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 36.sp,
		lineHeight = 40.sp,
		letterSpacing = (-0.4).sp,
	),
	headlineLarge = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 32.sp,
		lineHeight = 38.sp,
		letterSpacing = (-0.3).sp,
	),
	headlineMedium = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 28.sp,
		lineHeight = 34.sp,
		letterSpacing = (-0.2).sp,
	),
	headlineSmall = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 24.sp,
		lineHeight = 30.sp,
	),
	titleLarge = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 20.sp,
		lineHeight = 26.sp,
	),
	titleMedium = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 18.sp,
		lineHeight = 24.sp,
	),
	titleSmall = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 16.sp,
		lineHeight = 22.sp,
	),
	bodyLarge = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Normal,
		fontSize = 16.sp,
		lineHeight = 24.sp,
	),
	bodyMedium = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Normal,
		fontSize = 15.sp,
		lineHeight = 22.sp,
	),
	bodySmall = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Normal,
		fontSize = 13.sp,
		lineHeight = 18.sp,
	),
	labelLarge = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 14.sp,
		lineHeight = 18.sp,
	),
	labelMedium = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 12.sp,
		lineHeight = 16.sp,
	),
	labelSmall = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 11.sp,
		lineHeight = 14.sp,
	),
)
