package com.kelmah.mobile.core.network

import com.kelmah.mobile.BuildConfig

object NetworkConfig {
    const val REQUEST_TIMEOUT_SECONDS = 30L

    private val normalizedGatewayOrigin = BuildConfig.GATEWAY_ORIGIN.trimEnd('/')

    val gatewayOrigin: String = normalizedGatewayOrigin
    val apiBaseUrl: String = "$normalizedGatewayOrigin/api/"
    val socketBaseUrl: String = "$normalizedGatewayOrigin/socket.io/"
}
