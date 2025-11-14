import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Shoot.css";
import {
  getCurrentLanguage,
  setLanguage,
  loadTranslations,
  getAvailableLanguages,
  clearLanguageCache,
} from "../utils/language";
import { getAssetPath } from "../utils/pathHelper";

function Shoot() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photos, setPhotos] = useState([null, null, null, null]); // Slot-based system
  const [countdown, setCountdown] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());
  const [translations, setTranslations] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState(["VI", "EN"]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [facingMode, setFacingMode] = useState("user"); // "user" = front, "environment" = back
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const reservedSlotRef = useRef(null);
  const latestPhotosRef = useRef(photos);
  const capturingRef = useRef(false);

  // Effects states
  const [blackWhite, setBlackWhite] = useState(0);
  const [brightness, setBrightness] = useState(50); // Default 50 = 100% brightness
  const [classic, setClassic] = useState(0);
  const [blur, setBlur] = useState(0);
  const [lensFlare, setLensFlare] = useState(0);
  const [filmGrain, setFilmGrain] = useState(0);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Load translations
  useEffect(() => {
    async function loadLangData() {
      const lang = getCurrentLanguage();
      setCurrentLang(lang);
      const trans = await loadTranslations();
      setTranslations(trans);
      const langs = await getAvailableLanguages();
      setAvailableLanguages(langs);
      setIsInitialLoad(false);
    }
    loadLangData();
  }, []);

  useEffect(() => {
    if (isInitialLoad) return;
    async function reloadTranslations() {
      clearLanguageCache();
      const trans = await loadTranslations();
      setTranslations(trans);
    }
    reloadTranslations();
  }, [currentLang, isInitialLoad]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get available cameras
  useEffect(() => {
    async function getCameras() {
      try {
        // Request permission first to get camera labels (only on desktop)
        if (!isMobile) {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            // Stop the temporary stream immediately
            tempStream.getTracks().forEach((track) => track.stop());
          } catch (e) {
            // Permission denied or error, continue anyway
          }
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0 && !selectedCameraId && !isMobile) {
          // Set first camera as default (desktop only)
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
      }
    }
    getCameras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCurrentLang(lang);
  };

  // Checkbox handlers with auto values
  const handleBlackWhiteToggle = (checked) => {
    setBlackWhite(checked ? 100 : 0);
  };

  const handleBrightnessToggle = (checked) => {
    setBrightness(checked ? 70 : 50);
  };

  const handleClassicToggle = (checked) => {
    setClassic(checked ? 80 : 0);
  };

  const handleBlurToggle = (checked) => {
    setBlur(checked ? 30 : 0);
  };

  const handleLensFlareToggle = (checked) => {
    setLensFlare(checked ? 30 : 0);
  };

  const handleFilmGrainToggle = (checked) => {
    setFilmGrain(checked ? 30 : 0);
  };

  // Keep refs in sync with latest state
  useEffect(() => {
    latestPhotosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    capturingRef.current = isCapturing;
  }, [isCapturing]);

  // Helper function to check if a slot is empty
  const isSlotEmpty = useCallback((photo) => {
    return photo === null || (photo && photo.id === "reserved" && !photo.src);
  }, []);

  // Helper function to find first empty slot
  const findEmptySlot = useCallback(
    (photos) => {
      return photos.findIndex((photo) => isSlotEmpty(photo));
    },
    [isSlotEmpty]
  );

  // Helper function to find all empty slots
  const findAllEmptySlots = useCallback(
    (photos) => {
      return photos
        .map((photo, index) => (isSlotEmpty(photo) ? index : -1))
        .filter((index) => index !== -1);
    },
    [isSlotEmpty]
  );

  // Helper function to find next empty slot after currentSlot
  const findNextEmptySlot = useCallback(
    (photos, startFrom = 0) => {
      // First try from startFrom to end
      for (let i = startFrom; i < photos.length; i++) {
        if (isSlotEmpty(photos[i])) {
          return i;
        }
      }
      // Then try from beginning to startFrom
      for (let i = 0; i < startFrom; i++) {
        if (isSlotEmpty(photos[i])) {
          return i;
        }
      }
      return -1; // No empty slot found
    },
    [isSlotEmpty]
  );

  // Camera setup
  useEffect(() => {
    if (isMobile) {
      startCamera(facingMode);
    } else {
      // On desktop, wait a bit for camera list to load, then start camera
      if (availableCameras.length > 0) {
        startCamera(
          facingMode,
          selectedCameraId || availableCameras[0]?.deviceId
        );
      } else {
        // Fallback: start with default constraints if no cameras detected yet
        startCamera(facingMode);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, selectedCameraId, isMobile, availableCameras.length]);

  // Apply effects to preview
  useEffect(() => {
    if (!videoRef.current || !previewCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");

    let animationFrameId;

    const drawFrame = () => {
      if (!video) {
        animationFrameId = requestAnimationFrame(drawFrame);
        return;
      }

      // Check if video is ready
      if (video.readyState < video.HAVE_METADATA) {
        animationFrameId = requestAnimationFrame(drawFrame);
        return;
      }

      // Wait for video dimensions to be available
      if (
        !video.videoWidth ||
        !video.videoHeight ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        animationFrameId = requestAnimationFrame(drawFrame);
        return;
      }

      // Set canvas size to match video display size (not video dimensions)
      const videoWrapper = canvas.parentElement;
      if (videoWrapper) {
        const rect = videoWrapper.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        } else {
          // If wrapper has no size yet, use video dimensions
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
      } else {
        // Fallback to video dimensions if no parent
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.save();

      // Apply transform (zoom and flip)
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (zoomLevel > 1) {
        ctx.scale(zoomLevel, zoomLevel);
      }
      if (isFlipped) {
        ctx.scale(-1, 1);
      }
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Calculate aspect ratio and draw video with correct proportions
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;

      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let drawX = 0;
      let drawY = 0;

      if (videoAspect > canvasAspect) {
        // Video is wider - fit to width
        drawHeight = canvas.width / videoAspect;
        drawY = (canvas.height - drawHeight) / 2;
      } else {
        // Video is taller - fit to height
        drawWidth = canvas.height * videoAspect;
        drawX = (canvas.width - drawWidth) / 2;
      }

      // Draw video with correct aspect ratio
      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Build filter string for CSS filters (more accurate)
      let filterString = "";

      // Black and White (grayscale)
      if (blackWhite > 0) {
        const grayscale = blackWhite / 100;
        filterString += `grayscale(${grayscale}) `;
      }

      // Brightness (50 = 100% normal, 0 = 0%, 100 = 200%)
      if (brightness !== 50) {
        const brightnessValue = (brightness / 50) * 100;
        filterString += `brightness(${brightnessValue}%) `;
      }

      // Classic/Vintage (sepia)
      if (classic > 0) {
        const sepia = classic / 100;
        filterString += `sepia(${sepia}) `;
      }

      // Blur
      if (blur > 0) {
        filterString += `blur(${blur / 10}px) `;
      }

      // Apply CSS filters using temp canvas (more accurate)
      if (filterString) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(canvas, 0, 0);

        // Clear main canvas and apply filters
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = filterString.trim();
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.filter = "none";
      }

      animationFrameId = requestAnimationFrame(drawFrame);
    };

    // Start drawing immediately
    drawFrame();

    // Also listen for video events to ensure we start drawing when video is ready
    const handleLoadedMetadata = () => {
      drawFrame();
    };

    const handleCanPlay = () => {
      drawFrame();
    };

    const handlePlaying = () => {
      drawFrame();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
    };
  }, [blackWhite, brightness, classic, blur, isFlipped, zoomLevel, stream]);

  const startCamera = async (mode = "user", deviceId = null) => {
    try {
      // Stop current stream if exists
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      // On mobile, use facingMode; on desktop, use deviceId if available
      if (isMobile) {
        constraints.video.facingMode = mode;
      } else if (deviceId) {
        constraints.video.deviceId = { exact: deviceId };
      } else if (selectedCameraId) {
        constraints.video.deviceId = { exact: selectedCameraId };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi Camera",
        text:
          translations?.shoot?.cameraError ||
          "Không thể truy cập camera. Vui lòng cho phép quyền truy cập camera.",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
    }
  };

  const handleSwitchCamera = () => {
    // Switch between front and back camera (mobile only)
    if (isMobile) {
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      setFacingMode(newFacingMode);
    }
  };

  const handleCameraChange = (event) => {
    const deviceId = event.target.value;
    setSelectedCameraId(deviceId);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleZoom = (level) => {
    setZoomLevel(level);
  };

  const capturePhoto = useCallback(
    (slotIndex = null) => {
      if (isCapturing) return;

      // Check if there are any empty slots first
      let targetSlot = slotIndex;

      // Use a synchronous check to find target slot
      setPhotos((prev) => {
        if (targetSlot === null) {
          // Find first empty slot, starting from currentSlot
          targetSlot = findNextEmptySlot(prev, currentSlot);

          // If no empty slot found, don't capture
          if (targetSlot === -1) {
            return prev;
          }
        } else {
          // Check if specified slot is available
          if (!isSlotEmpty(prev[targetSlot])) {
            // Slot is not empty, find alternative
            targetSlot = findEmptySlot(prev);
            if (targetSlot === -1) {
              return prev;
            }
          }
        }

        // Reserve slot immediately to prevent race condition
        const newPhotos = [...prev];
        newPhotos[targetSlot] = { id: "reserved", src: "" };
        reservedSlotRef.current = targetSlot;

        return newPhotos;
      });

      // Only start capture process if we have a valid slot
      setTimeout(() => {
        if (reservedSlotRef.current !== null) {
          setIsCapturing(true);
          setCountdown(3);

          const countdownInterval = setInterval(() => {
            setCountdown((prevCountdown) => {
              if (prevCountdown <= 1) {
                clearInterval(countdownInterval);
                // Take photo
                setTimeout(() => {
                  if (!videoRef.current || !canvasRef.current) {
                    setIsCapturing(false);
                    if (reservedSlotRef.current !== null) {
                      setPhotos((prevPhotos) => {
                        const updatedPhotos = [...prevPhotos];
                        if (
                          updatedPhotos[reservedSlotRef.current]?.id ===
                          "reserved"
                        ) {
                          updatedPhotos[reservedSlotRef.current] = null;
                        }
                        return updatedPhotos;
                      });
                    }
                    reservedSlotRef.current = null;
                    return;
                  }

                  const video = videoRef.current;
                  const captureCanvas = canvasRef.current;
                  const ctx = captureCanvas.getContext("2d");

                  // Use full video dimensions for capture
                  captureCanvas.width = video.videoWidth;
                  captureCanvas.height = video.videoHeight;

                  // Draw video first with correct aspect ratio and zoom
                  ctx.save();

                  // Apply transform (zoom and flip)
                  ctx.translate(
                    captureCanvas.width / 2,
                    captureCanvas.height / 2
                  );
                  if (zoomLevel > 1) {
                    ctx.scale(zoomLevel, zoomLevel);
                  }
                  if (isFlipped) {
                    ctx.scale(-1, 1);
                  }
                  ctx.translate(
                    -captureCanvas.width / 2,
                    -captureCanvas.height / 2
                  );

                  // Draw video at full size
                  ctx.drawImage(
                    video,
                    0,
                    0,
                    captureCanvas.width,
                    captureCanvas.height
                  );
                  ctx.restore();

                  // Apply effects to captured image (same as preview)
                  let filterString = "";

                  // Black and White (grayscale)
                  if (blackWhite > 0) {
                    const grayscale = blackWhite / 100;
                    filterString += `grayscale(${grayscale}) `;
                  }

                  // Brightness (50 = 100% normal, 0 = 0%, 100 = 200%)
                  if (brightness !== 50) {
                    const brightnessValue = (brightness / 50) * 100;
                    filterString += `brightness(${brightnessValue}%) `;
                  }

                  // Classic/Vintage (sepia)
                  if (classic > 0) {
                    const sepia = classic / 100;
                    filterString += `sepia(${sepia}) `;
                  }

                  // Blur
                  if (blur > 0) {
                    filterString += `blur(${blur / 10}px) `;
                  }

                  // Apply CSS filters using temp canvas
                  if (filterString) {
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = captureCanvas.width;
                    tempCanvas.height = captureCanvas.height;
                    const tempCtx = tempCanvas.getContext("2d");
                    tempCtx.drawImage(captureCanvas, 0, 0);

                    // Clear main canvas and apply filters
                    ctx.clearRect(
                      0,
                      0,
                      captureCanvas.width,
                      captureCanvas.height
                    );
                    ctx.filter = filterString.trim();
                    ctx.drawImage(tempCanvas, 0, 0);
                    ctx.filter = "none";
                  }

                  // Apply lens flare and film grain overlays
                  const applyOverlays = () => {
                    const promises = [];

                    // Draw lens flare overlay if enabled
                    if (lensFlare > 0) {
                      promises.push(
                        new Promise((resolve) => {
                          const flareImg = new Image();
                          flareImg.crossOrigin = "anonymous";
                          flareImg.src = getAssetPath(
                            "/filter/lens-flare.webp"
                          );
                          flareImg.onload = () => {
                            ctx.globalAlpha = lensFlare / 100;
                            ctx.drawImage(
                              flareImg,
                              0,
                              0,
                              captureCanvas.width,
                              captureCanvas.height
                            );
                            ctx.globalAlpha = 1.0;
                            resolve();
                          };
                          flareImg.onerror = resolve;
                        })
                      );
                    }

                    // Draw film grain overlay if enabled
                    if (filmGrain > 0) {
                      promises.push(
                        new Promise((resolve) => {
                          const grainImg = new Image();
                          grainImg.crossOrigin = "anonymous";
                          grainImg.src = getAssetPath(
                            "/filter/film-grain.webp"
                          );
                          grainImg.onload = () => {
                            ctx.globalAlpha = filmGrain / 100;
                            ctx.drawImage(
                              grainImg,
                              0,
                              0,
                              captureCanvas.width,
                              captureCanvas.height
                            );
                            ctx.globalAlpha = 1.0;
                            resolve();
                          };
                          grainImg.onerror = resolve;
                        })
                      );
                    }

                    // Wait for all overlays to load, then save
                    Promise.all(promises).then(() => {
                      const photoData = captureCanvas.toDataURL("image/png");
                      const finalTargetSlot = reservedSlotRef.current;

                      setPhotos((prevPhotos) => {
                        const updatedPhotos = [...prevPhotos];

                        if (
                          finalTargetSlot !== null &&
                          finalTargetSlot >= 0 &&
                          finalTargetSlot < 4
                        ) {
                          updatedPhotos[finalTargetSlot] = {
                            id: Date.now() + Math.random(),
                            src: photoData,
                          };

                          // Update currentSlot to next empty slot after this one
                          if (slotIndex === null) {
                            const nextEmpty = findNextEmptySlot(
                              updatedPhotos,
                              finalTargetSlot + 1
                            );
                            setCurrentSlot(
                              nextEmpty !== -1 ? nextEmpty : finalTargetSlot
                            );
                          }
                        }
                        return updatedPhotos;
                      });

                      reservedSlotRef.current = null;
                      setIsCapturing(false);
                    });

                    // If no overlays, save immediately
                    if (promises.length === 0) {
                      const photoData = captureCanvas.toDataURL("image/png");
                      const finalTargetSlot = reservedSlotRef.current;

                      setPhotos((prevPhotos) => {
                        const updatedPhotos = [...prevPhotos];

                        if (
                          finalTargetSlot !== null &&
                          finalTargetSlot >= 0 &&
                          finalTargetSlot < 4
                        ) {
                          updatedPhotos[finalTargetSlot] = {
                            id: Date.now() + Math.random(),
                            src: photoData,
                          };

                          // Update currentSlot to next empty slot after this one
                          if (slotIndex === null) {
                            const nextEmpty = findNextEmptySlot(
                              updatedPhotos,
                              finalTargetSlot + 1
                            );
                            setCurrentSlot(
                              nextEmpty !== -1 ? nextEmpty : finalTargetSlot
                            );
                          }
                        }
                        return updatedPhotos;
                      });

                      reservedSlotRef.current = null;
                      setIsCapturing(false);
                    }
                  };

                  applyOverlays();
                }, 100);
                return 0;
              }
              return prevCountdown - 1;
            });
          }, 1000);
        }
      }, 0);
    },
    [
      isCapturing,
      currentSlot,
      zoomLevel,
      isFlipped,
      blackWhite,
      brightness,
      classic,
      blur,
      lensFlare,
      filmGrain,
      findNextEmptySlot,
      findEmptySlot,
      isSlotEmpty,
      navigate,
    ]
  );

  // Continuous capture - strictly sequential, filling lowest empty slots first
  const continuousCapture = useCallback(() => {
    const step = () => {
      // If currently capturing, wait and retry
      if (capturingRef.current) {
        setTimeout(step, 150);
        return;
      }
      // Find next empty slot using the latest photos ref
      const photosNow = latestPhotosRef.current || [];
      const nextEmpty = findEmptySlot(photosNow);
      if (nextEmpty === -1) {
        // No empty slots -> stop
        return;
      }
      // Capture into this slot then loop
      capturePhoto(nextEmpty);
      setTimeout(step, 150);
    };
    step();
  }, [capturePhoto, findEmptySlot]);

  const startCountdown = (isContinuous = false) => {
    const emptySlots = findAllEmptySlots(photos);
    if (emptySlots.length === 0) return;

    if (isContinuous) {
      continuousCapture();
    } else {
      capturePhoto(null);
    }
  };

  // Upload photo from file to slot
  const handleFileUpload = useCallback(
    (file, slotIndex = null) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas to process image
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Apply effects to uploaded image (same as capture)
          let filterString = "";

          // Black and White (grayscale)
          if (blackWhite > 0) {
            const grayscale = blackWhite / 100;
            filterString += `grayscale(${grayscale}) `;
          }

          // Brightness (50 = 100% normal, 0 = 0%, 100 = 200%)
          if (brightness !== 50) {
            const brightnessValue = (brightness / 50) * 100;
            filterString += `brightness(${brightnessValue}%) `;
          }

          // Classic/Vintage (sepia)
          if (classic > 0) {
            const sepia = classic / 100;
            filterString += `sepia(${sepia}) `;
          }

          // Blur
          if (blur > 0) {
            filterString += `blur(${blur / 10}px) `;
          }

          // Apply CSS filters using temp canvas
          if (filterString) {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(canvas, 0, 0);

            // Clear main canvas and apply filters
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = filterString.trim();
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.filter = "none";
          }

          // Apply lens flare and film grain overlays
          const applyOverlays = () => {
            const promises = [];

            if (lensFlare > 0) {
              promises.push(
                new Promise((resolve) => {
                  const flareImg = new Image();
                  flareImg.crossOrigin = "anonymous";
                  flareImg.src = "/filter/lens-flare.webp";
                  flareImg.onload = () => {
                    ctx.globalAlpha = lensFlare / 100;
                    ctx.drawImage(flareImg, 0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;
                    resolve();
                  };
                  flareImg.onerror = resolve;
                })
              );
            }

            if (filmGrain > 0) {
              promises.push(
                new Promise((resolve) => {
                  const grainImg = new Image();
                  grainImg.crossOrigin = "anonymous";
                  grainImg.src = "/filter/film-grain.webp";
                  grainImg.onload = () => {
                    ctx.globalAlpha = filmGrain / 100;
                    ctx.drawImage(grainImg, 0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;
                    resolve();
                  };
                  grainImg.onerror = resolve;
                })
              );
            }

            Promise.all(promises).then(() => {
              const photoData = canvas.toDataURL("image/png");
              setPhotos((prev) => {
                const newPhotos = [...prev];
                if (slotIndex !== null) {
                  // Use specified slot
                  newPhotos[slotIndex] = {
                    id: Date.now() + Math.random(),
                    src: photoData,
                  };
                } else {
                  // Find first empty slot
                  const emptyIndex = findEmptySlot(newPhotos);
                  if (emptyIndex !== -1) {
                    newPhotos[emptyIndex] = {
                      id: Date.now() + Math.random(),
                      src: photoData,
                    };
                    // Update currentSlot to next empty slot
                    const nextEmpty = findNextEmptySlot(
                      newPhotos,
                      emptyIndex + 1
                    );
                    setCurrentSlot(nextEmpty !== -1 ? nextEmpty : emptyIndex);
                  }
                }

                return newPhotos;
              });
            });

            if (promises.length === 0) {
              const photoData = canvas.toDataURL("image/png");
              setPhotos((prev) => {
                const newPhotos = [...prev];
                if (slotIndex !== null) {
                  newPhotos[slotIndex] = {
                    id: Date.now() + Math.random(),
                    src: photoData,
                  };
                } else {
                  const emptyIndex = findEmptySlot(newPhotos);
                  if (emptyIndex !== -1) {
                    newPhotos[emptyIndex] = {
                      id: Date.now() + Math.random(),
                      src: photoData,
                    };
                    const nextEmpty = findNextEmptySlot(
                      newPhotos,
                      emptyIndex + 1
                    );
                    setCurrentSlot(nextEmpty !== -1 ? nextEmpty : emptyIndex);
                  }
                }
                return newPhotos;
              });
            }
          };

          applyOverlays();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    [
      blackWhite,
      brightness,
      classic,
      blur,
      lensFlare,
      filmGrain,
      findEmptySlot,
      findNextEmptySlot,
      navigate,
    ]
  );

  // Open file picker for slot
  const openFilePicker = useCallback((slotIndex) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("data-slot-index", slotIndex);
      fileInputRef.current.click();
    }
  }, []);

  // Delete photo from slot
  const deletePhoto = useCallback((index) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      // Revoke Blob URL if it's a blob URL (starts with blob:)
      if (
        newPhotos[index] &&
        newPhotos[index].src &&
        newPhotos[index].src.startsWith("blob:")
      ) {
        URL.revokeObjectURL(newPhotos[index].src);
      }
      newPhotos[index] = null;
      return newPhotos;
    });
  }, []);

  if (!translations) {
    return (
      <div className="shoot-container">
        <div className="shoot-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="shoot-container">
      {/* Header */}
      <header className="shoot-header">
        <div className="header-left">
          <div className="header-logo-icon">
            <img src={getAssetPath("/logo.png")} alt="Logo" />
          </div>
          <span
            className="header-brand"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            {translations.title || "SFotor"}
          </span>
        </div>
        <div className="header-right">
          {/* Camera selector for desktop */}
          {!isMobile && availableCameras.length > 1 && (
            <select
              className="header-camera-select"
              value={selectedCameraId}
              onChange={handleCameraChange}
              title="Chọn camera"
            >
              {availableCameras.map((camera) => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label ||
                    `Camera ${availableCameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          )}
          <div className="header-languages">
            {availableLanguages.map((lang) => (
              <button
                key={lang}
                className={`header-lang-button ${
                  currentLang === lang ? "active" : ""
                }`}
                onClick={() => handleLanguageChange(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="shoot-main">
        {/* Mobile Effects Panel - Top Overlay */}
        {isMobile && (
          <div className="shoot-effects-panel mobile-overlay">
            <h3 className="panel-title">
              {translations.shoot?.effectsTitle || "Hiệu Ứng Ảnh"}
            </h3>
            <div className="effects-list">
              <div className="effect-buttons-grid">
                <button
                  className={`effect-button ${blackWhite > 0 ? "active" : ""}`}
                  onClick={() => handleBlackWhiteToggle(!(blackWhite > 0))}
                >
                  {translations.shoot?.blackWhite || "Đen Trắng"}
                </button>
                <button
                  className={`effect-button ${brightness > 50 ? "active" : ""}`}
                  onClick={() => handleBrightnessToggle(!(brightness > 50))}
                >
                  {translations.shoot?.brightness || "Độ Sáng"}
                </button>
                <button
                  className={`effect-button ${classic > 0 ? "active" : ""}`}
                  onClick={() => handleClassicToggle(!(classic > 0))}
                >
                  {translations.shoot?.classic || "Cổ Điển"}
                </button>
                <button
                  className={`effect-button ${blur > 0 ? "active" : ""}`}
                  onClick={() => handleBlurToggle(!(blur > 0))}
                >
                  {translations.shoot?.blur || "Mờ"}
                </button>
                <button
                  className={`effect-button ${lensFlare > 0 ? "active" : ""}`}
                  onClick={() => handleLensFlareToggle(!(lensFlare > 0))}
                >
                  {translations.shoot?.lensFlare || "Thêm vệt nắng"}
                </button>
                <button
                  className={`effect-button ${filmGrain > 0 ? "active" : ""}`}
                  onClick={() => handleFilmGrainToggle(!(filmGrain > 0))}
                >
                  {translations.shoot?.filmGrain || "Thêm nhiễu hạt"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Left Panel - Effects (Desktop) */}
        {!isMobile && (
          <div className="shoot-effects-panel">
            <h3 className="panel-title">
              {translations.shoot?.effectsTitle || "Hiệu Ứng Ảnh"}
            </h3>
            <div className="effects-list">
              {/* Desktop: Sliders */}
              <div className="effect-item">
                <label>{translations.shoot?.blackWhite || "Đen Trắng"}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={blackWhite}
                  onChange={(e) => setBlackWhite(Number(e.target.value))}
                  className="effect-slider"
                />
                <span className="effect-value">{blackWhite}%</span>
              </div>

              <div className="effect-item">
                <label>{translations.shoot?.brightness || "Độ Sáng"}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="effect-slider"
                />
                <span className="effect-value">
                  {brightness === 50
                    ? "0%"
                    : brightness < 50
                    ? `${brightness - 50}%`
                    : `+${brightness - 50}%`}
                </span>
              </div>

              <div className="effect-item">
                <label>{translations.shoot?.classic || "Cổ Điển"}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={classic}
                  onChange={(e) => setClassic(Number(e.target.value))}
                  className="effect-slider"
                />
                <span className="effect-value">{classic}%</span>
              </div>

              <div className="effect-item">
                <label>{translations.shoot?.blur || "Mờ"}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="effect-slider"
                />
                <span className="effect-value">{blur}%</span>
              </div>

              <div className="effect-item">
                <label>
                  {translations.shoot?.lensFlare || "Thêm vệt nắng"}
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={lensFlare}
                  onChange={(e) => setLensFlare(Number(e.target.value))}
                  className="effect-slider"
                />
                <span className="effect-value">{lensFlare}%</span>
              </div>

              <div className="effect-item">
                <label>
                  {translations.shoot?.filmGrain || "Thêm nhiễu hạt"}
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filmGrain}
                  onChange={(e) => setFilmGrain(Number(e.target.value))}
                  className="effect-slider"
                />
                <span className="effect-value">{filmGrain}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Center Panel - Camera */}
        <div className="shoot-camera-panel">
          <div className="camera-preview-wrapper">
            {countdown > 0 && (
              <div className="countdown-overlay">
                <div className="countdown-number">{countdown}</div>
              </div>
            )}
            <div className="camera-preview">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
                style={{
                  position: "absolute",
                  opacity: 0,
                  pointerEvents: "none",
                  width: "1px",
                  height: "1px",
                }}
              />
              <canvas ref={previewCanvasRef} className="preview-canvas" />
              {/* Lens Flare Overlay */}
              {lensFlare > 0 && (
                <div
                  className="overlay-effect lens-flare-overlay"
                  style={{ opacity: lensFlare / 100 }}
                >
                  <img
                    src={getAssetPath("/filter/lens-flare.webp")}
                    alt="Lens Flare"
                  />
                </div>
              )}
              {/* Film Grain Overlay */}
              {filmGrain > 0 && (
                <div
                  className="overlay-effect film-grain-overlay"
                  style={{ opacity: filmGrain / 100 }}
                >
                  <img
                    src={getAssetPath("/filter/film-grain.webp")}
                    alt="Film Grain"
                  />
                </div>
              )}
            </div>
            {/* Camera Controls inside camera wrapper */}
            <div className="camera-controls">
              <button
                className="control-button"
                onClick={handleSwitchCamera}
                title={
                  facingMode === "user"
                    ? "Chuyển camera sau"
                    : "Chuyển camera trước"
                }
                style={{ display: isMobile ? "block" : "none" }}
              >
                <span>🔄</span>
              </button>
              <button
                className="control-button"
                onClick={handleFlip}
                title="Flip"
              >
                <span>⇄</span>
              </button>
              <div className="zoom-controls">
                {[1, 2, 5].map((level) => (
                  <button
                    key={level}
                    className={`zoom-button ${
                      zoomLevel === level ? "active" : ""
                    }`}
                    onClick={() => handleZoom(level)}
                  >
                    {level}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Capture Buttons */}
          <div className="capture-buttons-wrapper">
            <div className="capture-buttons">
              <button
                className="capture-button primary"
                onClick={() => startCountdown(false)}
                disabled={isCapturing || findAllEmptySlots(photos).length === 0}
              >
                {isCapturing
                  ? `Chụp... ${countdown > 0 ? countdown : ""}`
                  : `${translations.shoot?.captureSingle || "Chụp từng kiểu"} `}
              </button>
              <button
                className="capture-button primary"
                onClick={() => startCountdown(true)}
                disabled={isCapturing || findAllEmptySlots(photos).length === 0}
              >
                {translations.shoot?.captureContinuous || "Chụp liên tiếp"}
              </button>
            </div>
            <button
              className="capture-button heart"
              onClick={() => setShowDonateModal(true)}
              title="Donate"
            >
              <span>❤️</span>
            </button>
          </div>
        </div>

        {/* Right Panel - Captured Photos */}
        <div className="shoot-photos-panel">
          <div className="panel-title-wrapper">
            <h3 className="panel-title">
              {translations.shoot?.capturedPhotos || "Ảnh Đã Chụp"}
            </h3>
            <button
              className="next-button"
              onClick={() => {
                const photosForNextStep = photos.filter(
                  (photo) => photo && photo.src
                );
                if (photosForNextStep.length === 4) {
                  navigate("/frames", {
                    state: { photos: photosForNextStep.map((p) => p.src) },
                  });
                }
              }}
              disabled={
                !photos.every(
                  (photo) =>
                    photo !== null && photo.src && photo.id !== "reserved"
                )
              }
            >
              {translations.shoot?.nextButton || "Tiếp theo"}
            </button>
          </div>
          <div className="photos-list">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className={`photo-item ${
                  photos[index] && photos[index].src ? "has-photo" : ""
                }`}
              >
                <div className="photo-label">
                  {translations.shoot?.photoLabel || "Ảnh"} {index + 1}
                </div>
                <div className="photo-preview">
                  {photos[index] && photos[index].src ? (
                    <>
                      <img src={photos[index].src} alt={`Photo ${index + 1}`} />
                      <button
                        className="photo-delete"
                        onClick={() => deletePhoto(index)}
                        title="Xóa ảnh"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <div className="photo-placeholder">-</div>
                  )}
                </div>
                <button
                  className="photo-download"
                  onClick={() => openFilePicker(index)}
                  title="Tải ảnh lên"
                >
                  ↑
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gradient background */}
      <div className="shoot-gradient"></div>

      {/* Footer */}
      <div className="shoot-footer">
        <span className="footer-credit">
          {translations.footer?.credit || "made by Sơn Đình Sơn"}
        </span>
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            const slotIndex = e.target.getAttribute("data-slot-index");
            const slotIndexNum =
              slotIndex !== null ? parseInt(slotIndex) : null;
            handleFileUpload(e.target.files[0], slotIndexNum);
            // Reset input
            e.target.value = "";
            e.target.removeAttribute("data-slot-index");
          }
        }}
      />

      {/* Donate Modal */}
      {showDonateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDonateModal(false)}
        >
          <div className="donate-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="donate-title">
              {translations.donateModal?.title || "Cảm ơn bạn đã ủng hộ!"}
            </h2>
            <div className="donate-content">
              <p>
                {translations.donateModal?.text1 ||
                  'Chiếc Photo-Booth ảo này được tạo ra với niềm đam mê chụp ảnh, với "sứ mệnh" phấn đấu đến năm 2025 mỗi nhà sẽ có một chiếc phô tô bút tại gia.'}
              </p>
              <p>
                {translations.donateModal?.text2 ||
                  "Nếu bạn enjoy trải nghiệm này, đừng quên chia sẻ video hậu trường với mọi người và hashtag #sfotor nhé!"}
              </p>
            </div>

            {/* Social Media Buttons */}
            <div className="social-buttons">
              <button className="social-button">Follow me</button>
              <button className="social-button">Tiktok</button>
              <button className="social-button">Instagram</button>
            </div>

            {/* Donation Section */}
            <div className="donation-section">
              <h3 className="donation-title">
                {translations.donateModal?.donationTitle ||
                  "Khao tui một ly trà sữa 💛🧡"}
              </h3>
              <div className="qr-code-placeholder">
                <img
                  src={getAssetPath("/qr.jpg")}
                  alt="QR code"
                  className="qr-image"
                />
              </div>
              <a
                href="https://paypal.me/sondinhson12"
                target="_blank"
                rel="noopener noreferrer"
                className="paypal-link"
              >
                Paypal.me/sondinhson12
              </a>
            </div>

            <button
              className="modal-close-button"
              onClick={() => setShowDonateModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shoot;
