import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, isAuthenticated } from "../utils/auth";
import Swal from "sweetalert2";
import "./AdminLogin.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Nếu đã đăng nhập, redirect đến admin dashboard
    if (isAuthenticated()) {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (login(username, password)) {
      Swal.fire({
        icon: "success",
        title: "Đăng nhập thành công!",
        text: "Chào mừng bạn đến với trang quản trị",
        confirmButtonText: "Đi đến Dashboard",
        confirmButtonColor: "#E85A8D",
      }).then(() => {
        navigate("/admin", { replace: true });
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Đăng nhập thất bại",
        text: "Tên đăng nhập hoặc mật khẩu không đúng",
        confirmButtonText: "Thử lại",
        confirmButtonColor: "#E85A8D",
      });
    }

    setLoading(false);
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>🔐 Admin Login</h1>
          <p>SFotor - Trang Quản Trị</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="admin-login-footer">
          <a href="/" className="back-home-link">
            ← Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
