package com.kelmah.mobile.features.messaging.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.Forum
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.R
import com.kelmah.mobile.core.utils.RelativeTimeFormatter
import com.kelmah.mobile.features.messaging.data.ConversationSummary
import com.kelmah.mobile.features.messaging.data.ThreadMessage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessagesScreen(
    initialConversationId: String? = null,
    viewModel: MessagesViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbars = remember { SnackbarHostState() }
    var handledInitialConversation by rememberSaveable(initialConversationId) { mutableStateOf(initialConversationId == null) }
    val filteredConversations = remember(state.conversations, state.searchQuery) {
        val query = state.searchQuery.trim().lowercase()
        if (query.isBlank()) {
            state.conversations
        } else {
            state.conversations.filter { conversation ->
                conversation.displayTitle.lowercase().contains(query) ||
                    conversation.lastMessagePreview.lowercase().contains(query)
            }
        }
    }

    LaunchedEffect(state.errorMessage) {
        state.errorMessage?.let {
            snackbars.showSnackbar(it)
            viewModel.clearMessages()
        }
    }
    LaunchedEffect(state.infoMessage) {
        state.infoMessage?.let {
            snackbars.showSnackbar(it)
            viewModel.clearMessages()
        }
    }

    LaunchedEffect(initialConversationId, state.conversations, handledInitialConversation) {
        if (!handledInitialConversation && !initialConversationId.isNullOrBlank()) {
            handledInitialConversation = true
            viewModel.openConversationById(initialConversationId)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = state.selectedConversation?.displayTitle ?: stringResource(id = R.string.messages_title),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                },
                navigationIcon = {
                    if (state.selectedConversation != null) {
                        IconButton(onClick = viewModel::closeConversation) {
                            Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back to messages")
                        }
                    }
                },
                actions = {
                    IconButton(onClick = viewModel::refreshSelectedConversation) {
                        Icon(Icons.Outlined.Refresh, contentDescription = "Refresh messages")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbars) },
    ) { paddingValues ->
        if (state.selectedConversation == null) {
            ConversationListContent(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                isLoading = state.isLoadingConversations,
                conversations = filteredConversations,
                searchQuery = state.searchQuery,
                onSearchChange = viewModel::updateSearchQuery,
                onOpenConversation = viewModel::openConversation,
            )
        } else {
            ThreadContent(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                currentUserId = state.currentUserId,
                conversation = state.selectedConversation,
                messages = state.messages,
                draftMessage = state.draftMessage,
                composerMode = state.composerMode,
                attachmentName = state.attachmentName,
                attachmentUrl = state.attachmentUrl,
                attachmentMimeType = state.attachmentMimeType,
                isLoading = state.isLoadingMessages,
                isSending = state.isSending,
                onDraftChange = viewModel::updateDraft,
                onComposerModeChange = viewModel::updateComposerMode,
                onAttachmentNameChange = viewModel::updateAttachmentName,
                onAttachmentUrlChange = viewModel::updateAttachmentUrl,
                onAttachmentMimeTypeChange = viewModel::updateAttachmentMimeType,
                onAttachmentClear = viewModel::clearAttachmentDraft,
                onSend = viewModel::sendMessage,
            )
        }
    }
}

@Composable
private fun ConversationListContent(
    modifier: Modifier,
    isLoading: Boolean,
    conversations: List<ConversationSummary>,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    onOpenConversation: (ConversationSummary) -> Unit,
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChange,
            modifier = Modifier.fillMaxWidth(),
            leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null) },
            placeholder = { Text(stringResource(id = R.string.messages_search_placeholder)) },
            singleLine = true,
        )

        Spacer(modifier = Modifier.height(16.dp))

        when {
            isLoading && conversations.isEmpty() -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        CircularProgressIndicator()
                        Text(stringResource(id = R.string.messages_loading))
                    }
                }
            }

            conversations.isEmpty() -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    EmptyStateCard(
                        title = stringResource(id = R.string.messages_empty_title),
                        subtitle = stringResource(id = R.string.messages_empty_subtitle),
                    )
                }
            }

            else -> {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(conversations, key = { it.id }) { conversation ->
                        ConversationCard(
                            conversation = conversation,
                            onClick = { onOpenConversation(conversation) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ConversationCard(
    conversation: ConversationSummary,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = conversation.displayTitle.take(1).uppercase(),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = conversation.displayTitle,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = conversation.lastMessagePreview,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            if (conversation.unreadCount > 0) {
                BadgedBox(badge = { Badge { Text(conversation.unreadCount.toString()) } }) {
                    Spacer(modifier = Modifier.size(20.dp))
                }
            }
        }

        Text(
            text = "Tap to open chat",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(start = 72.dp, end = 16.dp, bottom = 12.dp),
        )
    }
}

@Composable
private fun ThreadContent(
    modifier: Modifier,
    currentUserId: String?,
    conversation: ConversationSummary?,
    messages: List<ThreadMessage>,
    draftMessage: String,
    composerMode: MessageComposerMode,
    attachmentName: String,
    attachmentUrl: String,
    attachmentMimeType: String,
    isLoading: Boolean,
    isSending: Boolean,
    onDraftChange: (String) -> Unit,
    onComposerModeChange: (MessageComposerMode) -> Unit,
    onAttachmentNameChange: (String) -> Unit,
    onAttachmentUrlChange: (String) -> Unit,
    onAttachmentMimeTypeChange: (String) -> Unit,
    onAttachmentClear: () -> Unit,
    onSend: () -> Unit,
) {
    val listState = rememberLazyListState()
    val quickReplies = remember(conversation?.id) {
        listOf(
            "Hi, is this still available?",
            "I can start this job today.",
            "Please share the exact location.",
        )
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    val canSend = draftMessage.trim().isNotEmpty() || attachmentUrl.trim().isNotEmpty()
    val sendLabel = when (composerMode) {
        MessageComposerMode.TEXT -> stringResource(id = R.string.messages_send)
        MessageComposerMode.PHOTO -> stringResource(id = R.string.messages_send_photo)
        MessageComposerMode.FILE -> stringResource(id = R.string.messages_send_file)
    }

    Column(modifier = modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
        conversation?.otherParticipant?.let { participant ->
            AssistChip(
                onClick = {},
                label = {
                    Text(
                        text = if (participant.isActive == true) {
                            "${participant.name} • online"
                        } else {
                            participant.name
                        },
                    )
                },
                enabled = false,
            )
            Spacer(modifier = Modifier.height(12.dp))
        }

        when {
            isLoading && messages.isEmpty() -> {
                Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }

            messages.isEmpty() -> {
                Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                    EmptyStateCard(
                        title = stringResource(id = R.string.messages_empty_title),
                        subtitle = stringResource(id = R.string.messages_thread_empty_subtitle),
                    )
                }
            }

            else -> {
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(messages, key = { it.id }) { message ->
                        MessageBubble(
                            message = message,
                            isOwnMessage = message.senderId == currentUserId,
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(quickReplies, key = { it }) { reply ->
                AssistChip(
                    onClick = {
                        val merged = if (draftMessage.isBlank()) reply else "$draftMessage $reply"
                        onDraftChange(merged.take(500))
                    },
                    label = { Text(reply) },
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(MessageComposerMode.entries, key = { it.name }) { mode ->
                FilterChip(
                    selected = composerMode == mode,
                    onClick = { onComposerModeChange(mode) },
                    label = {
                        Text(
                            when (mode) {
                                MessageComposerMode.TEXT -> stringResource(id = R.string.messages_mode_text)
                                MessageComposerMode.PHOTO -> stringResource(id = R.string.messages_mode_photo)
                                MessageComposerMode.FILE -> stringResource(id = R.string.messages_mode_file)
                            },
                        )
                    },
                )
            }
        }

        if (composerMode != MessageComposerMode.TEXT) {
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = attachmentUrl,
                onValueChange = onAttachmentUrlChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text(stringResource(id = R.string.messages_attachment_url_label)) },
                placeholder = { Text(stringResource(id = R.string.messages_attachment_url_placeholder)) },
                singleLine = true,
            )
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = attachmentName,
                onValueChange = onAttachmentNameChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text(stringResource(id = R.string.messages_attachment_name_label)) },
                singleLine = true,
            )
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = attachmentMimeType,
                onValueChange = onAttachmentMimeTypeChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text(stringResource(id = R.string.messages_attachment_type_label)) },
                singleLine = true,
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = onAttachmentClear) {
                    Text(stringResource(id = R.string.messages_attachment_clear))
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(verticalAlignment = Alignment.Bottom) {
            OutlinedTextField(
                value = draftMessage,
                onValueChange = { updated ->
                    if (updated.length <= 500) {
                        onDraftChange(updated)
                    }
                },
                modifier = Modifier.weight(1f),
                placeholder = { Text(stringResource(id = R.string.messages_draft_placeholder)) },
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                keyboardActions = KeyboardActions(onSend = { onSend() }),
                maxLines = 4,
                supportingText = {
                    Text("${draftMessage.length}/500")
                },
            )

            Spacer(modifier = Modifier.width(8.dp))

            Button(
                onClick = onSend,
                enabled = isSending.not() && canSend,
                modifier = Modifier.height(52.dp),
            ) {
                if (isSending) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(stringResource(id = R.string.messages_sending))
                } else {
                    Icon(
                        Icons.AutoMirrored.Outlined.Send,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onPrimary,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(sendLabel)
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(
    message: ThreadMessage,
    isOwnMessage: Boolean,
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isOwnMessage) Alignment.End else Alignment.Start,
    ) {
        if (!isOwnMessage) {
            Text(
                text = message.senderName,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 4.dp),
            )
        }
        Surface(
            shape = RoundedCornerShape(18.dp),
            color = if (isOwnMessage) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant,
        ) {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                val visibleText = when (message.messageType) {
                    "image" -> if (message.content == "[Attachment]") "Photo" else message.content
                    "file", "mixed" -> if (message.content == "[Attachment]") "Attachment" else message.content
                    else -> message.content
                }
                if (visibleText.isNotBlank()) {
                    Text(
                        text = visibleText,
                        style = MaterialTheme.typography.bodyLarge,
                    )
                }
                if (message.attachments.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    message.attachments.forEach { attachment ->
                        Text(
                            text = "• ${attachment.name}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = message.createdAt?.let { RelativeTimeFormatter.relativeOrFallback(it) ?: it } ?: "Just now",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun EmptyStateCard(
    title: String,
    subtitle: String,
) {
    Card {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(
                imageVector = Icons.Outlined.Forum,
                contentDescription = null,
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.primary,
            )
            Text(text = title, style = MaterialTheme.typography.titleMedium)
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
