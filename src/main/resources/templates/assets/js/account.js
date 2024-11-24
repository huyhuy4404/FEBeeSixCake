var app = angular.module("myApp", ["ngRoute"]);

app.controller("LoginController", function ($scope, $http, $window, $timeout) {
  // Khởi tạo thông tin người dùng và trạng thái đăng nhập
  $scope.isLoggedIn = false;
  $scope.loggedInUser = null; // Biến lưu thông tin người dùng đăng nhập
  $scope.user = {
    idaccount: "",
    password: "",
  };
  $scope.loginError = ""; // Biến để lưu thông báo lỗi

  // Kiểm tra trạng thái đăng nhập từ localStorage
  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  }

  // Hàm cập nhật giao diện
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    if ($scope.isLoggedIn) {
      $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    } else {
      $scope.loggedInUser = null;
    }
  };

  $scope.login = function () {
    if (!$scope.isLoggedIn) {
      $scope.loginError = ""; // Reset thông báo lỗi
  
      // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
      $http
        .get("http://localhost:8080/beesixcake/api/account")
        .then(function (response) {
          $scope.accounts = response.data;
  
          // Tìm tài khoản dựa vào idaccount và password
          var foundAccount = $scope.accounts.find(
            (account) =>
              account.idaccount === $scope.user.idaccount &&
              account.password === $scope.user.password
          );
  
          if (foundAccount) {
            // Kiểm tra nếu tài khoản bị khóa (active = false)
            if (!foundAccount.active) {
              $scope.loginError =
                "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên!";
            } else {
              // Kiểm tra quyền truy cập dựa vào idrole
              if (foundAccount.idrole === 2) {
                // Quyền user (idrole = 2)
                $scope.loginSuccess = "Đăng nhập thành công!"; // Thông báo thành công
  
                // Lưu thông tin đăng nhập vào localStorage
                localStorage.setItem(
                  "loggedInUser",
                  JSON.stringify(foundAccount)
                );
  
                // Hiển thị thông báo và chờ 2 giây trước khi chuyển hướng
                $timeout(function () {
                  // Cập nhật giao diện
                  $scope.updateAccountMenu();
  
                  // Chuyển hướng về trang chính
                  $window.location.href = "index.html";
                }, 2000); // Chờ 2000ms (2 giây)
              } else if (foundAccount.idrole === 1) {
                // Quyền admin thường (idrole = 1) không được phép
                $scope.loginError =
                  "Bạn không có quyền đăng nhập vào hệ thống này!";
              } else {
                // Xử lý các vai trò khác (nếu có)
                $scope.loginError =
                  "Quyền truy cập không xác định. Vui lòng liên hệ quản trị viên!";
              }
            }
          } else {
            // Nếu tài khoản hoặc mật khẩu không chính xác
            $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
          }
        })
        .catch(function (error) {
          // Xử lý lỗi từ API
          $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
          console.error("Error:", error);
        });
    } else {
      alert("Bạn đã đăng nhập rồi.");
    }
  };
  
});
