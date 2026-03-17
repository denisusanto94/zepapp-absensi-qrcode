import * as hmUI from "@zos/ui";
import { setStatusBarVisible } from "@zos/ui";
import { log as Logger, px } from "@zos/utils";
import { setInterval, clearInterval, setTimeout } from "@zos/timer";
import { Geolocation } from "@zos/sensor";
import { getDeviceInfo } from "@zos/device";
import { 
  DEVICE_WIDTH, 
  DEVICE_HEIGHT, 
  PADDING
} from "zosLoader:./index.page.[pf].layout.js";

const logger = Logger.getLogger("absensi-qr");
const QR_UPDATE_INTERVAL = 5000;
const deviceInfo = getDeviceInfo();

Page({
  state: {
    qrWidget: null,
    qrBackground: null,
    timeText: null,
    gpsText: null,
    geolocation: null,
    qrTimer: null,
    gpsCheckInterval: null,
    gpsTimeoutHandle: null,
    gpsStartTime: null,
    latitude: null,
    longitude: null
  },

  onInit() {
    logger.debug("page onInit invoked");
    setStatusBarVisible(false);
  },

  build() {
    logger.debug("page build invoked");
    
    const padding = px(20);
    let currentY = px(15);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: currentY,
      w: DEVICE_WIDTH,
      h: px(36),
      color: 0x00b4d8,
      text_size: px(24),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: "ABSENSI QR"
    });
    currentY += px(50);

    const qrSize = DEVICE_WIDTH - (padding * 2) - px(16);
    const qrContainerSize = qrSize + px(16);
    const qrContainerX = (DEVICE_WIDTH - qrContainerSize) / 2;
    const qrX = qrContainerX + px(8);
    const qrY = currentY + px(8);

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: qrContainerX - px(4),
      y: currentY - px(4),
      w: qrContainerSize + px(8),
      h: qrContainerSize + px(8),
      radius: px(16),
      color: 0x00b4d8
    });

    this.state.qrBackground = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: qrContainerX,
      y: currentY,
      w: qrContainerSize,
      h: qrContainerSize,
      radius: px(12),
      color: 0xffffff
    });

    this.state.qrWidget = hmUI.createWidget(hmUI.widget.QRCODE, {
      x: qrX,
      y: qrY,
      w: qrSize,
      h: qrSize,
      content: this.getQRContent()
    });
    currentY += qrContainerSize + px(20);

    this.state.timeText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: currentY,
      w: DEVICE_WIDTH,
      h: px(32),
      color: 0x90e0ef,
      text_size: px(22),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: this.getTimeString()
    });
    currentY += px(50);

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: padding,
      y: currentY,
      w: DEVICE_WIDTH - (padding * 2),
      h: px(1),
      color: 0x1a3a5c
    });
    currentY += px(20);

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: currentY,
      w: DEVICE_WIDTH,
      h: px(24),
      color: 0x48cae4,
      text_size: px(16),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: "LOKASI GPS"
    });
    currentY += px(30);

    this.state.gpsText = hmUI.createWidget(hmUI.widget.TEXT, {
      x: padding,
      y: currentY,
      w: DEVICE_WIDTH - (padding * 2),
      h: px(40),
      color: 0x90e0ef,
      text_size: px(14),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text_style: hmUI.text_style.WRAP,
      text: "Belum ada lokasi"
    });
    currentY += px(50);

    const btnWidth = px(180);
    const btnHeight = px(48);
    const btnX = (DEVICE_WIDTH - btnWidth) / 2;
    
    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: btnX,
      y: currentY,
      w: btnWidth,
      h: btnHeight,
      radius: px(24),
      color: 0x00b4d8
    });

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: btnX + px(3),
      y: currentY + px(3),
      w: btnWidth - px(6),
      h: btnHeight - px(6),
      radius: px(21),
      color: 0x023e8a
    });

    hmUI.createWidget(hmUI.widget.TEXT, {
      x: btnX,
      y: currentY,
      w: btnWidth,
      h: btnHeight,
      color: 0xffffff,
      text_size: px(16),
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: "SCAN GPS"
    });

    hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: btnX,
      y: currentY,
      w: btnWidth,
      h: btnHeight,
      radius: px(24),
      color: 0x000000,
      alpha: 0
    }).addEventListener(hmUI.event.CLICK_UP, () => {
      this.searchGPS();
    });
    currentY += px(80);

    hmUI.setScrollView(true, DEVICE_HEIGHT, currentY, true);

    const qrXPos = qrX;
    const qrYPos = qrY;
    const qrSizeVal = qrSize;
    const qrContainerXPos = qrContainerX;
    const qrContainerYStart = qrY - px(8);
    const qrContainerSizeVal = qrContainerSize;

    this.state.qrTimer = setInterval(() => {
      this.updateQRCode(qrXPos, qrYPos, qrSizeVal, qrContainerXPos, qrContainerYStart, qrContainerSizeVal);
      if (this.state.timeText) {
        this.state.timeText.setProperty(hmUI.prop.TEXT, this.getTimeString());
      }
    }, QR_UPDATE_INTERVAL);
  },

  getTimeString() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  },

  getQRContent() {
    const deviceId = deviceInfo.deviceSource || deviceInfo.deviceName || "UNKNOWN";
    const timestamp = Date.now().toString();
    const latitude = this.state.latitude || "";
    const longitude = this.state.longitude || "";
    
    const data = {
      device_id: deviceId,
      timestamp: timestamp,
      latitude: latitude,
      longitude: longitude
    };
    
    return JSON.stringify(data);
  },

  updateQRCode(qrX, qrY, qrSize, containerX, containerY, containerSize) {
    if (this.state.qrWidget) {
      hmUI.deleteWidget(this.state.qrWidget);
    }
    if (this.state.qrBackground) {
      hmUI.deleteWidget(this.state.qrBackground);
    }
    
    this.state.qrBackground = hmUI.createWidget(hmUI.widget.FILL_RECT, {
      x: containerX,
      y: containerY,
      w: containerSize,
      h: containerSize,
      radius: px(12),
      color: 0xffffff
    });

    this.state.qrWidget = hmUI.createWidget(hmUI.widget.QRCODE, {
      x: qrX,
      y: qrY,
      w: qrSize,
      h: qrSize,
      content: this.getQRContent()
    });
  },

  stopGPSAndClearTimers() {
    if (this.state.gpsCheckInterval) {
      clearInterval(this.state.gpsCheckInterval);
      this.state.gpsCheckInterval = null;
    }
    if (this.state.gpsTimeoutHandle) {
      clearTimeout(this.state.gpsTimeoutHandle);
      this.state.gpsTimeoutHandle = null;
    }
    if (this.state.geolocation) {
      this.state.geolocation.stop();
    }
  },

  applyGPSResult(lat, lon, isEstimated) {
    if (!lat || !lon || lat === 0 || lon === 0) return false;
    this.state.latitude = Number(lat).toFixed(6);
    this.state.longitude = Number(lon).toFixed(6);
    this.stopGPSAndClearTimers();
    if (this.state.gpsText) {
      this.state.gpsText.setProperty(hmUI.prop.COLOR, 0x4caf50);
      const label = isEstimated ? "(perkiraan) " : "";
      this.state.gpsText.setProperty(
        hmUI.prop.TEXT,
        label + `${this.state.latitude}, ${this.state.longitude}`
      );
    }
    logger.debug(`GPS acquired: ${this.state.latitude}, ${this.state.longitude}`);
    return true;
  },

  checkGPSFix() {
    if (!this.state.geolocation || (this.state.latitude && this.state.longitude)) return;
    const status = this.state.geolocation.getStatus();
    const lat = this.state.geolocation.getLatitude();
    const lon = this.state.geolocation.getLongitude();
    logger.debug(`GPS check: status=${status}, lat=${lat}, lon=${lon}`);
    if (lat == null || lon == null || lat === 0 || lon === 0) return;
    if (status === "A") {
      this.applyGPSResult(lat, lon, false);
      return;
    }
    const elapsed = this.state.gpsStartTime ? Date.now() - this.state.gpsStartTime : 0;
    if (status === "V" && elapsed >= 20000) {
      this.applyGPSResult(lat, lon, true);
    }
  },

  searchGPS() {
    logger.debug("GPS search triggered");
    this.stopGPSAndClearTimers();

    if (this.state.gpsText) {
      this.state.gpsText.setProperty(hmUI.prop.TEXT, "Mencari sinyal... (dalam ruangan: tunggu/dekat jendela)");
      this.state.gpsText.setProperty(hmUI.prop.COLOR, 0xffc107);
    }

    try {
      if (!this.state.geolocation) {
        this.state.geolocation = new Geolocation();
      }
      this.state.gpsStartTime = Date.now();
      this.state.geolocation.start();
      logger.debug("GPS sensor started");

      this.state.geolocation.onChange(() => {
        this.checkGPSFix();
      });

      const GPS_POLL_INTERVAL = 2500;
      const GPS_TIMEOUT_MS = 90000;

      this.state.gpsCheckInterval = setInterval(() => {
        this.checkGPSFix();
        const lat = this.state.geolocation.getLatitude();
        const lon = this.state.geolocation.getLongitude();
        if (lat != null && lon != null && lat !== 0 && lon !== 0 && !this.state.latitude) {
          const status = this.state.geolocation.getStatus();
          const isEstimated = status === "V";
          if (status === "A") {
            this.applyGPSResult(lat, lon, false);
          } else if (isEstimated && this.state.gpsText) {
            this.state.gpsText.setProperty(hmUI.prop.TEXT, "Sinyal lemah, mencoba lokasi perkiraan...");
          }
        }
      }, GPS_POLL_INTERVAL);

      this.state.gpsTimeoutHandle = setTimeout(() => {
        if (this.state.gpsCheckInterval) {
          clearInterval(this.state.gpsCheckInterval);
          this.state.gpsCheckInterval = null;
        }
        this.state.gpsTimeoutHandle = null;
        if (this.state.latitude && this.state.longitude) return;
        const status = this.state.geolocation.getStatus();
        const lat = this.state.geolocation.getLatitude();
        const lon = this.state.geolocation.getLongitude();
        if (lat != null && lon != null && lat !== 0 && lon !== 0) {
          this.applyGPSResult(lat, lon, true);
        } else {
          this.state.geolocation.stop();
          if (this.state.gpsText) {
            this.state.gpsText.setProperty(hmUI.prop.COLOR, 0xff6b6b);
            this.state.gpsText.setProperty(hmUI.prop.TEXT, "Timeout. Coba dekat jendela atau luar ruangan.");
          }
        }
      }, GPS_TIMEOUT_MS);

    } catch (e) {
      logger.error("GPS error: " + e.message);
      this.stopGPSAndClearTimers();
      if (this.state.gpsText) {
        this.state.gpsText.setProperty(hmUI.prop.COLOR, 0xff6b6b);
        this.state.gpsText.setProperty(hmUI.prop.TEXT, "Error: " + e.message);
      }
    }
  },

  onDestroy() {
    logger.debug("page onDestroy invoked");
    if (this.state.qrTimer) {
      clearInterval(this.state.qrTimer);
      this.state.qrTimer = null;
    }
    this.stopGPSAndClearTimers();
    this.state.geolocation = null;
  },
});
