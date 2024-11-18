var app = angular.module("myApp", ["ngRoute"]);
     
app.controller("LoginController", function ($scope, $http, $window, $timeout) {
  // Khởi tạo thông tin người dùng và trạng thái đăng nhập
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
  };

  // Phương thức đăng nhập
  $scope.login = function () {

    $scope.loginError = ""; // Reset thông báo lỗi

    // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
    $http
      .get("http://localhost:8080/beesixcake/api/account")
      .then(function (response) {
        $scope.accounts = response.data;
        var foundAccount = $scope.accounts.find(
          (account) =>
            account.idaccount === $scope.user.idaccount &&
            account.password === $scope.user.password
        );

        if (foundAccount) {
          // Kiểm tra quyền truy cập dựa trên idrole
          if (foundAccount.idrole === 2) {
            // Nếu idrole = 2, không cho phép đăng nhập
            $scope.loginError = "Bạn không có quyền đăng nhập!";
          } else if (foundAccount.idrole === 1) {
            // Nếu idrole = 1 (admin), cho phép đăng nhập
            $scope.loginSuccess = "Đăng nhập thành công!";
            // Lưu thông tin đăng nhập vào localStorage
            localStorage.setItem("loggedInUser", JSON.stringify(foundAccount));

            // Cập nhật giao diện
            $scope.updateAccountMenu();

            // Chuyển hướng về trang chính ngay lập tức
            $window.location.href = "index.html"; // Hoặc sử dụng $timeout nếu cần delay
          } else {
            // Nếu idrole không phải 1 hoặc 2, xử lý trường hợp khác
            $scope.loginError = "Không có quyền truy cập!";
          }
        } else {
          // Nếu tài khoản không đúng hoặc mật khẩu không khớp
          $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
        }
      })
      .catch(function (error) {
        // Xử lý lỗi từ API
        $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
        console.error("Error:", error);
      });
  };

  // Phương thức đăng xuất
  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
  };
});
