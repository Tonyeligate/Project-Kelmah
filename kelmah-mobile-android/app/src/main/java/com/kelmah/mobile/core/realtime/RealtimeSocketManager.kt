package com.kelmah.mobile.core.realtime

import com.kelmah.mobile.core.network.NetworkConfig
import com.kelmah.mobile.core.storage.TokenManager
import io.socket.client.IO
import io.socket.client.Socket
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import org.json.JSONObject

sealed interface RealtimeSignal {
    data class MessageReceived(val conversationId: String?) : RealtimeSignal
    data class MessagesRead(val conversationId: String?) : RealtimeSignal
    data object NotificationReceived : RealtimeSignal
    data class ConnectionChanged(val isConnected: Boolean) : RealtimeSignal
}

@Singleton
class RealtimeSocketManager @Inject constructor(
    private val tokenManager: TokenManager,
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _signals = MutableSharedFlow<RealtimeSignal>(extraBufferCapacity = 32)
    val signals: SharedFlow<RealtimeSignal> = _signals.asSharedFlow()

    @Volatile
    private var socket: Socket? = null

    @Volatile
    private var desiredConnection = false

    @Volatile
    private var activeToken: String? = null

    init {
        scope.launch {
            tokenManager.sessionFlow
                .map { it?.accessToken }
                .distinctUntilChanged()
                .collect { token ->
                    synchronized(this@RealtimeSocketManager) {
                        val previousToken = activeToken
                        activeToken = token

                        if (!desiredConnection) {
                            return@synchronized
                        }

                        if (token.isNullOrBlank()) {
                            disconnectSocketLocked(emitDisconnected = true)
                            return@synchronized
                        }

                        if (previousToken != token) {
                            connectSocketLocked(token)
                        }
                    }
                }
        }
    }

    fun start() {
        synchronized(this) {
            val token = tokenManager.getAccessToken()
            desiredConnection = true
            activeToken = token
            if (token.isNullOrBlank()) {
                disconnectSocketLocked(emitDisconnected = true)
                return
            }

            val existingSocket = socket
            if (existingSocket != null && existingSocket.connected() && activeToken == token) {
                return
            }

            connectSocketLocked(token)
        }
    }

    fun stop() {
        synchronized(this) {
            desiredConnection = false
            disconnectSocketLocked(emitDisconnected = true)
        }
    }

    private fun connectSocketLocked(token: String) {
        disconnectSocketLocked(emitDisconnected = false)

        val options = IO.Options().apply {
            reconnection = true
            reconnectionAttempts = 5
            reconnectionDelay = 1_000
            reconnectionDelayMax = 10_000
            forceNew = true
            path = "/socket.io"
            transports = arrayOf("websocket", "polling")
            auth = mutableMapOf("token" to token)
        }

        val createdSocket = IO.socket(NetworkConfig.gatewayOrigin, options)
        attachListeners(createdSocket)
        socket = createdSocket
        createdSocket.connect()
    }

    private fun disconnectSocketLocked(emitDisconnected: Boolean) {
        socket?.off()
        socket?.disconnect()
        socket = null
        if (emitDisconnected) {
            _signals.tryEmit(RealtimeSignal.ConnectionChanged(false))
        }
    }

    private fun attachListeners(socket: Socket) {
        socket.on(Socket.EVENT_CONNECT) {
            _signals.tryEmit(RealtimeSignal.ConnectionChanged(true))
        }
        socket.on(Socket.EVENT_DISCONNECT) {
            _signals.tryEmit(RealtimeSignal.ConnectionChanged(false))
        }
        socket.on("new_message") { args ->
            _signals.tryEmit(RealtimeSignal.MessageReceived(parseConversationId(args)))
        }
        socket.on("receive_message") { args ->
            _signals.tryEmit(RealtimeSignal.MessageReceived(parseConversationId(args)))
        }
        socket.on("messages_read") { args ->
            _signals.tryEmit(RealtimeSignal.MessagesRead(parseConversationId(args)))
        }
        socket.on("message_read") { args ->
            _signals.tryEmit(RealtimeSignal.MessagesRead(parseConversationId(args)))
        }
        socket.on("notification") {
            _signals.tryEmit(RealtimeSignal.NotificationReceived)
        }
    }

    private fun parseConversationId(args: Array<out Any>): String? {
        val payload = args.firstOrNull() as? JSONObject ?: return null
        val directConversationId = payload.optString("conversationId").takeIf { it.isNotBlank() }
        if (directConversationId != null) {
            return directConversationId
        }

        val nestedData = payload.optJSONObject("data")
        return nestedData?.optString("conversationId")?.takeIf { it.isNotBlank() }
            ?: payload.optString("conversation").takeIf { it.isNotBlank() }
    }
}