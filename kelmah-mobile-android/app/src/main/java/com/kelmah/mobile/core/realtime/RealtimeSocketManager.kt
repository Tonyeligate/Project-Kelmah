package com.kelmah.mobile.core.realtime

import com.kelmah.mobile.core.network.NetworkConfig
import com.kelmah.mobile.core.storage.TokenManager
import io.socket.client.IO
import io.socket.client.Socket
import javax.inject.Inject
import javax.inject.Singleton
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
    private val _signals = MutableSharedFlow<RealtimeSignal>(extraBufferCapacity = 32)
    val signals: SharedFlow<RealtimeSignal> = _signals.asSharedFlow()

    @Volatile
    private var socket: Socket? = null

    fun start() {
        synchronized(this) {
            val token = tokenManager.getAccessToken()
            if (token.isNullOrBlank()) {
                stop()
                return
            }

            val existingSocket = socket
            if (existingSocket != null && existingSocket.connected()) {
                return
            }

            existingSocket?.off()
            existingSocket?.disconnect()

            val options = IO.Options().apply {
                reconnection = true
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
    }

    fun stop() {
        synchronized(this) {
            socket?.off()
            socket?.disconnect()
            socket = null
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