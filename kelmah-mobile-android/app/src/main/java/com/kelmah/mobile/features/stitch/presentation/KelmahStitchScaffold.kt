package com.kelmah.mobile.features.stitch.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kelmah.mobile.core.design.components.KelmahReveal
import com.kelmah.mobile.core.design.components.KelmahScreenBackground
import com.kelmah.mobile.core.design.theme.KelmahSpacing

/**
 * Shared scaffold for the converted Stitch screens. Renders a top app bar slot
 * over the Kelmah gradient background with a scrollable content column.
 */
@Composable
fun KelmahStitchScaffold(
    topBar: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    bottomBar: (@Composable () -> Unit)? = null,
    contentPadding: PaddingValues = PaddingValues(horizontal = KelmahSpacing.lg),
    content: LazyListScope.() -> Unit,
) {
    KelmahScreenBackground {
        Column(modifier = modifier.fillMaxSize()) {
            topBar()
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentPadding = contentPadding,
                verticalArrangement = Arrangement.spacedBy(KelmahSpacing.md),
                content = content,
            )
            bottomBar?.invoke()
        }
    }
}

/** A list item wrapped in the index-based stagger reveal animation. */
fun LazyListScope.revealItem(
    index: Int,
    content: @Composable () -> Unit,
) {
    item {
        KelmahReveal(index = index) { content() }
    }
}

@Composable
fun KelmahStitchSectionTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.onBackground,
        modifier = modifier.padding(top = KelmahSpacing.sm),
    )
}

@Composable
fun KelmahTopSpacer() {
    Box(modifier = Modifier.fillMaxWidth().height(KelmahSpacing.sm))
}
