package com.kelmah.mobile.core.design.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.Chat
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Work
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarDefaults
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemColors
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

data class KelmahBottomNavItem(
    val label: String,
    val selectedIcon: @Composable () -> Unit,
    val unselectedIcon: @Composable () -> Unit,
    val badgeCount: Int? = null,
)

@Composable
fun KelmahBottomNav(
    items: List<KelmahBottomNavItem>,
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    NavigationBar(
        modifier = modifier
            .fillMaxWidth()
            .height(64.dp),
        tonalElevation = 0.dp,
        windowInsets = WindowInsets(
            left = 0,
            top = 0,
            right = 0,
            bottom = 0,
        ),
        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.98f),
        contentColor = MaterialTheme.colorScheme.onSurfaceVariant,
    ) {
        items.forEachIndexed { index, item ->
            NavigationBarItem(
                selected = selectedIndex == index,
                onClick = { onSelect(index) },
                icon = {
                    BadgedBox(
                        badge = {
                            val count = item.badgeCount
                            if (count != null && count > 0) {
                                Badge {
                                    Text(text = count.toString())
                                }
                            }
                        },
                    ) {
                        if (selectedIndex == index) {
                            item.selectedIcon()
                        } else {
                            item.unselectedIcon()
                        }
                    }
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelMedium,
                    )
                },
                colors = NavigationBarItemColors(
                    selectedIconColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    selectedIndicatorColor = MaterialTheme.colorScheme.primaryContainer,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    disabledIconColor = NavigationBarItemDefaults.disabledIconColor(),
                    disabledTextColor = NavigationBarItemDefaults.disabledTextColor(),
                ),
            )
        }
    }
}

object NavigationBarItemDefaults {
    @Composable
    fun disabledIconColor() = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.38f)

    @Composable
    fun disabledTextColor() = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.38f)
}
