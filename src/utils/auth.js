// Utility để quản lý authentication cho admin

const ADMIN_USERNAME = "sondinhson11";
const ADMIN_PASSWORD = "As121202@";

export function login(username, password) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    sessionStorage.setItem("admin_authenticated", "true");
    sessionStorage.setItem("admin_username", username);
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem("admin_authenticated");
  sessionStorage.removeItem("admin_username");
}

export function isAuthenticated() {
  return sessionStorage.getItem("admin_authenticated") === "true";
}

export function getAdminUsername() {
  return sessionStorage.getItem("admin_username") || "";
}

export function getAdminPassword() {
  // Trả về password từ constant (không lưu trong storage vì bảo mật)
  return "As121202@";
}
