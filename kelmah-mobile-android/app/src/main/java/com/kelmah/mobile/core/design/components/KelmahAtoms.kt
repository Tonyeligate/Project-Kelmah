package com.kelmah.mobile.core.design.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kelmah.mobile.core.design.theme.KelmahSpacing
import com.kelmah.mobile.core.design.theme.StitchInfo
import com.kelmah.mobile.core.design.theme.StitchOnInfo
import com.kelmah.mobile.core.design.theme.StitchOnSuccess
import com.kelmah.mobile.core.design.theme.StitchOnWarning
import com.kelmah.mobile.core.design.theme.StitchSuccess
import com.kelmah.mobile.core.design.theme.StitchWarning

/**
 * Stitch atomic components — buttons, chips, badges, toggles, avatars.
 * Specs derived from the Stitch Tailwind HTML (login_1, dashboard_1,
 * browse_trades_1, deposit_funds_1, profile_settings).
 */

enum class KelmahButtonVariant { Primary, Secondary, Ghost }

@Composable
fun KelmahButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KelmahButtonVariant = KelmahButtonVariant.Primary,
    enabled: Boolean = true,
    leadingIcon: (@Composable () -> Unit)? = null,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale = if (pressed) 0.95f else 1f
    val scheme = MaterialTheme.colorScheme

    val container: Color
    val contentColor: Color
    val border: BorderStroke?
    when (variant) {
        KelmahButtonVariant.Primary -> {
            container = scheme.primaryContainer
            contentColor = scheme.onPrimaryContainer
            border = null
        }
        KelmahButtonVariant.Secondary -> {
            container = Color.Transparent
            contentColor = scheme.onSurface
            border = BorderStroke(1.dp, scheme.outline)
        }
        KelmahButtonVariant.Ghost -> {
            container = Color.Transparent
            contentColor = scheme.primary
            border = null
        }
    }

    Surface(
        onClick = onClick,
        enabled = enabled,
        interactionSource = interaction,
        shape = RoundedCornerShape(12.dp),
        color = if (enabled) container else container.copy(alpha = 0.5f),
        contentColor = contentColor,
        border = border,
        modifier = modifier
            .scale(scale)
            .heightIn(min = 48.dp),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 20.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
        ) {
            leadingIcon?.invoke()
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
fun KelmahFab(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: @Composable () -> Unit,
) {
    Surface(
        onClick = onClick,
        shape = CircleShape,
        color = MaterialTheme.colorScheme.primaryContainer,
        contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
        shadowElevation = 12.dp,
        modifier = modifier.size(56.dp),
    ) {
        Box(contentAlignment = Alignment.Center) { icon() }
    }
}

enum class KelmahChipTone { Primary, Surface, Success, Warning, Info, Error }

@Composable
private fun toneColors(tone: KelmahChipTone): Pair<Color, Color> {
    val scheme = MaterialTheme.colorScheme
    return when (tone) {
        KelmahChipTone.Primary -> scheme.primaryContainer to scheme.onPrimaryContainer
        KelmahChipTone.Surface -> scheme.surfaceVariant to scheme.onSurfaceVariant
        KelmahChipTone.Success -> StitchSuccess.copy(alpha = 0.16f) to StitchOnSuccess
        KelmahChipTone.Warning -> StitchWarning.copy(alpha = 0.18f) to StitchOnWarning
        KelmahChipTone.Info -> StitchInfo.copy(alpha = 0.16f) to StitchOnInfo
        KelmahChipTone.Error -> scheme.errorContainer to scheme.onErrorContainer
    }
}

@Composable
fun KelmahSignalChip(
    text: String,
    modifier: Modifier = Modifier,
    tone: KelmahChipTone = KelmahChipTone.Primary,
    selected: Boolean = false,
    onClick: (() -> Unit)? = null,
) {
    val (bg, fg) = toneColors(tone)
    val container = if (selected) bg else bg.copy(alpha = 0.6f)
    val base = Modifier
        .clip(RoundedCornerShape(999.dp))
        .background(container)
        .padding(horizontal = 12.dp, vertical = 6.dp)
    Box(
        modifier = modifier
            .then(if (onClick != null) Modifier.clip(RoundedCornerShape(999.dp)) else Modifier)
            .then(base),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Bold,
            color = fg,
        )
    }
}

@Composable
fun KelmahFilterChip(
    text: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val scheme = MaterialTheme.colorScheme
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(999.dp),
        color = if (selected) scheme.primaryContainer else scheme.surfaceContainer,
        contentColor = if (selected) scheme.onPrimaryContainer else scheme.onSurfaceVariant,
        modifier = modifier.heightIn(min = 36.dp),
    ) {
        Box(modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)) {
            Text(
                text = text,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.SemiBold,
            )
        }
    }
}

@Composable
fun KelmahToggle(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Switch(
        checked = checked,
        onCheckedChange = onCheckedChange,
        enabled = enabled,
        modifier = modifier,
        colors = SwitchDefaults.colors(
            checkedThumbColor = MaterialTheme.colorScheme.onPrimaryContainer,
            checkedTrackColor = MaterialTheme.colorScheme.primaryContainer,
            uncheckedTrackColor = MaterialTheme.colorScheme.surfaceVariant,
        ),
    )
}

@Composable
fun KelmahAvatar(
    initials: String,
    modifier: Modifier = Modifier,
    size: Int = 40,
    online: Boolean = false,
) {
    Box(modifier = modifier.size(size.dp)) {
        Surface(
            shape = CircleShape,
            color = MaterialTheme.colorScheme.primaryContainer,
            contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
            modifier = Modifier.size(size.dp),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = initials.take(2).uppercase(),
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
        if (online) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size((size * 0.28f).coerceAtLeast(8f).dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(1.5.dp)
                    .clip(CircleShape)
                    .background(StitchSuccess),
            )
        }
    }
}

@Composable
fun KelmahDivider(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 0.dp)
            .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
            .heightIn(min = 1.dp, max = 1.dp),
    )
}

@Composable
fun KelmahRadioCard(
    title: String,
    subtitle: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    leading: (@Composable () -> Unit)? = null,
) {
    val scheme = MaterialTheme.colorScheme
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        color = if (selected) scheme.primaryContainer.copy(alpha = 0.1f) else scheme.surface,
        border = BorderStroke(
            width = if (selected) 2.dp else 1.dp,
            color = if (selected) scheme.primary else scheme.outlineVariant,
        ),
        modifier = modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            leading?.invoke()
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = scheme.onSurfaceVariant)
            }
            if (selected) {
                Icon(
                    Icons.Filled.Check,
                    contentDescription = "Selected",
                    tint = scheme.primary,
                )
            }
        }
    }
}

@Composable
fun KelmahProgressStepper(
    activeStep: Int,
    totalSteps: Int,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            repeat(totalSteps) { index ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .heightIn(min = 8.dp, max = 8.dp)
                        .clip(RoundedCornerShape(999.dp))
                        .background(
                            if (index < activeStep) MaterialTheme.colorScheme.primaryContainer
                            else MaterialTheme.colorScheme.surfaceVariant,
                        ),
                )
            }
        }
        Text(
            text = "Step ${activeStep.coerceIn(1, totalSteps)} of $totalSteps",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = KelmahSpacing.sm),
        )
    }
}

@Composable
fun KelmahSearchField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "Search",
    leadingIcon: (@Composable () -> Unit)? = null,
    trailingIcon: (@Composable () -> Unit)? = null,
) {
    val scheme = MaterialTheme.colorScheme
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 48.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(scheme.surface)
            .border(1.dp, scheme.outlineVariant, RoundedCornerShape(12.dp))
            .padding(horizontal = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        leadingIcon?.invoke()
        androidx.compose.foundation.text.BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            textStyle = MaterialTheme.typography.bodyMedium.copy(color = scheme.onSurface),
            modifier = Modifier.weight(1f),
            decorationBox = { inner ->
                if (value.isEmpty()) {
                    Text(
                        placeholder,
                        style = MaterialTheme.typography.bodyMedium,
                        color = scheme.onSurfaceVariant,
                    )
                }
                inner()
            },
        )
        trailingIcon?.invoke()
    }
}
