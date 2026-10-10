package io.frame9.signaldesk

/**
 * Dependency-free contract. No Android SDK types.
 * A missing capability is a state, not invented data.
 */

enum class Source {
    LIVE_ANDROID_WIFI,
    LIVE_ANDROID_WIFI_RTT,
    LIVE_ANDROID_BLE,
    LIVE_ANDROID_VPN,
    LIVE_HOST,
    LIVE_CAMERA,
    LIVE_AUDIO,
    LIVE_USB,
    LIVE_USB_RF,
    LIVE_USB_DVB,
    OPEN_DATA_IANA,
    OPEN_DATA_RDAP,
    OPEN_DATA_TTJA,
    OPEN_DATA_VENDOR,
    USER_ASSERTED,
    SYNTHETIC_DEMO,
}

enum class CapState {
    READY,
    PERMISSION_REQUIRED,
    USER_CONSENT_REQUIRED,
    UNSUPPORTED_HARDWARE,
    NOT_CONNECTED,
    DISABLED,
    ERROR,
}

enum class SessionPreset { PULSE, SURVEY, WATCH }

data class ScanSession(
    val id: String,
    val preset: SessionPreset,
    val startedAtWallClockMs: Long,
    val startedAtMonotonicNs: Long,
)

data class Observation(
    val id: String,
    val sessionId: String,
    val observedAtWallClockMs: Long,
    val observedAtMonotonicNs: Long,
    val source: Source,
    val collectorId: String,
    val protocol: String,
    val subjectKey: String,
    val attributes: Map<String, String>,
    val rawBytes: ByteArray?,
    val privacyClass: String,
    val confidence: String,
)

data class CollectorCapabilities(
    val collectorId: String,
    val state: CapState,
    val detail: String,
)

interface Collector {
    val id: String
    suspend fun capabilities(): CollectorCapabilities
    suspend fun stop()
}

interface ObservationSink {
    fun accept(observation: Observation)
}

/** WifiManager scan results are not raw 802.11 frames. rawBytes stays null. */
interface WifiCollector : Collector

/** Only when FEATURE_WIFI_RTT is present. Never an RSSI estimate labeled as RTT. */
interface WifiRttCollector : Collector

/** BluetoothLeScanner. No automatic GATT connection. */
interface BleCollector : Collector

/** This phone only. No TLS interception and no other-device capture. */
interface VpnTrafficCollector : Collector

interface HostCollector : Collector
interface CameraCollector : Collector
interface AudioSpectrumCollector : Collector
interface UsbCollector : Collector

interface RfDeviceDriver {
    val available: Boolean
}

interface DvbDeviceDriver {
    val available: Boolean
}

interface TsParser {
    /** Returns null when no real transport-stream bytes were supplied. */
    fun describe(raw: ByteArray?): String?
}
