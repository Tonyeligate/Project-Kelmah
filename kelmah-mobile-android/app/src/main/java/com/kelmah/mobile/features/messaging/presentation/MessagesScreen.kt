package com.kelmah.mobile.features.messaging.presentation

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.rememberTransformableState
import androidx.compose.foundation.gestures.transformable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.OpenInNew
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.outlined.BrokenImage
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Forum
import androidx.compose.material.icons.outlined.Image
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
import androidx.compose.material3.LinearProgressIndicator
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.kelmah.mobile.R
import com.kelmah.mobile.core.design.components.KelmahReveal
import com.kelmah.mobile.core.design.components.KelmahScreenBackground
import com.kelmah.mobile.core.design.components.KelmahPrimaryActionMinHeight
import com.kelmah.mobile.core.design.components.KelmahSecondaryActionMinHeight
import com.kelmah.mobile.core.design.components.kelmahMutedPanelColors
import com.kelmah.mobile.core.design.components.kelmahPanelColors
import com.kelmah.mobile.core.design.components.kelmahTopAppBarColors
import com.kelmah.mobile.core.utils.RelativeTimeFormatter
import com.kelmah.mobile.features.messaging.data.ConversationSummary
import com.kelmah.mobile.features.messaging.data.MessageAttachment
import com.kelmah.mobile.features.messaging.data.ThreadMessage
import java.io.ByteArrayOutputStream
import java.io.InputStream
import java.util.Locale
import coil.compose.AsyncImagePainter
import coil.compose.rememberAsyncImagePainter
import coil.request.ImageRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessagesScreen(
    initialConversationId: String? = null,
    viewModel: MessagesViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbars = remember { SnackbarHostState() }
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var handledInitialConversation by rememberSaveable(initialConversationId) { mutableStateOf(initialConversationId == null) }

    val uploadFromUri: (Uri?, Boolean) -> Unit = { uri, preferImageMime ->
        if (uri == null) {
            Unit
        } else {
            coroutineScope.launch {
                when (val prepared = prepareAttachmentForUpload(context, uri, preferImageMime)) {
                    is PreparedAttachmentResult.Ready -> {
                        viewModel.uploadAttachment(
                            fileName = prepared.name,
                            mimeType = prepared.mimeType,
                            fileBytes = prepared.bytes,
                        )
                    }
                    is PreparedAttachmentResult.Error -> {
                        viewModel.reportAttachmentSelectionError(prepared.message)
                    }
                }
            }
        }
    }

    val photoPickerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uploadFromUri(uri, true)
    }
    val filePickerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uploadFromUri(uri, false)
    }

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

    KelmahScreenBackground {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            text = state.selectedConversation?.displayTitle ?: stringResource(id = R.string.messages_title),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    },
                    colors = kelmahTopAppBarColors(),
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
                        .padding(horizontal = 16.dp, vertical = 14.dp),
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
                    pendingAttachment = state.pendingAttachment,
                    isLoading = state.isLoadingMessages,
                    isSending = state.isSending,
                    isUploadingAttachment = state.isUploadingAttachment,
                    attachmentUploadProgress = state.attachmentUploadProgress,
                    canRetryAttachmentUpload = state.canRetryAttachmentUpload,
                    onDraftChange = viewModel::updateDraft,
                    onComposerModeChange = viewModel::updateComposerMode,
                    onPickPhoto = {
                        photoPickerLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                        )
                    },
                    onPickFile = {
                        filePickerLauncher.launch(arrayOf("*/*"))
                    },
                    onAttachmentClear = viewModel::clearAttachmentDraft,
                    onRetryAttachmentUpload = viewModel::retryAttachmentUpload,
                    onSend = viewModel::sendMessage,
                )
            }
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
    val unreadConversations = conversations.count { it.unreadCount > 0 }
    val unreadMessages = conversations.sumOf { it.unreadCount }

    Column(modifier = modifier) {
        KelmahReveal(index = 0) {
            Card(colors = kelmahMutedPanelColors(), shape = MaterialTheme.shapes.large) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    ConversationDensityTile(
                        modifier = Modifier.weight(1f),
                        label = "Chats",
                        value = conversations.size,
                    )
                    ConversationDensityTile(
                        modifier = Modifier.weight(1f),
                        label = "Unread",
                        value = unreadConversations,
                    )
                    ConversationDensityTile(
                        modifier = Modifier.weight(1f),
                        label = "Msgs",
                        value = unreadMessages,
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchChange,
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = KelmahPrimaryActionMinHeight),
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
                    itemsIndexed(conversations, key = { _, conversation -> conversation.id }) { index, conversation ->
                        KelmahReveal(index = index + 1) {
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
}

@Composable
private fun ConversationDensityTile(
    modifier: Modifier = Modifier,
    label: String,
    value: Int,
) {
    Card(
        modifier = modifier,
        colors = kelmahPanelColors(),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                text = value.toString(),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
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
        colors = kelmahPanelColors(),
        shape = MaterialTheme.shapes.large,
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
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
    pendingAttachment: MessageAttachment?,
    isLoading: Boolean,
    isSending: Boolean,
    isUploadingAttachment: Boolean,
    attachmentUploadProgress: Int,
    canRetryAttachmentUpload: Boolean,
    onDraftChange: (String) -> Unit,
    onComposerModeChange: (MessageComposerMode) -> Unit,
    onPickPhoto: () -> Unit,
    onPickFile: () -> Unit,
    onAttachmentClear: () -> Unit,
    onRetryAttachmentUpload: () -> Unit,
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

    val canSend = (draftMessage.trim().isNotEmpty() || pendingAttachment != null) && !isUploadingAttachment
    val attachmentMode = when {
        composerMode == MessageComposerMode.PHOTO -> MessageComposerMode.PHOTO
        composerMode == MessageComposerMode.FILE -> MessageComposerMode.FILE
        pendingAttachment?.fileType?.startsWith("image/", ignoreCase = true) == true -> MessageComposerMode.PHOTO
        else -> MessageComposerMode.FILE
    }
    val sendLabel = when {
        pendingAttachment != null && attachmentMode == MessageComposerMode.PHOTO -> stringResource(id = R.string.messages_send_photo)
        pendingAttachment != null && attachmentMode == MessageComposerMode.FILE -> stringResource(id = R.string.messages_send_file)
        composerMode == MessageComposerMode.PHOTO -> stringResource(id = R.string.messages_send_photo)
        composerMode == MessageComposerMode.FILE -> stringResource(id = R.string.messages_send_file)
        else -> stringResource(id = R.string.messages_send)
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
                    modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
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
                    modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
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

        if (composerMode != MessageComposerMode.TEXT || pendingAttachment != null || isUploadingAttachment) {
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.55f),
                ),
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        text = if (attachmentMode == MessageComposerMode.PHOTO) {
                            stringResource(id = R.string.messages_attachment_photo_title)
                        } else {
                            stringResource(id = R.string.messages_attachment_file_title)
                        },
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold,
                    )

                    when {
                        isUploadingAttachment -> {
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                    Text(
                                        text = stringResource(
                                            id = R.string.messages_attachment_uploading_progress,
                                            attachmentUploadProgress.coerceIn(0, 100),
                                        ),
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                                LinearProgressIndicator(
                                    progress = { attachmentUploadProgress.coerceIn(0, 100) / 100f },
                                    modifier = Modifier.fillMaxWidth(),
                                )
                            }
                        }

                        pendingAttachment != null -> {
                            Text(
                                text = pendingAttachment.name,
                                style = MaterialTheme.typography.bodyMedium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Text(
                                text = pendingAttachment.fileType,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            pendingAttachment.fileSize?.let { bytes ->
                                Text(
                                    text = formatAttachmentSize(bytes),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }

                        else -> {
                            Text(
                                text = if (attachmentMode == MessageComposerMode.PHOTO) {
                                    stringResource(id = R.string.messages_attachment_photo_hint)
                                } else {
                                    stringResource(id = R.string.messages_attachment_file_hint)
                                },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                    ) {
                        TextButton(
                            onClick = {
                                if (attachmentMode == MessageComposerMode.PHOTO) {
                                    onPickPhoto()
                                } else {
                                    onPickFile()
                                }
                            },
                            enabled = !isUploadingAttachment,
                            modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                        ) {
                            Text(
                                text = if (pendingAttachment == null) {
                                    stringResource(id = R.string.messages_attachment_pick)
                                } else {
                                    stringResource(id = R.string.messages_attachment_replace)
                                },
                            )
                        }

                        if (pendingAttachment != null) {
                            TextButton(
                                onClick = onAttachmentClear,
                                enabled = !isUploadingAttachment,
                                modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                            ) {
                                Text(stringResource(id = R.string.messages_attachment_clear))
                            }
                        } else if (canRetryAttachmentUpload) {
                            TextButton(
                                onClick = onRetryAttachmentUpload,
                                enabled = !isUploadingAttachment,
                                modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                            ) {
                                Text(stringResource(id = R.string.messages_attachment_retry))
                            }
                        }
                    }
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
                modifier = Modifier.heightIn(min = KelmahPrimaryActionMinHeight),
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
    val uriHandler = LocalUriHandler.current
    var previewAttachment by remember(message.id) { mutableStateOf<MessageAttachment?>(null) }

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
                        MessageAttachmentCard(
                            attachment = attachment,
                            onOpenExternal = { runCatching { uriHandler.openUri(attachment.fileUrl) } },
                            onOpenFullscreen = {
                                if (attachment.fileType.startsWith("image/", ignoreCase = true)) {
                                    previewAttachment = attachment
                                }
                            },
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

    previewAttachment?.let { selectedAttachment ->
        AttachmentPreviewDialog(
            attachment = selectedAttachment,
            onDismiss = { previewAttachment = null },
            onOpenExternal = { runCatching { uriHandler.openUri(selectedAttachment.fileUrl) } },
        )
    }
}

@Composable
internal fun MessageAttachmentCard(
    attachment: MessageAttachment,
    onOpenExternal: () -> Unit,
    onOpenFullscreen: () -> Unit,
    previewStateOverride: AttachmentPreviewRenderState? = null,
) {
    val context = LocalContext.current
    var previewRetryToken by remember(attachment.fileUrl) { mutableStateOf(0) }

    val isImageAttachment = attachment.fileType.startsWith("image/", ignoreCase = true)
    val openable = isOpenableAttachmentUrl(attachment.fileUrl)
    val thumbnailPainter = rememberAsyncImagePainter(
        model = if (previewStateOverride == null) {
            ImageRequest.Builder(context)
                .data(attachment.fileUrl)
                .setParameter("thumb-retry-token", previewRetryToken)
                .crossfade(true)
                .build()
        } else {
            null
        },
    )
    val previewState = previewStateOverride ?: when (thumbnailPainter.state) {
        is AsyncImagePainter.State.Error -> AttachmentPreviewRenderState.Error
        is AsyncImagePainter.State.Success -> AttachmentPreviewRenderState.Success
        else -> AttachmentPreviewRenderState.Loading
    }
    val previewFailed = previewState == AttachmentPreviewRenderState.Error
    val fileTypeBadge = attachmentPrimaryTypeBadge(attachment.fileType)
    val extensionBadge = attachmentExtensionBadge(attachment.name)

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (isImageAttachment && openable) {
                Image(
                    painter = thumbnailPainter,
                    contentDescription = attachment.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(min = 96.dp, max = 180.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .clickable(onClick = onOpenFullscreen),
                )
            }

            if (isImageAttachment && previewFailed) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        imageVector = Icons.Outlined.BrokenImage,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error,
                        modifier = Modifier.size(16.dp),
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(id = R.string.messages_attachment_preview_unavailable),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.weight(1f),
                    )
                    TextButton(onClick = { previewRetryToken += 1 }) {
                        Text(stringResource(id = R.string.common_try_again))
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = if (isImageAttachment) {
                        Icons.Outlined.Image
                    } else {
                        Icons.Outlined.Description
                    },
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(18.dp),
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = attachment.name,
                        style = MaterialTheme.typography.bodySmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        text = attachment.fileType,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        AttachmentBadge(text = fileTypeBadge)
                        extensionBadge?.let { AttachmentBadge(text = it) }
                    }
                }
                if (isImageAttachment && openable) {
                    TextButton(
                        onClick = onOpenFullscreen,
                        modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                    ) {
                        Text(stringResource(id = R.string.messages_attachment_view_fullscreen))
                    }
                }
                if (openable) {
                    TextButton(
                        onClick = onOpenExternal,
                        modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                    ) {
                        Icon(Icons.AutoMirrored.Outlined.OpenInNew, contentDescription = null)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(stringResource(id = R.string.common_open))
                    }
                }
            }
        }
    }
}

@Composable
private fun AttachmentBadge(
    text: String,
) {
    Surface(
        shape = RoundedCornerShape(999.dp),
        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.6f),
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onPrimaryContainer,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

@Composable
private fun AttachmentPreviewDialog(
    attachment: MessageAttachment,
    onDismiss: () -> Unit,
    onOpenExternal: () -> Unit,
) {
    val context = LocalContext.current
    var retryToken by remember(attachment.fileUrl) { mutableStateOf(0) }
    var zoom by remember(attachment.fileUrl) { mutableStateOf(1f) }
    var panOffset by remember(attachment.fileUrl) { mutableStateOf(Offset.Zero) }
    val painter = rememberAsyncImagePainter(
        model = ImageRequest.Builder(context)
            .data(attachment.fileUrl)
            .setParameter("dialog-retry-token", retryToken)
            .crossfade(true)
            .build(),
    )
    val imageLoadFailed = painter.state is AsyncImagePainter.State.Error

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
        ) {
            if (imageLoadFailed) {
                Column(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(horizontal = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(
                        imageVector = Icons.Outlined.BrokenImage,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(40.dp),
                    )
                    Text(
                        text = stringResource(id = R.string.messages_attachment_preview_unavailable),
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(
                            onClick = {
                                retryToken += 1
                                zoom = 1f
                                panOffset = Offset.Zero
                            },
                            modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                        ) {
                            Text(
                                text = stringResource(id = R.string.common_try_again),
                                color = Color.White,
                            )
                        }
                        TextButton(
                            onClick = onOpenExternal,
                            modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                        ) {
                            Text(
                                text = stringResource(id = R.string.common_open),
                                color = Color.White,
                            )
                        }
                    }
                }
            } else {
                BoxWithConstraints(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp),
                ) {
                    val density = LocalDensity.current
                    val viewportWidth = with(density) { maxWidth.toPx() }
                    val viewportHeight = with(density) { maxHeight.toPx() }

                    fun clampOffset(candidate: Offset, scaleFactor: Float): Offset {
                        if (scaleFactor <= 1f) return Offset.Zero
                        val maxX = ((scaleFactor - 1f) * viewportWidth / 2f).coerceAtLeast(0f)
                        val maxY = ((scaleFactor - 1f) * viewportHeight / 2f).coerceAtLeast(0f)
                        return Offset(
                            x = candidate.x.coerceIn(-maxX, maxX),
                            y = candidate.y.coerceIn(-maxY, maxY),
                        )
                    }

                    val transformableState = rememberTransformableState { zoomChange, panChange, _ ->
                        val nextZoom = (zoom * zoomChange).coerceIn(1f, 4f)
                        val nextOffset = clampOffset(panOffset + panChange, nextZoom)
                        zoom = nextZoom
                        panOffset = if (nextZoom <= 1f) Offset.Zero else nextOffset
                    }

                    Image(
                        painter = painter,
                        contentDescription = attachment.name,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier
                            .fillMaxSize()
                            .graphicsLayer {
                                scaleX = zoom
                                scaleY = zoom
                                translationX = panOffset.x
                                translationY = panOffset.y
                            }
                            .pointerInput(viewportWidth, viewportHeight, zoom) {
                                detectTapGestures(
                                    onDoubleTap = { tapOffset ->
                                        if (zoom > 1.35f) {
                                            zoom = 1f
                                            panOffset = Offset.Zero
                                        } else {
                                            val targetZoom = 2.5f
                                            val targetOffset = Offset(
                                                x = (viewportWidth / 2f - tapOffset.x) * (targetZoom - 1f),
                                                y = (viewportHeight / 2f - tapOffset.y) * (targetZoom - 1f),
                                            )
                                            zoom = targetZoom
                                            panOffset = clampOffset(targetOffset, targetZoom)
                                        }
                                    },
                                )
                            }
                            .transformable(state = transformableState),
                    )
                }
            }

            Row(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(
                    onClick = onOpenExternal,
                    modifier = Modifier.heightIn(min = KelmahSecondaryActionMinHeight),
                ) {
                    Text(
                        text = stringResource(id = R.string.common_open),
                        color = Color.White,
                    )
                }
                IconButton(onClick = onDismiss) {
                    Icon(
                        imageVector = Icons.Outlined.Close,
                        contentDescription = stringResource(id = R.string.messages_attachment_close_preview),
                        tint = Color.White,
                    )
                }
            }

            Text(
                text = attachment.name,
                style = MaterialTheme.typography.bodySmall,
                color = Color.White,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(horizontal = 24.dp, vertical = 14.dp),
            )
        }
    }
}

internal enum class AttachmentPreviewRenderState {
    Loading,
    Success,
    Error,
}

@Composable
private fun EmptyStateCard(
    title: String,
    subtitle: String,
) {
    Card(colors = kelmahMutedPanelColors()) {
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

private const val MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

private sealed interface PreparedAttachmentResult {
    data class Ready(
        val name: String,
        val mimeType: String,
        val bytes: ByteArray,
    ) : PreparedAttachmentResult

    data class Error(val message: String) : PreparedAttachmentResult
}

private suspend fun prepareAttachmentForUpload(
    context: Context,
    uri: Uri,
    preferImageMime: Boolean,
): PreparedAttachmentResult = withContext(Dispatchers.IO) {
    val resolver = context.contentResolver
    val mimeType = resolver.getType(uri)?.trim().takeUnless { it.isNullOrBlank() }
        ?: if (preferImageMime) "image/jpeg" else "application/octet-stream"
    val displayName = queryDisplayName(context, uri)
        ?: uri.lastPathSegment
        ?: if (preferImageMime) "photo.jpg" else "attachment.bin"

    val stream = runCatching { resolver.openInputStream(uri) }.getOrNull()
        ?: return@withContext PreparedAttachmentResult.Error("Unable to open selected file")

    val bytes = stream.use { input -> readWithLimit(input, MAX_ATTACHMENT_BYTES) }
        ?: return@withContext PreparedAttachmentResult.Error("File exceeds 25 MB limit")

    if (bytes.isEmpty()) {
        return@withContext PreparedAttachmentResult.Error("Selected file is empty")
    }

    PreparedAttachmentResult.Ready(
        name = displayName,
        mimeType = mimeType,
        bytes = bytes,
    )
}

private fun queryDisplayName(context: Context, uri: Uri): String? {
    val resolver = context.contentResolver
    return runCatching {
        resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
            if (!cursor.moveToFirst()) {
                null
            } else {
                val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                if (index == -1) null else cursor.getString(index)
            }
        }
    }.getOrNull()
}

private fun readWithLimit(inputStream: InputStream, maxBytes: Int): ByteArray? {
    val buffer = ByteArray(8 * 1024)
    val output = ByteArrayOutputStream()
    var totalRead = 0

    while (true) {
        val bytesRead = inputStream.read(buffer)
        if (bytesRead <= 0) break
        totalRead += bytesRead
        if (totalRead > maxBytes) {
            return null
        }
        output.write(buffer, 0, bytesRead)
    }

    return output.toByteArray()
}

private fun formatAttachmentSize(bytes: Long): String {
    if (bytes <= 0L) return "0 KB"
    val kb = bytes / 1024.0
    if (kb < 1024) return String.format(Locale.US, "%.1f KB", kb)
    val mb = kb / 1024.0
    return String.format(Locale.US, "%.1f MB", mb)
}

private fun isOpenableAttachmentUrl(url: String): Boolean {
    val normalized = url.trim().lowercase(Locale.US)
    return normalized.startsWith("https://") || normalized.startsWith("http://")
}

private fun attachmentPrimaryTypeBadge(fileType: String): String {
    val normalized = fileType.trim().lowercase(Locale.US)
    return when {
        normalized.startsWith("image/") -> "IMAGE"
        normalized.startsWith("video/") -> "VIDEO"
        normalized.startsWith("audio/") -> "AUDIO"
        normalized.contains("pdf") -> "PDF"
        normalized.contains("word") || normalized.contains("document") -> "DOC"
        normalized.contains("sheet") || normalized.contains("excel") -> "SHEET"
        normalized.isBlank() || normalized == "application/octet-stream" -> "FILE"
        else -> normalized.substringBefore('/').uppercase(Locale.US)
    }
}

private fun attachmentExtensionBadge(fileName: String): String? {
    val extension = fileName.substringAfterLast('.', "").trim()
    if (extension.isBlank()) return null
    val normalized = extension.take(8).uppercase(Locale.US)
    return if (normalized.isBlank()) null else normalized
}
