package com.kelmah.mobile.features.stitch.presentation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import android.widget.Toast
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.Toast
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.core.design.components.KelmahAmountInput
import com.kelmah.mobile.core.design.components.KelmahButton
import com.kelmah.mobile.core.design.components.KelmahButtonVariant
import com.kelmah.mobile.core.design.components.KelmahChatBubble
import com.kelmah.mobile.core.design.components.KelmahChatInputBar
import com.kelmah.mobile.core.design.components.KelmahChatTopBar
import com.kelmah.mobile.core.design.components.KelmahChipTone
import com.kelmah.mobile.core.design.components.KelmahCommandDeck
import com.kelmah.mobile.core.design.components.KelmahCommandMetric
import com.kelmah.mobile.core.design.components.KelmahCommandSignal
import com.kelmah.mobile.core.design.components.KelmahDateSeparator
import com.kelmah.mobile.core.design.components.KelmahDetailTopBar
import com.kelmah.mobile.core.design.components.KelmahEmptyState
import com.kelmah.mobile.core.design.components.KelmahFilterTabItem
import com.kelmah.mobile.core.design.components.KelmahFilterTabs
import com.kelmah.mobile.core.design.components.KelmahGlassPanel
import com.kelmah.mobile.core.design.components.KelmahJobCard
import com.kelmah.mobile.core.design.components.KelmahJobCardCompact
import com.kelmah.mobile.core.design.components.KelmahJobContextCard
import com.kelmah.mobile.core.design.components.KelmahNotificationItem
import com.kelmah.mobile.core.design.components.KelmahPaymentMethodCard
import com.kelmah.mobile.core.design.components.KelmahProgressStepper
import com.kelmah.mobile.core.design.components.KelmahQuickActionChips
import com.kelmah.mobile.core.design.components.KelmahQuickActionItem
import com.kelmah.mobile.core.design.components.KelmahRadioCard
import com.kelmah.mobile.core.design.components.KelmahReveal
import com.kelmah.mobile.core.design.components.KelmahScreenBackground
import com.kelmah.mobile.core.design.components.KelmahSectionPanel
import com.kelmah.mobile.core.design.components.KelmahSettingsTopBar
import com.kelmah.mobile.core.design.components.KelmahSignalChip
import com.kelmah.mobile.core.design.components.KelmahStatBento
import com.kelmah.mobile.core.design.components.KelmahStatBentoItem
import com.kelmah.mobile.core.design.components.KelmahToggle
import com.kelmah.mobile.core.design.components.KelmahTrustBadgeRow
import com.kelmah.mobile.core.design.components.KelmahWalletBalanceCard
import com.kelmah.mobile.core.design.theme.KelmahSpacing
import com.kelmah.mobile.features.wallet.presentation.WalletViewModel
import com.kelmah.mobile.features.wallet.presentation.DepositStatus

@Composable
fun StitchChatScreen(
    conversationId: String?,
    onBack: () -> Unit,
) {
    var message by remember { mutableStateOf("") }
    KelmahScreenBackground {
        Column(modifier = Modifier.fillMaxSize()) {
            KelmahChatTopBar(
                title = "Amina Mensah",
                subtitle = conversationId?.let { "Conversation $it" } ?: "Escrow-funded wiring job",
                onBackClick = onBack,
                online = true,
                onCallClick = {},
                onMoreClick = {},
            )
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(KelmahSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(KelmahSpacing.md),
            ) {
                item { KelmahJobContextCard("Full house wiring", "Amina Mensah", "GHS 4,800", status = "Active") }
                item { KelmahDateSeparator("Today") }
                item { KelmahChatBubble("Can you confirm the breaker capacity before tomorrow's visit?", "09:21", fromMe = false) }
                item { KelmahChatBubble("Confirmed. I also attached the updated material list for approval.", "09:24", fromMe = true, status = "Sent") }
                item { KelmahChatBubble("Looks good. I will release the site access note now.", "09:31", fromMe = false) }
            }
            KelmahChatInputBar(
                value = message,
                onValueChange = { message = it },
                onSendClick = { message = "" },
                placeholder = "Message Amina",
            )
        }
    }
}

@Composable
fun StitchPostJobScreen(
    step: Int,
    onBack: () -> Unit,
    onNext: () -> Unit,
) {
    val activeStep = step.coerceIn(1, 3)
    StitchDetailScaffold(
        title = when (activeStep) {
            2 -> "Budget & Milestones"
            3 -> "Review Job Post"
            else -> "Post a Job"
        },
        subtitle = "Create a clear brief for verified artisans",
        onBack = onBack,
    ) {
        item { KelmahProgressStepper(activeStep = activeStep, totalSteps = 3) }
        item {
            KelmahCommandDeck(
                title = "Kitchen renovation support",
                subtitle = "Static draft preview using Stitch hiring components.",
                eyebrow = "HIRING FLOW",
                metrics = listOf(
                    KelmahCommandMetric("Budget", "GHS 7.2k"),
                    KelmahCommandMetric("Timeline", "14 days"),
                    KelmahCommandMetric("Milestones", "3"),
                ),
            )
        }
        when (activeStep) {
            2 -> {
                item { KelmahAmountInput(value = "7200", onValueChange = {}) }
                item { KelmahRadioCard("Fixed project", "Fund escrow by milestone and release on approval.", selected = true, onClick = {}) }
                item { KelmahRadioCard("Hourly support", "Track approved hours with weekly settlement.", selected = false, onClick = {}) }
                item { MilestoneRows() }
            }
            3 -> {
                item { KelmahJobCard("Kitchen Cabinet Rebuild", "Adabraka Homes", "Accra Central", "GHS 7,200", "Ready", onClick = {}, description = "Cabinet refit, tile touch-up, and final inspection.", postedAt = "Draft") }
                item { ChecklistPanel(listOf("Scope is clear", "Escrow milestones added", "Trade category selected", "Site access notes attached")) }
            }
            else -> {
                item { KelmahSectionPanel("Job basics", subtitle = "Title, trade, location, and site notes") { StaticField("Title", "Kitchen Cabinet Rebuild") } }
                item { KelmahQuickActionChips(staticTradeActions()) }
                item { KelmahSectionPanel("Scope", subtitle = "Use concise deliverables for better bids") { BodyText("Replace damaged cabinets, repair hinges, and complete finish work before inspection.") } }
            }
        }
        item { KelmahButton(text = if (activeStep == 3) "Publish job" else "Continue", onClick = onNext, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchWalletHubScreen(
    onBack: () -> Unit,
    onDeposit: () -> Unit,
) {
    StitchDetailScaffold(title = "Wallet", subtitle = "Escrow, deposits, and payouts", onBack = onBack) {
        item { KelmahWalletBalanceCard("GHS 4,250.00", "Available balance", onPrimaryAction = onDeposit, primaryActionLabel = "Deposit funds", secondaryText = "GHS 2,800 secured in active milestones") }
        item { KelmahStatBento(walletStats()) }
        item { KelmahQuickActionChips(listOf(KelmahQuickActionItem("Deposit", KelmahChipTone.Primary, onDeposit), KelmahQuickActionItem("Payouts", KelmahChipTone.Info, {}), KelmahQuickActionItem("Statements", KelmahChipTone.Surface, {}))) }
        item { KelmahSectionPanel("Recent activity", subtitle = "Latest secured wallet movements") { TransactionRows() } }
    }
}

@Composable
fun StitchDepositScreen(
    onBack: () -> Unit,
    viewModel: WalletViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(uiState.depositStatus) {
        if (uiState.depositStatus == DepositStatus.SUCCESS) {
            Toast.makeText(context, "Deposit successful", Toast.LENGTH_SHORT).show()
            viewModel.resetDeposit()
        }
    }

    StitchDetailScaffold(
        title = "Deposit Funds",
        subtitle = "Add money to escrow securely",
        onBack = onBack,
    ) {
        item {
            KelmahWalletBalanceCard(
                "GH₵ 4,250.00",
                "Available balance",
                onPrimaryAction = { viewModel.deposit() },
                primaryActionLabel = "Deposit",
            )
        }
        item { KelmahAmountInput(value = "0", onValueChange = { }) }
        item {
            KelmahPaymentMethodCard(
                "MTN Mobile Money",
                "024 000 1212",
                selected = true,
                onClick = {},
                trailing = "MTN",
            )
        }
        item {
            KelmahPaymentMethodCard(
                "Visa Card",
                "Ending 4242",
                selected = false,
                onClick = {},
                trailing = "VI",
            )
        }
        item {
            KelmahTrustBadgeRow(
                listOf("PCI protected", "Escrow secured", "Instant receipt")
            )
        }
        if (uiState.errorMessage != null) {
            Text(
                uiState.errorMessage!!,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(16.dp),
            )
        }
    }
}

@Composable
fun StitchMilestoneApprovalScreen(milestoneId: String?, onBack: () -> Unit) {
    StitchDetailScaffold("Approve Milestone", milestoneId?.let { "Milestone $it" } ?: "Review submitted work", onBack) {
        item { KelmahCommandDeck("Electrical rough-in complete", "Review proof, site notes, and release escrow only when satisfied.", eyebrow = "MILESTONE", metrics = listOf(KelmahCommandMetric("Escrow", "GHS 1,600"), KelmahCommandMetric("Proof", "5 files"), KelmahCommandMetric("Due", "Today"))) }
        item { ChecklistPanel(listOf("Breaker panel installed", "Room circuits labelled", "Continuity test uploaded")) }
        item { KelmahButton("Approve release", onClick = {}, modifier = Modifier.fillMaxWidth()) }
        item { KelmahButton("Request revision", onClick = {}, modifier = Modifier.fillMaxWidth(), variant = KelmahButtonVariant.Secondary) }
    }
}

@Composable
fun StitchContractAgreementScreen(contractId: String?, onBack: () -> Unit) {
    StitchDetailScaffold("Contract Agreement", contractId?.let { "Contract $it" } ?: "Scope and terms", onBack) {
        item { KelmahCommandDeck("Kitchen renovation agreement", "Milestone-backed contract with escrow protection and acceptance terms.", eyebrow = "CONTRACT", metrics = listOf(KelmahCommandMetric("Total", "GHS 7.2k"), KelmahCommandMetric("Milestones", "3"), KelmahCommandMetric("Warranty", "30d"))) }
        item { MilestoneRows() }
        item { KelmahRadioCard("I accept the scope and escrow release terms", "Both parties can open a dispute before final release.", selected = true, onClick = {}) }
        item { KelmahButton("Sign agreement", onClick = {}, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchFileDisputeScreen(jobId: String?, onBack: () -> Unit) {
    StitchDetailScaffold("File a Dispute", jobId?.let { "Job $it" } ?: "Escalate a project issue", onBack) {
        item { KelmahCommandDeck("Quality issue", "Submit evidence so support can protect funds and resolve the case.", eyebrow = "DISPUTE", signals = listOf(KelmahCommandSignal("Evidence", "Required"), KelmahCommandSignal("Escrow", "On hold"))) }
        item { KelmahRadioCard("Work quality does not match scope", "Photos and notes show unresolved defects.", selected = true, onClick = {}) }
        item { KelmahRadioCard("Payment or release disagreement", "Funds should stay in escrow until reviewed.", selected = false, onClick = {}) }
        item { KelmahSectionPanel("Evidence", subtitle = "3 photos, 1 invoice, and chat excerpts ready") { BodyText("Attach clear proof and a concise summary before submission.") } }
        item { KelmahButton("Submit dispute", onClick = {}, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchBrowseTradesScreen(onBack: () -> Unit) {
    StitchDetailScaffold("Browse Trades", "Find verified artisans and active jobs", onBack) {
        item { KelmahFilterTabs(listOf(KelmahFilterTabItem("All", "42"), KelmahFilterTabItem("Plumbing", "9"), KelmahFilterTabItem("Electrical", "12")), selectedIndex = 0, onSelect = {}) }
        item { KelmahQuickActionChips(staticTradeActions()) }
        item { KelmahJobCard("Emergency Pipe Repair", "North Ridge Clinic", "North Ridge", "GHS 850", "Urgent", onClick = {}, description = "Leak isolation and same-day repair required.", postedAt = "1h", urgent = true) }
        item { KelmahJobCard("Solar inverter install", "Tema Estates", "Tema", "GHS 2,400", "Verified", onClick = {}, description = "Install inverter, run tests, and submit warranty notes.", postedAt = "Today") }
        item { KelmahEmptyState("More trades loading", "Use filters to narrow by skill, budget, and location.") }
    }
}

@Composable
fun StitchProfileSettingsScreen(onBack: () -> Unit) {
    KelmahScreenBackground {
        Column(modifier = Modifier.fillMaxSize()) {
            KelmahSettingsTopBar(title = "Profile Settings", onBackClick = onBack, onSaveClick = {})
            LazyColumn(contentPadding = PaddingValues(KelmahSpacing.lg), verticalArrangement = Arrangement.spacedBy(KelmahSpacing.md)) {
                item { KelmahCommandDeck("Kwame Boateng", "Verified electrician profile visible to hiring teams.", eyebrow = "PROFILE", metrics = listOf(KelmahCommandMetric("Rating", "4.9"), KelmahCommandMetric("Jobs", "86"), KelmahCommandMetric("Badges", "12"))) }
                item { SettingsToggleRow("Available for urgent jobs", "Show same-day availability", checked = true) }
                item { SettingsToggleRow("Message notifications", "Push alerts for new project chats", checked = true) }
                item { SettingsToggleRow("Public portfolio", "Allow clients to view completed work", checked = false) }
                item { KelmahButton("Save changes", onClick = {}, modifier = Modifier.fillMaxWidth()) }
            }
        }
    }
}

@Composable
fun StitchNotificationsScreen(onBack: () -> Unit) {
    StitchDetailScaffold("Notifications", "Project alerts and account updates", onBack) {
        item { KelmahFilterTabs(listOf(KelmahFilterTabItem("All", "8"), KelmahFilterTabItem("Jobs", "3"), KelmahFilterTabItem("Wallet", "2")), selectedIndex = 0, onSelect = {}) }
        item { KelmahNotificationItem("Milestone submitted", "Amina uploaded proof for Electrical rough-in.", "5m ago", onClick = {}, unread = true, tone = KelmahChipTone.Success) }
        item { KelmahNotificationItem("Deposit confirmed", "GHS 1,500 has been added to escrow.", "1h ago", onClick = {}, unread = true, tone = KelmahChipTone.Info) }
        item { KelmahNotificationItem("New bid received", "Three verified carpenters responded to your job post.", "Yesterday", onClick = {}, tone = KelmahChipTone.Primary) }
    }
}

@Composable
fun StitchJobDetailScreen(jobId: String?, onBack: () -> Unit) {
    StitchDetailScaffold("Job Detail", jobId?.let { "Job $it" } ?: "Project brief", onBack) {
        item { KelmahJobCard("Kitchen Cabinet Rebuild", "Adabraka Homes", "Accra Central", "GHS 7,200", "Open", onClick = {}, description = "Cabinet refit, finish work, tile touch-up, and final inspection.", postedAt = "2h") }
        item { KelmahStatBento(listOf(KelmahStatBentoItem("Applicants", "12", "4 verified"), KelmahStatBentoItem("Timeline", "14 days", "Starts this week"), KelmahStatBentoItem("Escrow", "Ready", "Milestone funded"))) }
        item { ChecklistPanel(listOf("Verified hirer", "Escrow available", "Site photos attached", "Clear milestone plan")) }
        item { KelmahButton("Apply to job", onClick = {}, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchWalletDetailScreen(mode: String, itemId: String? = null, onBack: () -> Unit) {
    val title = when (mode) {
        "analytics" -> "Earnings Analytics"
        "payouts" -> "Payout Methods"
        "transactions" -> "Transaction History"
        "invoice" -> "Invoice Detail"
        else -> "Earnings"
    }
    StitchDetailScaffold(title, itemId?.let { "Reference $it" } ?: "Wallet operations and movement", onBack) {
        item {
            KelmahCommandDeck(
                title = if (mode == "payouts") "Payout account ready" else "GHS 12,480 earned this quarter",
                subtitle = if (mode == "invoice") "Receipt breakdown with escrow, fee, and linked project records." else "Track secure balances, releases, and settlement readiness.",
                eyebrow = "WALLET",
                metrics = listOf(
                    KelmahCommandMetric("Available", "GHS 4.2k"),
                    KelmahCommandMetric("Escrow", "GHS 2.8k"),
                    KelmahCommandMetric("Fees", "2.5%"),
                ),
            )
        }
        item { KelmahStatBento(walletStats()) }
        if (mode == "payouts") {
            item { KelmahAmountInput(value = "1250", onValueChange = {}) }
            item { KelmahPaymentMethodCard("Absa Bank", "Savings ending 8831", selected = true, onClick = {}, trailing = "AB") }
            item { KelmahPaymentMethodCard("MTN Mobile Money", "024 000 1212", selected = false, onClick = {}, trailing = "MT") }
            item { KelmahButton("Withdraw GHS 1,250", onClick = {}, modifier = Modifier.fillMaxWidth()) }
        } else {
            item { KelmahFilterTabs(listOf(KelmahFilterTabItem("All", "18"), KelmahFilterTabItem("Escrow", "7"), KelmahFilterTabItem("Payouts", "4")), selectedIndex = 0, onSelect = {}) }
            item { KelmahSectionPanel("Ledger", subtitle = "Searchable transaction records") { TransactionRows() } }
            item { KelmahTrustBadgeRow(listOf("Export CSV", "Receipts", "Tax ready"), tone = KelmahChipTone.Info) }
        }
    }
}

@Composable
fun StitchProjectListScreen(mode: String, onBack: () -> Unit) {
    val saved = mode == "saved"
    StitchDetailScaffold(if (saved) "Saved Jobs" else "My Projects", if (saved) "Favorites, alerts, and saved searches" else "Active work and hiring pipeline", onBack) {
        item { KelmahFilterTabs(listOf(KelmahFilterTabItem("Active", "6"), KelmahFilterTabItem("Pending", "3"), KelmahFilterTabItem("Done", "14")), selectedIndex = if (saved) 1 else 0, onSelect = {}) }
        item { KelmahStatBento(listOf(KelmahStatBentoItem("Open", "6", "2 urgent", KelmahChipTone.Warning), KelmahStatBentoItem("Escrow", "GHS 9.4k", "Protected", KelmahChipTone.Success), KelmahStatBentoItem("Reviews", "4.9", "Latest rating", KelmahChipTone.Primary))) }
        item { KelmahJobCard("Solar inverter install", "Tema Estates", "Tema", "GHS 2,400", if (saved) "Saved" else "In progress", onClick = {}, description = "Install inverter, test load, and submit warranty notes.", postedAt = "Today") }
        item { KelmahJobCard("Kitchen Cabinet Rebuild", "Adabraka Homes", "Accra Central", "GHS 7,200", if (saved) "Alert" else "Milestone due", onClick = {}, description = "Cabinet refit, finish work, and final inspection.", postedAt = "2d") }
        item { ChecklistPanel(if (saved) listOf("Price alert active", "Matches electrician profile", "Hirer verified") else listOf("Next milestone due today", "Two bids awaiting review", "Escrow funded")) }
    }
}

@Composable
fun StitchMilestoneDetailScreen(milestoneId: String?, onBack: () -> Unit) {
    StitchDetailScaffold("Milestone Detail", milestoneId?.let { "Milestone $it" } ?: "Progress, proof, and release state", onBack) {
        item { KelmahProgressStepper(activeStep = 2, totalSteps = 4) }
        item { KelmahCommandDeck("Cabinet rebuild and fit", "Deliverables are in progress with escrow locked until approval.", eyebrow = "MILESTONE", metrics = listOf(KelmahCommandMetric("Value", "GHS 4.2k"), KelmahCommandMetric("Due", "Jun 14"), KelmahCommandMetric("Proof", "3 files"))) }
        item { ChecklistPanel(listOf("Measurements approved", "Materials purchased", "Site access confirmed", "Client review pending")) }
        item { KelmahSectionPanel("Timeline", subtitle = "Activity log") { TimelineRows(listOf("Escrow funded", "Worker uploaded progress photos", "Client requested hinge adjustment")) } }
        item { KelmahButton("Request update", onClick = {}, modifier = Modifier.fillMaxWidth(), variant = KelmahButtonVariant.Secondary) }
    }
}

@Composable
fun StitchDisputeScreen(mode: String, itemId: String? = null, onBack: () -> Unit) {
    val detail = mode == "detail"
    StitchDetailScaffold(if (detail) "Dispute Case" else "Disputes", itemId?.let { "Case $it" } ?: "Resolution queue and evidence status", onBack) {
        item { KelmahFilterTabs(listOf(KelmahFilterTabItem("Open", "4"), KelmahFilterTabItem("Evidence", "2"), KelmahFilterTabItem("Resolved", "11")), selectedIndex = 0, onSelect = {}) }
        item { KelmahCommandDeck("Quality review needed", "Escrow is held while both parties submit evidence and moderator notes.", eyebrow = "DISPUTE", signals = listOf(KelmahCommandSignal("Escrow", "Held"), KelmahCommandSignal("SLA", "18h"), KelmahCommandSignal("Evidence", "Ready"))) }
        item { KelmahJobCardCompact("Kitchen finish defects", "GHS 1,500", "Case KEL-204", onClick = {}, status = "Open") }
        item { KelmahJobCardCompact("Late material delivery", "GHS 900", "Case KEL-198", onClick = {}, status = "Review") }
        item { KelmahSectionPanel("Decision timeline", subtitle = "Moderator-visible steps") { TimelineRows(listOf("Case opened by hirer", "Worker submitted counter evidence", "Moderator requested final photos")) } }
        if (detail) item { KelmahButton("Add evidence", onClick = {}, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchSettingsDetailScreen(mode: String, onBack: () -> Unit) {
    val title = when (mode) {
        "verification" -> "Verification Hub"
        "security" -> "Security Center"
        "notifications" -> "Notifications"
        "privacy" -> "Privacy"
        "help" -> "Help & Support"
        else -> "Settings"
    }
    StitchDetailScaffold(title, "Account controls and preferences", onBack) {
        item { KelmahCommandDeck(title, "Manage trusted access, alerts, visibility, and support workflows.", eyebrow = "SETTINGS", metrics = listOf(KelmahCommandMetric("Secure", "MFA"), KelmahCommandMetric("Alerts", "12"), KelmahCommandMetric("Status", "Verified"))) }
        item { SettingsToggleRow("Two-factor authentication", "Protect sign-in and wallet actions", checked = mode == "security") }
        item { SettingsToggleRow("Push notifications", "Project, chat, and wallet alerts", checked = mode != "privacy") }
        item { SettingsToggleRow("Public profile visibility", "Allow hirers to discover your profile", checked = mode != "privacy") }
        item { KelmahSectionPanel("Action panel", subtitle = "Primary workflow for this section") { SettingsActionRows(mode) } }
        item { KelmahButton(if (mode == "help") "Open support ticket" else "Save preferences", onClick = {}, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchProfileDetailScreen(mode: String, itemId: String? = null, onBack: () -> Unit) {
    val title = when (mode) {
        "badges" -> "Certificates & Badges"
        "portfolio", "portfolio_detail" -> "Portfolio"
        "credentials" -> "Credentials"
        "linked" -> "Linked Accounts"
        "verification" -> "Identity Verification"
        "security" -> "Security Center"
        "notifications" -> "Notification Preferences"
        "privacy" -> "Privacy Settings"
        "help" -> "Help Center"
        else -> "Profile Detail"
    }
    StitchDetailScaffold(title, itemId?.let { "Project $it" } ?: "Worker profile management", onBack) {
        item { KelmahCommandDeck("Kwame Boateng", "Verified electrician profile with portfolio proof and trust signals.", eyebrow = "PROFILE", metrics = listOf(KelmahCommandMetric("Rating", "4.9"), KelmahCommandMetric("Jobs", "86"), KelmahCommandMetric("Badges", "12"))) }
        item { KelmahTrustBadgeRow(listOf("Ghana Card verified", "Electrical Level II", "Top responder")) }
        if (mode.startsWith("portfolio")) {
            item { KelmahJobCard("Hospital wiring retrofit", "North Ridge Clinic", "North Ridge", "GHS 11,200", "Case study", onClick = {}, description = "Three-floor retrofit completed under active facility constraints.", postedAt = "2026") }
            item { KelmahJobCard("Solar backup install", "Tema Estates", "Tema", "GHS 8,400", "Featured", onClick = {}, description = "Inverter, battery rack, and load balancing documentation.", postedAt = "2025") }
        } else {
            item { KelmahSectionPanel("Credential records", subtitle = "Documents and assessments") { TimelineRows(listOf("Ghana Card approved", "Trade certificate uploaded", "Skills assessment passed")) } }
            item { SettingsToggleRow("Show certificates publicly", "Display earned trust badges on profile", checked = true) }
            item { SettingsToggleRow("Linked payment account", "Use verified payout identity", checked = mode == "linked") }
        }
        item { KelmahButton("Update profile", onClick = {}, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchAuthFlowScreen(mode: String, onBack: () -> Unit) {
    val title = when (mode) {
        "create" -> "Create Account"
        "role" -> "Choose Your Role"
        "forgot" -> "Reset Password"
        else -> "Login"
    }
    StitchDetailScaffold(title, "Secure access to Kelmah", onBack) {
        item { KelmahCommandDeck("Welcome to Kelmah", "Hire verified artisans, protect escrow, and manage work from one mobile app.", eyebrow = "AUTH", signals = listOf(KelmahCommandSignal("Escrow", "Secure"), KelmahCommandSignal("Workers", "Verified"))) }
        if (mode == "role") {
            item { KelmahRadioCard("I need to hire", "Post jobs, fund escrow, and approve milestones.", selected = true, onClick = {}) }
            item { KelmahRadioCard("I want work", "Build a verified profile and receive matched projects.", selected = false, onClick = {}) }
        } else {
            item { KelmahSectionPanel("Account fields", subtitle = "Static form preview") { AuthFormRows(mode) } }
            item { SettingsToggleRow("Remember this device", "Keep session protected by device lock", checked = mode == "login") }
        }
        item { KelmahButton(if (mode == "forgot") "Send reset code" else if (mode == "create") "Create account" else "Continue", onClick = {}, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchOnboardingScreen(mode: String, onBack: () -> Unit) {
    val splash = mode == "splash"
    StitchDetailScaffold(if (splash) "Kelmah" else "Welcome to Kelmah", if (splash) "Loading secure workspaces" else "Verified work, escrow, and progress tracking", onBack) {
        item { KelmahCommandDeck(if (splash) "Kelmah is preparing your workspace" else "Work safely from first chat to final release", "A guided mobile flow for trusted local trade work.", eyebrow = "ONBOARDING", metrics = listOf(KelmahCommandMetric("Pros", "2.4k"), KelmahCommandMetric("Escrow", "Secure"), KelmahCommandMetric("Cities", "12"))) }
        item { KelmahProgressStepper(activeStep = if (splash) 1 else 2, totalSteps = 3) }
        item { ChecklistPanel(listOf("Find verified artisans", "Fund milestones into escrow", "Track progress and approvals")) }
        item { KelmahButton(if (splash) "Continue" else "Get started", onClick = {}, modifier = Modifier.fillMaxWidth()) }
    }
}

@Composable
fun StitchAdminQueueScreen(mode: String, itemId: String? = null, onBack: () -> Unit) {
    val verification = mode == "verification"
    val detail = mode == "dispute_detail"
    StitchDetailScaffold(if (verification) "Admin Verification" else if (detail) "Admin Dispute Detail" else "Admin Dispute Queue", itemId?.let { "Case $it" } ?: "Operations queue", onBack) {
        item { KelmahCommandDeck(if (verification) "Credential review queue" else "Priority dispute triage", "Admin-facing moderation controls with SLA, assignment, and decision readiness.", eyebrow = "ADMIN", metrics = listOf(KelmahCommandMetric("Open", "18"), KelmahCommandMetric("SLA", "92%"), KelmahCommandMetric("Assigned", "7"))) }
        item { KelmahFilterTabs(listOf(KelmahFilterTabItem("High", "5"), KelmahFilterTabItem("Normal", "13"), KelmahFilterTabItem("Done", "44")), selectedIndex = 0, onSelect = {}) }
        item { KelmahJobCardCompact(if (verification) "Ama Tetteh identity" else "Kitchen finish defects", if (verification) "Docs 4/4" else "GHS 1,500", if (verification) "Worker KYC" else "Case KEL-204", onClick = {}, status = if (verification) "Review" else "Urgent") }
        item { KelmahJobCardCompact(if (verification) "Kojo Mensah certificate" else "Late delivery claim", if (verification) "Trade cert" else "GHS 900", if (verification) "Assessment" else "Case KEL-198", onClick = {}, status = "Assigned") }
        item { KelmahSectionPanel("Decision controls", subtitle = "Moderator checklist") { TimelineRows(if (verification) listOf("Document scan complete", "Face match passed", "Trade certificate pending") else listOf("Evidence compared", "Chat summary generated", "Decision note drafted")) } }
        item { Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) { KelmahButton("Approve", onClick = {}, modifier = Modifier.weight(1f)); KelmahButton("Reject", onClick = {}, modifier = Modifier.weight(1f), variant = KelmahButtonVariant.Secondary) } }
    }
}

@Composable
private fun StitchDetailScaffold(
    title: String,
    subtitle: String,
    onBack: () -> Unit,
    content: androidx.compose.foundation.lazy.LazyListScope.() -> Unit,
) {
    KelmahScreenBackground {
        Column(modifier = Modifier.fillMaxSize()) {
            KelmahDetailTopBar(title = title, subtitle = subtitle, onBackClick = onBack)
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(KelmahSpacing.lg),
                verticalArrangement = Arrangement.spacedBy(KelmahSpacing.md),
            ) {
                content()
                item { Spacer(modifier = Modifier.height(12.dp)) }
            }
        }
    }
}

@Composable
private fun ChecklistPanel(items: List<String>) {
    KelmahSectionPanel(title = "Checklist", subtitle = "Static Stitch-aligned content") {
        Column(verticalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
            items.forEachIndexed { index, item ->
                KelmahReveal(index = index) {
                    Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
                        KelmahSignalChip(text = "Done", tone = KelmahChipTone.Success)
                        Text(item, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@Composable
private fun MilestoneRows() {
    Column(verticalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
        KelmahJobCardCompact("Site measurement and materials", "GHS 1,500", "Milestone 1", onClick = {}, status = "Funded")
        KelmahJobCardCompact("Cabinet rebuild and fit", "GHS 4,200", "Milestone 2", onClick = {}, status = "Draft")
        KelmahJobCardCompact("Finish, cleanup, inspection", "GHS 1,500", "Milestone 3", onClick = {}, status = "Draft")
    }
}

@Composable
private fun TransactionRows() {
    Column(verticalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
        KelmahJobCardCompact("Escrow funded", "+GHS 1,500", "Kitchen Cabinet Rebuild", onClick = {}, status = "Today")
        KelmahJobCardCompact("Milestone released", "-GHS 900", "Electrical rough-in", onClick = {}, status = "Yesterday")
        KelmahJobCardCompact("Deposit", "+GHS 2,000", "MTN Mobile Money", onClick = {}, status = "Jun 8")
    }
}

@Composable
private fun SettingsToggleRow(title: String, subtitle: String, checked: Boolean) {
    KelmahGlassPanel {
        Row(
            modifier = Modifier.padding(KelmahSpacing.lg),
            horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.md),
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            KelmahToggle(checked = checked, onCheckedChange = {})
        }
    }
}

@Composable
private fun TimelineRows(items: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
        items.forEachIndexed { index, item ->
            KelmahReveal(index = index) {
                Row(horizontalArrangement = Arrangement.spacedBy(KelmahSpacing.sm)) {
                    KelmahSignalChip(text = "${index + 1}", tone = if (index == items.lastIndex) KelmahChipTone.Primary else KelmahChipTone.Surface)
                    Text(item, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun SettingsActionRows(mode: String) {
    val rows = when (mode) {
        "verification" -> listOf("Upload Ghana Card", "Capture liveness selfie", "Review submission status")
        "security" -> listOf("Change password", "Review trusted devices", "Enable wallet approval prompts")
        "notifications" -> listOf("Project alerts", "Chat messages", "Wallet and payout receipts")
        "privacy" -> listOf("Profile visibility", "Blocked users", "Download account data")
        "help" -> listOf("Browse help topics", "Submit support ticket", "Track open case")
        else -> listOf("Account details", "Payment preferences", "Language and region")
    }
    TimelineRows(rows)
}

@Composable
private fun AuthFormRows(mode: String) {
    val rows = when (mode) {
        "create" -> listOf("Full name: Kwame Boateng", "Email: kwame@example.com", "Password strength: Strong", "Terms accepted")
        "forgot" -> listOf("Email: kwame@example.com", "Verification code: 248190", "New password: Required")
        else -> listOf("Email: kwame@example.com", "Password: Protected", "Social login: Google enabled")
    }
    TimelineRows(rows)
}

@Composable
private fun StaticField(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(KelmahSpacing.xs)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun BodyText(text: String) {
    Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
}

private fun staticTradeActions(): List<KelmahQuickActionItem> = listOf(
    KelmahQuickActionItem("Plumbing", KelmahChipTone.Info, {}),
    KelmahQuickActionItem("Electrical", KelmahChipTone.Primary, {}),
    KelmahQuickActionItem("Carpentry", KelmahChipTone.Success, {}),
    KelmahQuickActionItem("Painting", KelmahChipTone.Warning, {}),
)

private fun walletStats(): List<KelmahStatBentoItem> = listOf(
    KelmahStatBentoItem("Escrow", "GHS 2,800", "3 active jobs", KelmahChipTone.Info),
    KelmahStatBentoItem("Pending", "GHS 950", "1 approval", KelmahChipTone.Warning),
    KelmahStatBentoItem("Payout", "Ready", "Verified account", KelmahChipTone.Success),
)
