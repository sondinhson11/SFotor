import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  isAuthenticated,
  logout,
  getAdminUsername,
  getAdminPassword,
} from "../utils/auth";
import {
  loadConfig,
  clearConfigCache,
  markConfigUpdated,
} from "../utils/configLoader";
import Swal from "sweetalert2";
import JSZip from "jszip";
import "./Admin.css";

// Default categories và types (fallback nếu config chưa có)
const DEFAULT_CATEGORIES = [
  "Basic",
  "Birthday",
  "Countries",
  "Cute",
  "Idol",
  "School",
  "Vietnam",
  "Other",
];

const DEFAULT_TYPES = ["banv1", "banv2"];

function Admin() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingFrame, setEditingFrame] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [frameImages, setFrameImages] = useState(new Map()); // Lưu các file ảnh đã upload
  const [activeTab, setActiveTab] = useState("frames"); // "frames", "metadata", hoặc "categories"
  const [editingMetadata, setEditingMetadata] = useState(null); // Đang chỉnh sửa metadata nào
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // Đang chỉnh sửa category nào
  const [editingType, setEditingType] = useState(null); // Đang chỉnh sửa type nào
  const [newCategoryName, setNewCategoryName] = useState(""); // Tên category mới
  const [newTypeName, setNewTypeName] = useState(""); // Tên type mới
  const navigate = useNavigate();

  // Lấy categories từ config hoặc dùng default
  const getCategories = () => {
    if (
      config?.categories &&
      Array.isArray(config.categories) &&
      config.categories.length > 0
    ) {
      return config.categories;
    }
    return DEFAULT_CATEGORIES;
  };

  // Lấy types từ config hoặc dùng default
  const getTypes = () => {
    if (
      config?.types &&
      Array.isArray(config.types) &&
      config.types.length > 0
    ) {
      return config.types;
    }
    return DEFAULT_TYPES;
  };

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadConfigData();
  }, [navigate]);

  const loadConfigData = async () => {
    try {
      clearConfigCache(); // Force reload
      const data = await loadConfig(true); // Force reload từ server
      setConfig(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi tải config",
        text: "Không thể tải cấu hình. Vui lòng thử lại.",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Đăng xuất?",
      text: "Bạn có chắc chắn muốn đăng xuất?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đăng xuất",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#E85A8D",
      cancelButtonColor: "#999",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate("/admin/login", { replace: true });
      }
    });
  };

  const handleAddFrame = () => {
    const newId =
      config.frames.length > 0
        ? Math.max(...config.frames.map((f) => f.id)) + 1
        : 1;

    // Load categories và types từ config
    const categories = getCategories();
    const types = getTypes();

    const newFrame = {
      id: newId,
      name: "",
      category: categories[0] || "Basic",
      type: types[0] || "banv1",
      path: "",
    };

    setEditingFrame(newFrame);
    setShowAddForm(true);
  };

  const handleEditFrame = (frame) => {
    setEditingFrame({ ...frame });
    setShowAddForm(true);
  };

  const handleDeleteFrame = (frameId) => {
    Swal.fire({
      title: "Xóa frame?",
      text: "Bạn có chắc chắn muốn xóa frame này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#E85A8D",
      cancelButtonColor: "#999",
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedFrames = config.frames.filter((f) => f.id !== frameId);
        setConfig({ ...config, frames: updatedFrames });
        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          text: "Frame đã được xóa khỏi danh sách",
          confirmButtonText: "OK",
          confirmButtonColor: "#E85A8D",
        });
      }
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng file
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "File không hợp lệ",
        text: "Vui lòng chọn file ảnh (PNG, JPG, etc.)",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    // Tạo tên file từ tên frame hoặc dùng tên file gốc
    const fileName = editingFrame.name
      ? `${editingFrame.name.toLowerCase().replace(/\s+/g, "-")}.png`
      : file.name;
    const framePath = `/frame/${fileName}`;

    // Dùng frame path làm key (vì path là unique và không đổi)
    const frameKey = framePath;

    // Lưu file vào Map với path làm key
    const newFrameImages = new Map(frameImages);
    newFrameImages.set(frameKey, {
      file: file,
      path: framePath,
      preview: URL.createObjectURL(file),
    });
    setFrameImages(newFrameImages);

    // Tự động cập nhật path trong editingFrame
    setEditingFrame({
      ...editingFrame,
      path: framePath,
    });
  };

  const handleSaveFrame = () => {
    if (!editingFrame.name || !editingFrame.path) {
      Swal.fire({
        icon: "error",
        title: "Thiếu thông tin",
        text: "Vui lòng điền đầy đủ tên và đường dẫn frame (hoặc upload ảnh)",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    // Đảm bảo ảnh được giữ lại trong Map (đã lưu với path key)
    const framePath = editingFrame.path;
    const newFrameImages = new Map(frameImages);

    const updatedFrames = [...config.frames];
    const existingIndex = updatedFrames.findIndex(
      (f) => f.id === editingFrame.id
    );

    // Kiểm tra duplicate ID (nếu là frame mới)
    if (existingIndex < 0) {
      const duplicateId = updatedFrames.find((f) => f.id === editingFrame.id);
      if (duplicateId) {
        Swal.fire({
          icon: "error",
          title: "ID bị trùng",
          text: `Frame ID ${editingFrame.id} đã tồn tại. Vui lòng chọn ID khác.`,
          confirmButtonText: "Đã hiểu",
          confirmButtonColor: "#E85A8D",
        });
        return;
      }
    }

    if (existingIndex >= 0) {
      // Update existing - xóa ảnh cũ nếu path thay đổi
      const oldFrame = updatedFrames[existingIndex];
      if (
        oldFrame.path !== editingFrame.path &&
        newFrameImages.has(oldFrame.path)
      ) {
        const oldImageData = newFrameImages.get(oldFrame.path);
        if (oldImageData?.preview) {
          URL.revokeObjectURL(oldImageData.preview);
        }
        newFrameImages.delete(oldFrame.path);
      }
      updatedFrames[existingIndex] = editingFrame;
    } else {
      // Add new
      updatedFrames.push(editingFrame);
    }

    // Validate JSON trước khi lưu
    try {
      const testConfig = { ...config, frames: updatedFrames };
      JSON.stringify(testConfig); // Test JSON validity
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Lỗi dữ liệu",
        text: "Cấu hình không hợp lệ. Vui lòng kiểm tra lại.",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    setConfig({ ...config, frames: updatedFrames });
    setFrameImages(newFrameImages);
    setShowAddForm(false);
    setEditingFrame(null);

    Swal.fire({
      icon: "success",
      title: "Đã lưu!",
      text: `Frame đã được cập nhật. Tổng: ${updatedFrames.length} frames. Nhớ click 'Upload Lên Server' để cập nhật!`,
      confirmButtonText: "OK",
      confirmButtonColor: "#E85A8D",
    });
  };

  const handleExportConfig = async (autoUpload = false) => {
    try {
      // Clean và validate frames trước khi export
      const cleanedFrames = config.frames
        .filter((frame) => {
          // Loại bỏ frame không có ID hoặc name
          if (!frame.id || !frame.name) {
            console.warn("Frame bị loại bỏ (thiếu ID hoặc name):", frame);
            return false;
          }
          // Kiểm tra ID hợp lệ (phải là số)
          if (typeof frame.id !== "number" || isNaN(frame.id)) {
            console.warn("Frame bị loại bỏ (ID không hợp lệ):", frame);
            return false;
          }
          return true;
        })
        .sort((a, b) => a.id - b.id) // Sort theo ID
        .reduce((acc, frame) => {
          // Loại bỏ duplicate ID (giữ frame đầu tiên)
          const existingFrame = acc.find((f) => f.id === frame.id);
          if (!existingFrame) {
            acc.push(frame);
          } else {
            console.warn(`Frame bị loại bỏ (duplicate ID ${frame.id}):`, {
              existing: existingFrame,
              duplicate: frame,
            });
          }
          return acc;
        }, []);

      // Debug frame ID 153 - kiểm tra tất cả frame có ID 153
      const allFrame153 = config.frames.filter((f) => f.id === 153);
      const cleanedFrame153 = cleanedFrames.find((f) => f.id === 153);

      if (allFrame153.length > 0) {
        console.log(
          `🔍 Tìm thấy ${allFrame153.length} frame(s) có ID 153:`,
          allFrame153
        );

        if (allFrame153.length > 1) {
          console.warn(
            `⚠️ CÓ ${allFrame153.length} FRAME CÙNG ID 153! Chỉ giữ frame đầu tiên.`
          );
          allFrame153.forEach((frame, idx) => {
            console.log(`  Frame ${idx + 1}:`, frame);
          });
        }

        if (!cleanedFrame153) {
          console.error("⚠️ Frame ID 153 bị loại bỏ!", {
            allInstances: allFrame153,
            reason: !allFrame153[0].id
              ? "Thiếu ID"
              : !allFrame153[0].name
              ? "Thiếu name"
              : typeof allFrame153[0].id !== "number"
              ? "ID không phải số"
              : allFrame153.length > 1
              ? `Duplicate ID (có ${allFrame153.length} frame cùng ID 153)`
              : "Unknown",
          });
        } else {
          console.log("✅ Frame ID 153 đã được giữ lại:", cleanedFrame153);
        }
      }

      // Tạo config đã clean
      const cleanedConfig = {
        ...config,
        frames: cleanedFrames,
        // Thêm version/timestamp để cache busting
        _version: Date.now(),
        _updatedAt: new Date().toISOString(),
      };

      const configStr = JSON.stringify(cleanedConfig, null, 2);
      const imageCount = frameImages.size;

      // Log để debug
      console.log("Frames trước khi clean:", config.frames.length);
      console.log("Frames sau khi clean:", cleanedFrames.length);

      // Kiểm tra duplicate IDs
      const idCounts = {};
      config.frames.forEach((f) => {
        if (f.id) {
          idCounts[f.id] = (idCounts[f.id] || 0) + 1;
        }
      });
      const duplicateIds = Object.entries(idCounts).filter(
        ([id, count]) => count > 1
      );
      if (duplicateIds.length > 0) {
        console.warn(
          "⚠️ Có duplicate IDs:",
          duplicateIds.map(([id, count]) => `ID ${id}: ${count} lần`)
        );
      }

      if (config.frames.length !== cleanedFrames.length) {
        console.warn(
          `Đã loại bỏ ${
            config.frames.length - cleanedFrames.length
          } frame không hợp lệ hoặc duplicate`
        );
      }

      // Nếu có API và chọn auto upload
      if (autoUpload) {
        // Kiểm tra nếu đang ở localhost/dev server
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.includes("localhost") ||
          window.location.port === "5173" ||
          window.location.port === "3000";

        if (isLocalhost) {
          Swal.fire({
            icon: "warning",
            title: "Không thể upload trên localhost",
            html: `
              <p>Bạn đang ở <strong>localhost</strong> (dev server).</p>
              <p>Chức năng upload chỉ hoạt động trên <strong>production server</strong> (sfotor.site).</p>
              <p style="margin-top: 1rem;"><strong>Giải pháp:</strong></p>
              <ol style="text-align: left; margin: 1rem 0;">
                <li>Deploy website lên server (build và upload lên cPanel)</li>
                <li>Truy cập <code>https://sfotor.site/admin</code></li>
                <li>Sử dụng chức năng upload từ đó</li>
                <li>Hoặc dùng "📥 Tải ZIP" để upload thủ công</li>
              </ol>
            `,
            confirmButtonText: "Đã hiểu",
            confirmButtonColor: "#E85A8D",
            width: "600px",
          });
          return;
        }

        Swal.fire({
          title: "Đang upload...",
          text: "Vui lòng đợi trong giây lát",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        try {
          // Tạo FormData để gửi lên server
          const formData = new FormData();
          formData.append("username", getAdminUsername());
          formData.append("password", getAdminPassword());
          formData.append("config", configStr);

          // Thêm các ảnh frame
          if (frameImages.size > 0) {
            for (const [path, imageData] of frameImages.entries()) {
              const fileName = path.replace("/frame/", "");
              formData.append("frames[]", imageData.file, fileName);
            }
          }

          // Gửi request lên API
          const baseUrl = window.location.origin;
          const apiUrl = `${baseUrl}/api/upload-config.php`;

          console.log("Uploading to:", apiUrl);

          const response = await fetch(apiUrl, {
            method: "POST",
            body: formData,
          });

          console.log("Response status:", response.status);
          console.log("Response headers:", response.headers);

          // Kiểm tra response trước khi parse JSON
          const contentType = response.headers.get("content-type");
          let result;

          if (contentType && contentType.includes("application/json")) {
            result = await response.json();
          } else {
            // Nếu không phải JSON, đọc text để xem lỗi gì
            const text = await response.text();
            console.error("Server response (not JSON):", text);

            // Kiểm tra xem có phải là PHP error không
            if (
              text.includes("<?php") ||
              text.includes("<!DOCTYPE") ||
              text.includes("<html")
            ) {
              throw new Error(
                "File PHP không được xử lý đúng. Vui lòng kiểm tra:\n" +
                  "1. File api/upload-config.php đã được upload lên server chưa?\n" +
                  "2. Server có hỗ trợ PHP không?\n" +
                  "3. Đường dẫn API có đúng không?"
              );
            } else {
              throw new Error(`Server trả về lỗi: ${text.substring(0, 200)}`);
            }
          }

          if (result.success) {
            // Đánh dấu config đã được update để các tab khác reload
            markConfigUpdated();

            // Lưu cleanedFrames để dùng trong callback
            const finalCleanedFrames = cleanedFrames;

            // Reload config để verify
            setTimeout(async () => {
              try {
                clearConfigCache();
                const verifiedConfig = await loadConfig(true); // Force reload từ server
                const verifiedCount = verifiedConfig.frames?.length || 0;
                const expectedCount = finalCleanedFrames.length;

                if (verifiedCount !== expectedCount) {
                  // Tìm frame nào bị mất
                  const sentIds = finalCleanedFrames
                    .map((f) => f.id)
                    .sort((a, b) => a - b);
                  const receivedIds = (verifiedConfig.frames || [])
                    .map((f) => f.id)
                    .filter((id) => id != null)
                    .sort((a, b) => a - b);
                  const missingIds = sentIds.filter(
                    (id) => !receivedIds.includes(id)
                  );

                  Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    html: `
                      <p>Upload thành công nhưng số lượng frame không khớp:</p>
                      <ul style="text-align: left; margin: 1rem 0;">
                        <li>Gửi lên: <strong>${expectedCount} frames</strong></li>
                        <li>Trên server: <strong>${verifiedCount} frames</strong></li>
                        ${
                          missingIds.length > 0
                            ? `<li>Frame bị mất (ID): <strong>${missingIds.join(
                                ", "
                              )}</strong></li>`
                            : ""
                        }
                      </ul>
                      <p style="margin-top: 1rem; color: #856404;">
                        Có thể do frame bị trùng ID hoặc JSON không hợp lệ. 
                        Vui lòng kiểm tra lại config.json trên server hoặc xem console để biết frame nào bị loại bỏ.
                      </p>
                      ${
                        result.details?.frame_153_missing_reason
                          ? `
                        <div style="background: #e7f3ff; padding: 0.8rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                          <p><strong>🔍 Lý do frame 153 bị mất:</strong></p>
                          <p style="margin: 0.5rem 0; font-weight: bold; color: #d32f2f;">${result.details.frame_153_missing_reason}</p>
                        </div>
                      `
                          : ""
                      }
                    `,
                    confirmButtonText: "Đã hiểu",
                    confirmButtonColor: "#E85A8D",
                    width: "700px",
                  });
                } else {
                  console.log("✅ Verify thành công:", verifiedCount, "frames");
                }
              } catch (error) {
                console.error("Error verifying config:", error);
              }
            }, 1000);

            Swal.fire({
              icon: "success",
              title: "Upload thành công!",
              html: `
                <p>Đã cập nhật lên server:</p>
                <ul style="text-align: left; margin: 1rem 0;">
                  <li>✅ <strong>config.json</strong> - ${
                    cleanedFrames.length
                  } frames</li>
                    ${
                      imageCount > 0
                        ? `<li>✅ <strong>${imageCount} ảnh frame</strong> đã được upload</li>`
                        : ""
                    }
                    ${
                      result.details?.warning
                        ? `<li>⚠️ ${result.details.warning}</li>`
                        : ""
                    }
                  ${
                    result.details?.frames_removed > 0
                      ? `<li>⚠️ Đã loại bỏ ${result.details.frames_removed} frame không hợp lệ</li>`
                      : ""
                  }
                </ul>
                ${
                  result.details?.duplicate_frames &&
                  result.details.duplicate_frames.length > 0
                    ? `
                  <div style="background: #fff3cd; padding: 0.8rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                    <p><strong>⚠️ Frame bị trùng ID:</strong></p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; font-size: 0.9rem;">
                      ${result.details.duplicate_frames
                        .map((f) => `<li>${f}</li>`)
                        .join("")}
                    </ul>
                  </div>
                `
                    : ""
                }
                ${
                  result.details?.invalid_frames &&
                  result.details.invalid_frames.length > 0
                    ? `
                  <div style="background: #f8d7da; padding: 0.8rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                    <p><strong>❌ Frame không hợp lệ:</strong></p>
                    <ul style="margin: 0.5rem 0; padding-left: 1.5rem; font-size: 0.9rem;">
                      ${result.details.invalid_frames
                        .map((f) => `<li>${f}</li>`)
                        .join("")}
                    </ul>
                  </div>
                `
                    : ""
                }
                ${
                  result.details?.frame_153_debug
                    ? `
                  <div style="background: #e7f3ff; padding: 0.8rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                    <p><strong>🔍 Debug Frame ID 153:</strong></p>
                    <pre style="font-size: 0.85rem; margin: 0.5rem 0; white-space: pre-wrap; background: white; padding: 0.5rem; border-radius: 4px;">${JSON.stringify(
                      result.details.frame_153_debug,
                      null,
                      2
                    )}</pre>
                  </div>
                `
                    : ""
                }
                <p style="margin-top: 1rem; color: #4CAF50;">
                  <strong>Website đã được cập nhật!</strong>
                </p>
                <div style="background: #e7f3ff; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                  <p style="margin: 0 0 0.5rem 0; font-weight: bold;">📱 Hướng dẫn để thấy update trên điện thoại:</p>
                  <ol style="margin: 0; padding-left: 1.5rem; font-size: 0.9rem;">
                    <li>Đóng và mở lại ứng dụng (swipe up để đóng app hoàn toàn)</li>
                    <li>Hoặc làm mới trang (pull down để refresh)</li>
                    <li>Nếu vẫn không thấy: Xóa cache trình duyệt (Settings → Clear browsing data)</li>
                  </ol>
                  <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #666;">
                    💡 Hệ thống đã thêm version vào config để bypass cache. Trên máy tính sẽ thấy ngay, trên điện thoại có thể cần refresh.
                  </p>
                </div>
                <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                  💡 Hệ thống sẽ tự động kiểm tra lại sau 1 giây để đảm bảo dữ liệu đúng.
                </p>
              `,
              confirmButtonText: "Tuyệt vời!",
              confirmButtonColor: "#E85A8D",
              width: "600px",
            });

            // Xóa các preview URL
            for (const imageData of frameImages.values()) {
              URL.revokeObjectURL(imageData.preview);
            }
            setFrameImages(new Map());
          } else {
            throw new Error(result.error || "Upload thất bại");
          }
        } catch (error) {
          console.error("Upload error:", error);

          // Kiểm tra xem có phải lỗi PHP không
          const isPhpError =
            error.message.includes("<?php") ||
            error.message.includes("File PHP không được xử lý");

          Swal.fire({
            icon: "error",
            title: "Upload thất bại",
            html: `
              <p>Không thể upload tự động lên server.</p>
              <p><strong>Lý do:</strong> ${error.message}</p>
              ${
                isPhpError
                  ? `
                <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin: 1rem 0; text-align: left;">
                  <p><strong>🔍 Cách kiểm tra:</strong></p>
                  <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>Mở trình duyệt và truy cập: <code>${
                      window.location.origin
                    }/api/test.php</code></li>
                    <li>Nếu thấy JSON → PHP hoạt động OK, vấn đề là ở file upload-config.php</li>
                    <li>Nếu thấy code PHP → Server không chạy PHP hoặc đường dẫn sai</li>
                    <li>Nếu thấy 404 → File chưa được upload lên server</li>
                  </ol>
                  ${
                    window.location.hostname === "localhost" ||
                    window.location.hostname === "127.0.0.1" ||
                    window.location.port === "5173"
                      ? `<p style="margin-top: 0.5rem; color: #856404; font-weight: bold;">
                          ⚠️ BẠN ĐANG Ở LOCALHOST! Chức năng upload chỉ hoạt động trên production server (sfotor.site).
                        </p>`
                      : ""
                  }
                </div>
              `
                  : ""
              }
              <p style="margin-top: 1rem;"><strong>Giải pháp:</strong></p>
              <ol style="text-align: left; margin: 1rem 0;">
                <li>Đảm bảo file <code>api/upload-config.php</code> đã được upload lên <code>public_html/api/</code></li>
                <li>Kiểm tra quyền file: File PHP = 644, Thư mục = 755</li>
                <li>Test PHP: Truy cập <code>${
                  window.location.origin
                }/api/test.php</code></li>
                <li>Hoặc sử dụng chức năng "📥 Tải ZIP" để upload thủ công</li>
              </ol>
            `,
            confirmButtonText: "Đã hiểu",
            confirmButtonColor: "#E85A8D",
            width: "700px",
          });
        }
        return;
      }

      // Nếu không auto upload, tạo ZIP như cũ
      const zip = new JSZip();
      zip.file("config.json", configStr);

      if (frameImages.size > 0) {
        const frameFolder = zip.folder("frame");
        let count = 0;
        for (const [path, imageData] of frameImages.entries()) {
          try {
            const arrayBuffer = await imageData.file.arrayBuffer();
            const fileName = path.replace("/frame/", "");
            frameFolder.file(fileName, arrayBuffer);
            count++;
          } catch (error) {
            console.error(`Error processing image ${path}:`, error);
          }
        }
        console.log(`Added ${count} images to ZIP`);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sfotor-update-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      link.click();
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        title: "Đã xuất file ZIP!",
        html: `
          <p>File ZIP đã được tải về chứa:</p>
          <ul style="text-align: left; margin: 1rem 0;">
            <li><strong>config.json</strong> - Cấu hình frames (${
              config.frames.length
            } frames)</li>
            ${
              imageCount > 0
                ? `<li><strong>frame/</strong> - Thư mục chứa ${imageCount} ảnh frame</li>`
                : "<li><em>Không có ảnh frame mới (chỉ cập nhật config.json)</em></li>"
            }
          </ul>
          <p style="margin-top: 1rem;"><strong>Hướng dẫn:</strong></p>
          <ol style="text-align: left; margin: 1rem 0;">
            <li>Giải nén file ZIP</li>
            <li>Upload <strong>config.json</strong> lên <code>public_html/config.json</code></li>
            ${
              imageCount > 0
                ? `<li>Upload các file trong thư mục <strong>frame/</strong> lên <code>public_html/frame/</code></li>`
                : ""
            }
          </ol>
        `,
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
        width: "600px",
      });

      // Xóa các preview URL
      for (const imageData of frameImages.values()) {
        URL.revokeObjectURL(imageData.preview);
      }
      setFrameImages(new Map());
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Đã xảy ra lỗi. Vui lòng thử lại.",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
    }
  };

  // Hàm xử lý categories
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập tên danh mục",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    const categories = getCategories();
    if (categories.includes(newCategoryName.trim())) {
      Swal.fire({
        icon: "error",
        title: "Danh mục đã tồn tại",
        text: `Danh mục "${newCategoryName.trim()}" đã có trong danh sách`,
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    const categoryName = newCategoryName.trim();
    const newConfig = { ...config };
    // Lấy danh sách categories hiện tại (từ config hoặc default)
    const currentCategories = getCategories();
    // Đảm bảo categories được lưu vào config
    if (!newConfig.categories) {
      newConfig.categories = [...currentCategories];
    }
    // Thêm category mới nếu chưa có
    if (!newConfig.categories.includes(categoryName)) {
      newConfig.categories = [...newConfig.categories, categoryName];
    }
    setConfig(newConfig);
    setNewCategoryName("");

    Swal.fire({
      icon: "success",
      title: "Đã thêm danh mục!",
      text: `Danh mục "${categoryName}" đã được thêm. Chuyển sang tab Frames...`,
      confirmButtonText: "OK",
      confirmButtonColor: "#E85A8D",
    }).then(() => {
      setActiveTab("frames");
    });
  };

  const handleEditCategory = (oldName) => {
    Swal.fire({
      title: "Sửa danh mục",
      input: "text",
      inputLabel: "Tên danh mục mới",
      inputValue: oldName,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#E85A8D",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Vui lòng nhập tên danh mục!";
        }
        const categories = getCategories();
        if (value.trim() !== oldName && categories.includes(value.trim())) {
          return "Danh mục này đã tồn tại!";
        }
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newName = result.value.trim();
        const newConfig = { ...config };
        if (!newConfig.categories) {
          newConfig.categories = [];
        }

        // Cập nhật tên category trong danh sách
        const categoryIndex = newConfig.categories.indexOf(oldName);
        if (categoryIndex >= 0) {
          newConfig.categories[categoryIndex] = newName;
        }

        // Cập nhật tất cả frames có category cũ
        if (newConfig.frames) {
          newConfig.frames = newConfig.frames.map((frame) => {
            if (frame.category === oldName) {
              return { ...frame, category: newName };
            }
            return frame;
          });
        }

        setConfig(newConfig);
        Swal.fire({
          icon: "success",
          title: "Đã cập nhật!",
          text: `Danh mục đã được đổi từ "${oldName}" sang "${newName}"`,
          confirmButtonText: "OK",
          confirmButtonColor: "#E85A8D",
        });
      }
    });
  };

  const handleDeleteCategory = (categoryName) => {
    // Kiểm tra xem có frame nào đang dùng category này không
    const framesUsingCategory =
      config?.frames?.filter((f) => f.category === categoryName) || [];

    if (framesUsingCategory.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Không thể xóa",
        html: `Danh mục "${categoryName}" đang được sử dụng bởi ${framesUsingCategory.length} frame(s).<br/>Vui lòng đổi category của các frame này trước khi xóa.`,
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    Swal.fire({
      title: "Xóa danh mục?",
      text: `Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#E85A8D",
      cancelButtonColor: "#999",
    }).then((result) => {
      if (result.isConfirmed) {
        const newConfig = { ...config };
        if (newConfig.categories) {
          newConfig.categories = newConfig.categories.filter(
            (cat) => cat !== categoryName
          );
        }
        setConfig(newConfig);
        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          text: `Danh mục "${categoryName}" đã được xóa`,
          confirmButtonText: "OK",
          confirmButtonColor: "#E85A8D",
        });
      }
    });
  };

  // Hàm xử lý types
  const handleAddType = () => {
    if (!newTypeName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Thiếu thông tin",
        text: "Vui lòng nhập tên loại",
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    const types = getTypes();
    const typeName = newTypeName.trim();
    if (types.includes(typeName)) {
      Swal.fire({
        icon: "error",
        title: "Loại đã tồn tại",
        text: `Loại "${typeName}" đã có trong danh sách`,
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    const newConfig = { ...config };
    // Lấy danh sách types hiện tại (từ config hoặc default)
    const currentTypes = getTypes();
    // Đảm bảo types được lưu vào config
    if (!newConfig.types) {
      newConfig.types = [...currentTypes];
    }
    // Thêm type mới nếu chưa có
    if (!newConfig.types.includes(typeName)) {
      newConfig.types = [...newConfig.types, typeName];
    }
    setConfig(newConfig);
    setNewTypeName("");

    Swal.fire({
      icon: "success",
      title: "Đã thêm loại!",
      text: `Loại "${typeName}" đã được thêm. Chuyển sang tab Frames...`,
      confirmButtonText: "OK",
      confirmButtonColor: "#E85A8D",
    }).then(() => {
      setActiveTab("frames");
    });
  };

  const handleEditType = (oldName) => {
    Swal.fire({
      title: "Sửa loại",
      input: "text",
      inputLabel: "Tên loại mới",
      inputValue: oldName,
      showCancelButton: true,
      confirmButtonText: "Lưu",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#E85A8D",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Vui lòng nhập tên loại!";
        }
        const types = getTypes();
        if (value.trim() !== oldName && types.includes(value.trim())) {
          return "Loại này đã tồn tại!";
        }
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newName = result.value.trim();
        const newConfig = { ...config };
        if (!newConfig.types) {
          newConfig.types = [];
        }

        // Cập nhật tên type trong danh sách
        const typeIndex = newConfig.types.indexOf(oldName);
        if (typeIndex >= 0) {
          newConfig.types[typeIndex] = newName;
        }

        // Cập nhật tất cả frames có type cũ
        if (newConfig.frames) {
          newConfig.frames = newConfig.frames.map((frame) => {
            if (frame.type === oldName) {
              return { ...frame, type: newName };
            }
            return frame;
          });
        }

        // Cập nhật defaultFrameMetadata nếu có
        if (
          newConfig.defaultFrameMetadata &&
          newConfig.defaultFrameMetadata[oldName]
        ) {
          newConfig.defaultFrameMetadata[newName] =
            newConfig.defaultFrameMetadata[oldName];
          delete newConfig.defaultFrameMetadata[oldName];
        }

        setConfig(newConfig);
        Swal.fire({
          icon: "success",
          title: "Đã cập nhật!",
          text: `Loại đã được đổi từ "${oldName}" sang "${newName}"`,
          confirmButtonText: "OK",
          confirmButtonColor: "#E85A8D",
        });
      }
    });
  };

  const handleDeleteType = (typeName) => {
    // Kiểm tra xem có frame nào đang dùng type này không
    const framesUsingType =
      config?.frames?.filter((f) => f.type === typeName) || [];

    if (framesUsingType.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Không thể xóa",
        html: `Loại "${typeName}" đang được sử dụng bởi ${framesUsingType.length} frame(s).<br/>Vui lòng đổi type của các frame này trước khi xóa.`,
        confirmButtonText: "Đã hiểu",
        confirmButtonColor: "#E85A8D",
      });
      return;
    }

    Swal.fire({
      title: "Xóa loại?",
      text: `Bạn có chắc chắn muốn xóa loại "${typeName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#E85A8D",
      cancelButtonColor: "#999",
    }).then((result) => {
      if (result.isConfirmed) {
        const newConfig = { ...config };
        if (newConfig.types) {
          newConfig.types = newConfig.types.filter((type) => type !== typeName);
        }
        // Xóa defaultFrameMetadata nếu có
        if (
          newConfig.defaultFrameMetadata &&
          newConfig.defaultFrameMetadata[typeName]
        ) {
          delete newConfig.defaultFrameMetadata[typeName];
        }
        setConfig(newConfig);
        Swal.fire({
          icon: "success",
          title: "Đã xóa!",
          text: `Loại "${typeName}" đã được xóa`,
          confirmButtonText: "OK",
          confirmButtonColor: "#E85A8D",
        });
      }
    });
  };

  const filteredFrames =
    config?.frames.filter((frame) => {
      const matchesSearch =
        frame.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        frame.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || frame.category === selectedCategory;
      return matchesSearch && matchesCategory;
    }) || [];

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>🔧 Admin Dashboard</h1>
          <p>Xin chào, {getAdminUsername()}</p>
        </div>
        <div className="admin-header-right">
          <button
            className="admin-btn admin-btn-upload"
            onClick={() => handleExportConfig(true)}
            title="Tự động upload lên server"
          >
            ☁️ Upload Lên Server
          </button>
          <button
            className="admin-btn admin-btn-export"
            onClick={() => handleExportConfig(false)}
            title="Tải file ZIP về máy"
          >
            📥 Tải ZIP
          </button>
          <button className="admin-btn admin-btn-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="admin-content">
        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "frames" ? "active" : ""}`}
            onClick={() => setActiveTab("frames")}
          >
            📷 Quản lý Frames
          </button>
          <button
            className={`admin-tab ${
              activeTab === "categories" ? "active" : ""
            }`}
            onClick={() => setActiveTab("categories")}
          >
            📂 Quản lý Danh mục & Loại
          </button>
          <button
            className={`admin-tab ${activeTab === "metadata" ? "active" : ""}`}
            onClick={() => setActiveTab("metadata")}
          >
            ⚙️ Metadata Settings
          </button>
        </div>

        {/* Frames Tab */}
        {activeTab === "frames" && (
          <>
            <div className="admin-toolbar">
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleAddFrame}
              >
                ➕ Thêm Frame Mới
              </button>
              <div className="admin-search">
                <input
                  type="text"
                  placeholder="Tìm kiếm frame..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="admin-filter">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">Tất cả danh mục</option>
                  {getCategories().map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-stats">
              <div className="admin-stat-card">
                <h3>Tổng số frame</h3>
                <p>{config?.frames.length || 0}</p>
              </div>
              <div className="admin-stat-card">
                <h3>Đang hiển thị</h3>
                <p>{filteredFrames.length}</p>
              </div>
            </div>

            {showAddForm && (
              <div
                className="admin-modal-overlay"
                onClick={() => setShowAddForm(false)}
              >
                <div
                  className="admin-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2>{editingFrame.id ? "Sửa Frame" : "Thêm Frame Mới"}</h2>
                  <div className="admin-form">
                    <div className="admin-form-group">
                      <label>ID</label>
                      <input
                        type="number"
                        value={editingFrame.id}
                        onChange={(e) =>
                          setEditingFrame({
                            ...editingFrame,
                            id: parseInt(e.target.value),
                          })
                        }
                        disabled={!!editingFrame.id}
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Tên Frame *</label>
                      <input
                        type="text"
                        value={editingFrame.name}
                        onChange={(e) =>
                          setEditingFrame({
                            ...editingFrame,
                            name: e.target.value,
                          })
                        }
                        placeholder="Ví dụ: Basic White"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label>Danh mục</label>
                      <select
                        value={editingFrame.category}
                        onChange={(e) =>
                          setEditingFrame({
                            ...editingFrame,
                            category: e.target.value,
                          })
                        }
                      >
                        {getCategories().map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label>Loại</label>
                      <select
                        value={editingFrame.type}
                        onChange={(e) =>
                          setEditingFrame({
                            ...editingFrame,
                            type: e.target.value,
                          })
                        }
                      >
                        {getTypes().map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group">
                      <label>Upload ảnh Frame</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="admin-file-input"
                      />
                      <small>
                        Chọn file ảnh frame (PNG, JPG). Đường dẫn sẽ tự động
                        được tạo.
                      </small>
                      {editingFrame &&
                        (() => {
                          // Tìm ảnh theo path
                          const framePath = editingFrame.path;
                          const imageData = frameImages.get(framePath);
                          return imageData ? (
                            <div className="admin-image-preview">
                              <img src={imageData.preview} alt="Preview" />
                              <p className="admin-preview-info">
                                {imageData.file.name} (
                                {(imageData.file.size / 1024).toFixed(1)} KB)
                              </p>
                            </div>
                          ) : null;
                        })()}
                    </div>
                    <div className="admin-form-group">
                      <label>Đường dẫn *</label>
                      <input
                        type="text"
                        value={editingFrame.path}
                        onChange={(e) =>
                          setEditingFrame({
                            ...editingFrame,
                            path: e.target.value,
                          })
                        }
                        placeholder="/frame/basic-white.png"
                      />
                      <small>
                        Đường dẫn bắt đầu bằng /frame/ (hoặc upload ảnh để tự
                        động tạo)
                      </small>
                    </div>
                    <div className="admin-form-actions">
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingFrame(null);
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={handleSaveFrame}
                      >
                        Lưu
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="admin-frames-grid">
              {filteredFrames.map((frame) => (
                <div key={frame.id} className="admin-frame-card">
                  <div className="admin-frame-preview">
                    <img
                      src={
                        frame.path.startsWith("/")
                          ? frame.path
                          : `/${frame.path}`
                      }
                      alt={frame.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                  <div className="admin-frame-info">
                    <h3>{frame.name}</h3>
                    <p>
                      <strong>ID:</strong> {frame.id}
                    </p>
                    <p>
                      <strong>Danh mục:</strong> {frame.category}
                    </p>
                    <p>
                      <strong>Loại:</strong> {frame.type}
                    </p>
                    <p>
                      <strong>Đường dẫn:</strong> {frame.path}
                    </p>
                  </div>
                  <div className="admin-frame-actions">
                    <button
                      className="admin-btn admin-btn-edit"
                      onClick={() => handleEditFrame(frame)}
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="admin-btn admin-btn-delete"
                      onClick={() => handleDeleteFrame(frame.id)}
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredFrames.length === 0 && (
              <div className="admin-empty">
                <p>Không tìm thấy frame nào</p>
              </div>
            )}
          </>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="admin-categories-section">
            <div className="admin-metadata-header">
              <h2>Quản lý Danh mục và Loại Frame</h2>
              <p>Thêm, sửa, xóa danh mục và loại frame</p>
            </div>

            {/* Categories Section */}
            <div className="admin-categories-grid">
              <div className="admin-category-section">
                <h3>📂 Danh mục (Categories)</h3>
                <div className="admin-add-item-form">
                  <input
                    type="text"
                    placeholder="Nhập tên danh mục mới..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddCategory();
                      }
                    }}
                    className="admin-input"
                  />
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleAddCategory}
                  >
                    ➕ Thêm Danh mục
                  </button>
                </div>
                <div className="admin-items-list">
                  {getCategories().map((category) => {
                    const framesCount =
                      config?.frames?.filter((f) => f.category === category)
                        .length || 0;
                    return (
                      <div key={category} className="admin-item-card">
                        <div className="admin-item-info">
                          <h4>{category}</h4>
                          <p>{framesCount} frame(s) đang sử dụng</p>
                        </div>
                        <div className="admin-item-actions">
                          <button
                            className="admin-btn admin-btn-edit"
                            onClick={() => handleEditCategory(category)}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            className="admin-btn admin-btn-delete"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={framesCount > 0}
                            title={
                              framesCount > 0
                                ? "Không thể xóa vì đang có frame sử dụng"
                                : "Xóa danh mục"
                            }
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Types Section */}
              <div className="admin-category-section">
                <h3>🏷️ Loại (Types)</h3>
                <div className="admin-add-item-form">
                  <input
                    type="text"
                    placeholder="Nhập tên loại mới..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddType();
                      }
                    }}
                    className="admin-input"
                  />
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={handleAddType}
                  >
                    ➕ Thêm Loại
                  </button>
                </div>
                <div className="admin-items-list">
                  {getTypes().map((type) => {
                    const framesCount =
                      config?.frames?.filter((f) => f.type === type).length ||
                      0;
                    return (
                      <div key={type} className="admin-item-card">
                        <div className="admin-item-info">
                          <h4>{type}</h4>
                          <p>{framesCount} frame(s) đang sử dụng</p>
                        </div>
                        <div className="admin-item-actions">
                          <button
                            className="admin-btn admin-btn-edit"
                            onClick={() => handleEditType(type)}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            className="admin-btn admin-btn-delete"
                            onClick={() => handleDeleteType(type)}
                            disabled={framesCount > 0}
                            title={
                              framesCount > 0
                                ? "Không thể xóa vì đang có frame sử dụng"
                                : "Xóa loại"
                            }
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Metadata Tab */}
        {activeTab === "metadata" && (
          <div className="admin-metadata-section">
            <div className="admin-metadata-header">
              <h2>Default Frame Metadata</h2>
              <p>Chỉnh sửa layout mặc định cho các loại frame (banv1, banv2)</p>
            </div>

            <div
              className="admin-metadata-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div></div>
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  Swal.fire({
                    title: "Thêm Default Frame Metadata",
                    input: "text",
                    inputLabel: "Tên loại frame mới",
                    inputPlaceholder: "Ví dụ: banv3",
                    showCancelButton: true,
                    confirmButtonText: "Thêm",
                    cancelButtonText: "Hủy",
                    confirmButtonColor: "#E85A8D",
                    inputValidator: (value) => {
                      if (!value || !value.trim()) {
                        return "Vui lòng nhập tên loại frame!";
                      }
                      const types = getTypes();
                      if (types.includes(value.trim())) {
                        return "Loại frame này đã tồn tại!";
                      }
                    },
                  }).then((result) => {
                    if (result.isConfirmed && result.value) {
                      const newType = result.value.trim();
                      const newConfig = { ...config };

                      // Lấy danh sách types hiện tại (từ config hoặc default)
                      const currentTypes = getTypes();
                      // Đảm bảo types được lưu vào config
                      if (!newConfig.types) {
                        newConfig.types = [...currentTypes];
                      }
                      // Thêm type mới nếu chưa có
                      if (!newConfig.types.includes(newType)) {
                        newConfig.types = [...newConfig.types, newType];
                      }

                      // Giữ lại defaultFrameMetadata cũ và thêm mới
                      if (!newConfig.defaultFrameMetadata) {
                        newConfig.defaultFrameMetadata = {};
                      }
                      // Giữ lại tất cả metadata cũ bằng cách spread
                      newConfig.defaultFrameMetadata = {
                        ...newConfig.defaultFrameMetadata,
                        [newType]: {
                          slots: [{ x: 6, y: 10, width: 88, height: 18.9 }],
                        },
                      };

                      setConfig(newConfig);

                      // Mở form chỉnh sửa
                      setEditingMetadata({
                        type: "default",
                        frameType: newType,
                        metadata: JSON.parse(
                          JSON.stringify(
                            newConfig.defaultFrameMetadata[newType]
                          )
                        ),
                      });
                      setShowMetadataForm(true);

                      Swal.fire({
                        icon: "success",
                        title: "Đã thêm!",
                        text: `Loại "${newType}" đã được thêm vào danh sách Types và Default Frame Metadata`,
                        confirmButtonText: "OK",
                        confirmButtonColor: "#E85A8D",
                      });
                    }
                  });
                }}
              >
                ➕ Thêm Default Metadata
              </button>
            </div>

            <div className="admin-metadata-grid">
              {getTypes().map((type) => {
                const defaultMeta = config?.defaultFrameMetadata?.[type] || {
                  slots: [],
                };
                return (
                  <div key={type} className="admin-metadata-card">
                    <h3>{type.toUpperCase()}</h3>
                    <div className="admin-metadata-slots">
                      <p>
                        <strong>Số slots:</strong>{" "}
                        {defaultMeta.slots?.length || 0}
                      </p>
                      {defaultMeta.slots && defaultMeta.slots.length > 0 && (
                        <div className="admin-slots-list">
                          {defaultMeta.slots.map((slot, idx) => (
                            <div key={idx} className="admin-slot-item">
                              Slot {idx + 1}: x={slot.x}, y={slot.y}, w=
                              {slot.width}, h={slot.height}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="admin-btn admin-btn-edit"
                        onClick={() => {
                          setEditingMetadata({
                            type: "default",
                            frameType: type,
                            metadata: JSON.parse(JSON.stringify(defaultMeta)),
                          });
                          setShowMetadataForm(true);
                        }}
                      >
                        ✏️ Chỉnh sửa
                      </button>
                      <button
                        className="admin-btn admin-btn-delete"
                        onClick={() => {
                          // Kiểm tra xem có frame nào đang dùng type này không
                          const framesUsingType =
                            config?.frames?.filter((f) => f.type === type) ||
                            [];

                          if (framesUsingType.length > 0) {
                            Swal.fire({
                              icon: "warning",
                              title: "Không thể xóa",
                              html: `Loại "${type}" đang được sử dụng bởi ${framesUsingType.length} frame(s).<br/>Vui lòng đổi type của các frame này trước khi xóa.`,
                              confirmButtonText: "Đã hiểu",
                              confirmButtonColor: "#E85A8D",
                            });
                            return;
                          }

                          Swal.fire({
                            title: "Xóa Default Metadata?",
                            text: `Bạn có chắc chắn muốn xóa Default Metadata của "${type}"? Loại này cũng sẽ bị xóa khỏi danh sách Types.`,
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Xóa",
                            cancelButtonText: "Hủy",
                            confirmButtonColor: "#E85A8D",
                            cancelButtonColor: "#999",
                          }).then((result) => {
                            if (result.isConfirmed) {
                              const newConfig = { ...config };

                              // Xóa khỏi types
                              if (newConfig.types) {
                                newConfig.types = newConfig.types.filter(
                                  (t) => t !== type
                                );
                              }

                              // Xóa defaultFrameMetadata
                              if (
                                newConfig.defaultFrameMetadata &&
                                newConfig.defaultFrameMetadata[type]
                              ) {
                                delete newConfig.defaultFrameMetadata[type];
                              }

                              setConfig(newConfig);
                              Swal.fire({
                                icon: "success",
                                title: "Đã xóa!",
                                text: `Default Metadata của "${type}" đã được xóa`,
                                confirmButtonText: "OK",
                                confirmButtonColor: "#E85A8D",
                              });
                            }
                          });
                        }}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata Edit Form */}
        {showMetadataForm && editingMetadata && (
          <div
            className="admin-modal-overlay"
            onClick={() => {
              setShowMetadataForm(false);
              setEditingMetadata(null);
            }}
          >
            <div
              className="admin-modal admin-metadata-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>
                {editingMetadata.type === "default"
                  ? `Chỉnh sửa Default Metadata - ${editingMetadata.frameType}`
                  : ""}
              </h2>
              <div className="admin-form">
                <div className="admin-form-group">
                  <label>Số lượng slots</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingMetadata.metadata.slots?.length || 0}
                    onChange={(e) => {
                      const slotCount = parseInt(e.target.value) || 0;
                      const currentSlots = editingMetadata.metadata.slots || [];
                      const newSlots = [];
                      for (let i = 0; i < slotCount; i++) {
                        if (currentSlots[i]) {
                          newSlots.push({ ...currentSlots[i] });
                        } else {
                          // Default slot values
                          newSlots.push({
                            x: 6,
                            y: 10 + i * 20,
                            width: 88,
                            height: 18.9,
                          });
                        }
                      }
                      setEditingMetadata({
                        ...editingMetadata,
                        metadata: {
                          ...editingMetadata.metadata,
                          slots: newSlots,
                        },
                      });
                    }}
                  />
                </div>

                {editingMetadata.metadata.slots &&
                  editingMetadata.metadata.slots.length > 0 && (
                    <div className="admin-slots-editor">
                      <h3>Chi tiết Slots</h3>
                      {editingMetadata.metadata.slots.map((slot, idx) => (
                        <div key={idx} className="admin-slot-editor">
                          <h4>Slot {idx + 1}</h4>
                          <div className="admin-slot-fields">
                            <div className="admin-form-group">
                              <label>X (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={slot.x}
                                onChange={(e) => {
                                  const newSlots = [
                                    ...editingMetadata.metadata.slots,
                                  ];
                                  newSlots[idx] = {
                                    ...newSlots[idx],
                                    x: parseFloat(e.target.value) || 0,
                                  };
                                  setEditingMetadata({
                                    ...editingMetadata,
                                    metadata: {
                                      ...editingMetadata.metadata,
                                      slots: newSlots,
                                    },
                                  });
                                }}
                              />
                            </div>
                            <div className="admin-form-group">
                              <label>Y (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={slot.y}
                                onChange={(e) => {
                                  const newSlots = [
                                    ...editingMetadata.metadata.slots,
                                  ];
                                  newSlots[idx] = {
                                    ...newSlots[idx],
                                    y: parseFloat(e.target.value) || 0,
                                  };
                                  setEditingMetadata({
                                    ...editingMetadata,
                                    metadata: {
                                      ...editingMetadata.metadata,
                                      slots: newSlots,
                                    },
                                  });
                                }}
                              />
                            </div>
                            <div className="admin-form-group">
                              <label>Width (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={slot.width}
                                onChange={(e) => {
                                  const newSlots = [
                                    ...editingMetadata.metadata.slots,
                                  ];
                                  newSlots[idx] = {
                                    ...newSlots[idx],
                                    width: parseFloat(e.target.value) || 0,
                                  };
                                  setEditingMetadata({
                                    ...editingMetadata,
                                    metadata: {
                                      ...editingMetadata.metadata,
                                      slots: newSlots,
                                    },
                                  });
                                }}
                              />
                            </div>
                            <div className="admin-form-group">
                              <label>Height (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={slot.height}
                                onChange={(e) => {
                                  const newSlots = [
                                    ...editingMetadata.metadata.slots,
                                  ];
                                  newSlots[idx] = {
                                    ...newSlots[idx],
                                    height: parseFloat(e.target.value) || 0,
                                  };
                                  setEditingMetadata({
                                    ...editingMetadata,
                                    metadata: {
                                      ...editingMetadata.metadata,
                                      slots: newSlots,
                                    },
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="admin-form-actions">
                  <button
                    className="admin-btn admin-btn-secondary"
                    onClick={() => {
                      setShowMetadataForm(false);
                      setEditingMetadata(null);
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => {
                      const newConfig = { ...config };
                      if (editingMetadata.type === "default") {
                        // Giữ lại defaultFrameMetadata cũ và cập nhật
                        if (!newConfig.defaultFrameMetadata) {
                          newConfig.defaultFrameMetadata = {};
                        }
                        newConfig.defaultFrameMetadata = {
                          ...newConfig.defaultFrameMetadata,
                          [editingMetadata.frameType]: editingMetadata.metadata,
                        };

                        // Lấy danh sách types hiện tại (từ config hoặc default)
                        const currentTypes = getTypes();
                        // Đảm bảo types được lưu vào config
                        if (!newConfig.types) {
                          newConfig.types = [...currentTypes];
                        }
                        // Đảm bảo type được thêm vào danh sách types
                        if (
                          !newConfig.types.includes(editingMetadata.frameType)
                        ) {
                          newConfig.types = [
                            ...newConfig.types,
                            editingMetadata.frameType,
                          ];
                        }
                      }
                      setConfig(newConfig);
                      setShowMetadataForm(false);
                      setEditingMetadata(null);
                      Swal.fire({
                        icon: "success",
                        title: "Đã lưu",
                        text: "Metadata đã được cập nhật (chưa lưu lên server). Nhấn 'Upload to Server' để lưu.",
                        confirmButtonText: "OK",
                        confirmButtonColor: "#E85A8D",
                      });
                    }}
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
