import { Component } from "react";
import Swal from "sweetalert2";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);

    // Hiển thị thông báo lỗi thân thiện
    Swal.fire({
      icon: "error",
      title: "Đã xảy ra lỗi",
      text: "Ứng dụng gặp sự cố. Vui lòng tải lại trang.",
      confirmButtonText: "Tải lại trang",
      confirmButtonColor: "#E85A8D",
      allowOutsideClick: false,
    }).then(() => {
      window.location.reload();
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "linear-gradient(135deg, #F5A8E8 0%, #E8B0D8 100%)",
            color: "#7A3D6A",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</h1>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            Đã xảy ra lỗi
          </h2>
          <p style={{ marginBottom: "2rem" }}>
            Ứng dụng gặp sự cố. Vui lòng tải lại trang.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.8rem 2rem",
              fontSize: "1rem",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #E85A8D 0%, #E87FA3 100%)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(232, 90, 141, 0.3)",
            }}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
