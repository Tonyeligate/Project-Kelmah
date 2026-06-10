@file:OptIn(ExperimentalTextApi::class)

package com.kelmah.mobile.core.design.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.ExperimentalTextApi
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.kelmah.mobile.R

private fun montserrat(weight: Int): Font = Font(
	resId = R.font.montserrat_variable,
	weight = FontWeight(weight),
	variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

private fun inter(weight: Int): Font = Font(
	resId = R.font.inter_variable,
	weight = FontWeight(weight),
	variationSettings = FontVariation.Settings(FontVariation.weight(weight)),
)

// Montserrat drives headlines/display (Stitch source of truth).
private val KelmahDisplayFontFamily = FontFamily(
	montserrat(400),
	montserrat(500),
	montserrat(600),
	montserrat(700),
	montserrat(800),
)

// Inter drives body and label text.
private val KelmahBodyFontFamily = FontFamily(
	inter(400),
	inter(500),
	inter(600),
)

val KelmahTypography = Typography(
	displayLarge = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 48.sp,
		lineHeight = 56.sp,
		letterSpacing = (-0.96).sp,
	),
	displayMedium = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 36.sp,
		lineHeight = 44.sp,
		letterSpacing = (-0.72).sp,
	),
	displaySmall = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 32.sp,
		lineHeight = 40.sp,
		letterSpacing = (-0.64).sp,
	),
	headlineLarge = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Bold,
		fontSize = 28.sp,
		lineHeight = 34.sp,
		letterSpacing = (-0.56).sp,
	),
	headlineMedium = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 24.sp,
		lineHeight = 32.sp,
		letterSpacing = (-0.24).sp,
	),
	headlineSmall = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 21.sp,
		lineHeight = 27.sp,
	),
	titleLarge = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 20.sp,
		lineHeight = 25.sp,
	),
	titleMedium = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 17.sp,
		lineHeight = 23.sp,
	),
	titleSmall = TextStyle(
		fontFamily = KelmahDisplayFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 15.sp,
		lineHeight = 21.sp,
	),
	bodyLarge = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Normal,
		fontSize = 18.sp,
		lineHeight = 28.sp,
	),
	bodyMedium = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Normal,
		fontSize = 16.sp,
		lineHeight = 24.sp,
	),
	bodySmall = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 12.sp,
		lineHeight = 16.sp,
	),
	labelLarge = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 14.sp,
		lineHeight = 20.sp,
	),
	labelMedium = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.SemiBold,
		fontSize = 14.sp,
		lineHeight = 20.sp,
	),
	labelSmall = TextStyle(
		fontFamily = KelmahBodyFontFamily,
		fontWeight = FontWeight.Medium,
		fontSize = 11.sp,
		lineHeight = 14.sp,
	),
)
