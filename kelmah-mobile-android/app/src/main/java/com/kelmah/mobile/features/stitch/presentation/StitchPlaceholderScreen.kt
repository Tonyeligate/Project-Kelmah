package com.kelmah.mobile.features.stitch.presentation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Construction
import androidx.compose.material.icons.outlined.DarkMode
import androidx.compose.material.icons.outlined.LightMode
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.kelmah.mobile.core.design.components.KelmahScreenBackground

data class StitchScreenSpec(
    val title: String,
    val source: String,
    val category: String,
    val description: String,
    val sections: List<String>,
    val primaryAction: String = "Continue",
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StitchPlaceholderScreen(
    spec: StitchScreenSpec,
    onBack: (() -> Unit)? = null,
    onPrimaryAction: (() -> Unit)? = null,
) {
    KelmahScreenBackground {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (onBack != null) {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back")
                        }
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = spec.category.uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = spec.title,
                            style = MaterialTheme.typography.headlineMedium,
                            color = MaterialTheme.colorScheme.onBackground,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                    Surface(
                        modifier = Modifier.size(42.dp),
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primaryContainer,
                        contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Construction,
                            contentDescription = null,
                            modifier = Modifier.padding(10.dp),
                        )
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = MaterialTheme.shapes.extraLarge,
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Text(
                            text = spec.description,
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.onSurface,
                        )
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AssistChip(
                                onClick = {},
                                label = { Text(spec.source) },
                                leadingIcon = { Icon(Icons.Outlined.VerifiedUser, contentDescription = null) },
                                colors = AssistChipDefaults.assistChipColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                                    labelColor = MaterialTheme.colorScheme.onPrimaryContainer,
                                    leadingIconContentColor = MaterialTheme.colorScheme.onPrimaryContainer,
                                ),
                                border = null,
                            )
                            AssistChip(
                                onClick = {},
                                label = { Text("Light mode") },
                                leadingIcon = { Icon(Icons.Outlined.LightMode, contentDescription = null) },
                            )
                            AssistChip(
                                onClick = {},
                                label = { Text("Dark mode") },
                                leadingIcon = { Icon(Icons.Outlined.DarkMode, contentDescription = null) },
                            )
                        }
                    }
                }
            }

            item {
                RealStitchBody(spec = spec)
            }

            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = { onPrimaryAction?.invoke() },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(spec.primaryAction)
                    }
                    if (onBack != null) {
                        OutlinedButton(
                            onClick = onBack,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("Back")
                        }
                    }
                    Spacer(modifier = Modifier.height(18.dp))
                }
            }
        }
    }
}

@Composable
private fun RealStitchBody(spec: StitchScreenSpec) {
    when {
        spec.category in setOf("Auth", "Onboarding") -> AuthAndOnboardingBody(spec)
        spec.category == "Wallet" -> WalletBody(spec)
        spec.category in setOf("Discovery", "Hiring") -> MarketplaceBody(spec)
        spec.category == "Messaging" -> ChatBody()
        spec.category in setOf("Projects", "Milestones", "Contracts") -> ProjectContractBody(spec)
        spec.category == "Disputes" -> DisputeBody(spec)
        spec.category in setOf("Profile", "Settings", "Security", "Verification", "Support") -> SettingsBody(spec)
        spec.category == "Admin" -> AdminBody(spec)
        else -> SectionCards(spec.sections)
    }
}

@Composable
private fun AuthAndOnboardingBody(spec: StitchScreenSpec) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (spec.category == "Onboarding") {
            MetricHeroCard(title = spec.title, value = "Kelmah", subtitle = "Verified pros. Secure escrow. Track every milestone.")
            ProgressSegments(active = 2, total = 3)
        }
        spec.sections.forEach { SectionCard(title = it, subtitle = "Stitch flow content with actionable native controls.") }
        if (spec.title.contains("Role", ignoreCase = true)) {
            ChoiceCard("I want to Hire", "Post jobs, compare proposals, and fund escrow securely.")
            ChoiceCard("I want to Work", "Find jobs, submit proposals, and build verified reputation.", selected = true)
        } else if (spec.title.contains("email", ignoreCase = true) || spec.source.contains("verify", ignoreCase = true)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                repeat(6) { OtpBox(index = it + 1, modifier = Modifier.weight(1f)) }
            }
        } else {
            listOf("Full name", "Email address", "Phone number", "Password").forEach { label ->
                OutlinedTextField(value = "", onValueChange = {}, label = { Text(label) }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            }
        }
    }
}

@Composable
private fun WalletBody(spec: StitchScreenSpec) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        MetricHeroCard(title = spec.title, value = if (spec.title.contains("Earnings")) "GH₵ 3,240.50" else "GH₵ 4,250.00", subtitle = "Available balance and escrow activity")
        if (spec.title.contains("Deposit", ignoreCase = true) || spec.title.contains("Withdraw", ignoreCase = true)) {
            OutlinedTextField(value = "", onValueChange = {}, label = { Text("Amount") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
            ChoiceCard("MTN Mobile Money", "Default payout and deposit method", selected = true)
            ChoiceCard("Card Payment", "Visa ending 4242")
        }
        listOf("Milestone Payment", "Withdrawal to Bank", "Wallet Top-Up").forEachIndexed { index, title ->
            TransactionRow(title, if (index == 1) "- GH₵ 800.00" else "+ GH₵ ${450 + index * 250}.00", index != 1)
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun MarketplaceBody(spec: StitchScreenSpec) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedTextField(value = "", onValueChange = {}, label = { Text(if (spec.category == "Hiring") "Job title" else "Search trade or location") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Plumbing", "Electrical", "Carpentry", "Painting", "Masonry").forEach { trade ->
                AssistChip(onClick = {}, label = { Text(trade) })
            }
        }
        listOf("Emergency Pipe Repair", "Kitchen Cabinet Build", "Commercial HVAC Retrofit").forEachIndexed { index, title ->
            ListingCard(title, if (index == 0) "Urgent" else "Verified", "East Legon • GH₵ ${600 + index * 400}")
        }
    }
}

@Composable
private fun ChatBody() {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        ChatBubble("Hi, can you share photos of the current wiring panel?", incoming = true)
        ChatBubble("Uploaded two photos and marked the location. I can start tomorrow morning.", incoming = false)
        SectionCard("Job context", "Full House Wiring • Active contract • Escrow funded")
        OutlinedTextField(value = "", onValueChange = {}, label = { Text("Message") }, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
private fun ProjectContractBody(spec: StitchScreenSpec) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        MetricHeroCard(title = spec.title, value = "75%", subtitle = "Project progress with escrow protection")
        listOf("Foundation complete", "Framing in progress", "Final inspection pending").forEachIndexed { index, item ->
            TimelineRow(item, if (index == 0) "Complete" else if (index == 1) "In Progress" else "Pending")
        }
        ChoiceCard("Terms acknowledgement", "I agree to the scope, milestones, escrow release, and dispute policy.", selected = true)
    }
}

@Composable
private fun DisputeBody(spec: StitchScreenSpec) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        spec.sections.forEach { SectionCard(it, "Case evidence and moderation state from the Stitch dispute flow.") }
        ChoiceCard("Work quality issue", "Deliverables do not match the agreed milestone.", selected = true)
        ChoiceCard("Payment release issue", "Funds are delayed or disputed after completion.")
        SectionCard("Evidence upload", "3 photos • 1 invoice • Artisan note attached")
    }
}

@Composable
private fun SettingsBody(spec: StitchScreenSpec) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        spec.sections.forEach { title ->
            SurfaceCard {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                        Text("Configured from ${spec.source}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(checked = title.length % 2 == 0, onCheckedChange = {})
                }
            }
        }
    }
}

@Composable
private fun AdminBody(spec: StitchScreenSpec) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        MetricHeroCard(title = spec.title, value = "Review", subtitle = "Moderation queue mapped from ${spec.source}")
        listOf("High priority dispute", "Identity verification pending", "Escrow evidence review").forEachIndexed { index, title ->
            ListingCard(title, if (index == 0) "Urgent" else "Review", "Assigned queue • ${index + 2} documents")
        }
    }
}

@Composable
private fun SectionCards(sections: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        sections.forEach { SectionCard(it, "Native component mapped from Stitch structure.") }
    }
}

@Composable
private fun SurfaceCard(content: @Composable () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.72f)),
    ) { Column(modifier = Modifier.padding(14.dp)) { content() } }
}

@Composable
private fun SectionCard(title: String, subtitle: String) {
    SurfaceCard {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.Top) {
            Surface(modifier = Modifier.size(32.dp), shape = CircleShape, color = MaterialTheme.colorScheme.secondaryContainer, contentColor = MaterialTheme.colorScheme.onSecondaryContainer) {
                Icon(Icons.Outlined.CheckCircle, contentDescription = null, modifier = Modifier.padding(7.dp))
            }
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(title, style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun MetricHeroCard(title: String, value: String, subtitle: String) {
    SurfaceCard {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        Text(value, style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Black)
        Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun ChoiceCard(title: String, subtitle: String, selected: Boolean = false) {
    SurfaceCard {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(Icons.Outlined.VerifiedUser, contentDescription = null, tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant)
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (selected) Icon(Icons.Outlined.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        }
    }
}

@Composable
private fun ListingCard(title: String, badge: String, meta: String) {
    SurfaceCard {
        Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Surface(modifier = Modifier.size(56.dp), shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primaryContainer) {}
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                AssistChip(onClick = {}, label = { Text(badge) })
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(meta, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun TransactionRow(title: String, amount: String, positive: Boolean) {
    SurfaceCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.SemiBold)
                Text("Today • Secured by escrow", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(amount, color = if (positive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun TimelineRow(title: String, status: String) {
    SurfaceCard {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(modifier = Modifier.size(12.dp), shape = CircleShape, color = MaterialTheme.colorScheme.primary) {}
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontWeight = FontWeight.SemiBold)
                Text(status, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun ChatBubble(text: String, incoming: Boolean) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = if (incoming) Arrangement.Start else Arrangement.End) {
        Surface(
            modifier = Modifier.fillMaxWidth(0.82f),
            shape = RoundedCornerShape(18.dp),
            color = if (incoming) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.primaryContainer,
            contentColor = if (incoming) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onPrimaryContainer,
        ) { Text(text, modifier = Modifier.padding(14.dp), style = MaterialTheme.typography.bodyMedium) }
    }
}

@Composable
private fun ProgressSegments(active: Int, total: Int) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
        repeat(total) { index ->
            Surface(modifier = Modifier.weight(1f).height(7.dp), shape = CircleShape, color = if (index < active) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant) {}
        }
    }
}

@Composable
private fun OtpBox(index: Int, modifier: Modifier = Modifier) {
    Surface(modifier = modifier.height(54.dp), shape = RoundedCornerShape(12.dp), color = MaterialTheme.colorScheme.surface, border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) { Text(index.toString(), fontWeight = FontWeight.Bold) }
    }
}

fun stitchScreenSpec(
    title: String,
    source: String,
    category: String,
    description: String,
    vararg sections: String,
    primaryAction: String = "Continue",
): StitchScreenSpec = StitchScreenSpec(
    title = title,
    source = source,
    category = category,
    description = description,
    sections = sections.toList(),
    primaryAction = primaryAction,
)
