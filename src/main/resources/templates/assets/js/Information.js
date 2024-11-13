var app = angular.module('myApp', []);
<<<<<<< HEAD
app.controller("CheckLogin", function ($scope, $http, $window) {
=======
app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
>>>>>>> 25a6119be2d6279d4d3c00b3b5cf72d75d00ec3f
    // Khởi tạo thông tin người dùng và trạng thái đăng nhập
    $scope.isLoggedIn = false;
    $scope.user = {
      idaccount: "",
      password: "",
    };
    $scope.loginError = ""; // Biến để lưu thông báo lỗi
  
    // Kiểm tra trạng thái đăng nhập từ localStorage
    if (localStorage.getItem("loggedInUser")) {
      $scope.isLoggedIn = true;
      $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    } else {
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
      $window.location.href = "login.html"; // Đường dẫn đến trang đăng nhập
    }
  
    // Hàm cập nhật giao diện
    $scope.updateAccountMenu = function () {
      $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    };
  
    // Phương thức đăng nhập
    $scope.login = function () {
      if (!$scope.isLoggedIn) {
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
              if (foundAccount.admin) {
                // Nếu tài khoản là admin
                $scope.loginError = "Bạn không có quyền truy cập!";
              } else {
                // Đăng nhập thành công
                $scope.loginSuccess = "Đăng nhập thành công!";
                // Lưu thông tin đăng nhập vào localStorage
                localStorage.setItem(
                  "loggedInUser",
                  JSON.stringify(foundAccount)
                );
  
                // Cập nhật giao diện
                $scope.updateAccountMenu();
  
                // Chuyển hướng về trang chính ngay lập tức
                $window.location.href = "index.html"; // Hoặc sử dụng $timeout nếu cần delay
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
      } else {
        alert("Bạn đã đăng nhập rồi.");
      }
    };
  
    // Phương thức đăng xuất
    $scope.logout = function () {
      localStorage.removeItem("loggedInUser");
      $scope.isLoggedIn = false;
      $scope.loggedInUser = null;
      $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
  });
<<<<<<< HEAD
  
=======
>>>>>>> 25a6119be2d6279d4d3c00b3b5cf72d75d00ec3f
app.controller('Controller', function($scope, $http) {
    // Hàm để lấy thông tin tài khoản đã đăng nhập từ localStorage
    $scope.getUserInfo = function() {
        var loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            // Parse lại thông tin người dùng đã đăng nhập từ localStorage
            $scope.user = JSON.parse(loggedInUser);
        } else {
            // Nếu không có thông tin đăng nhập trong localStorage
            $scope.user = null;
        }
    };

    // Hàm cập nhật thông tin người dùng
    $scope.updateUserProfile = function () {
        if (!$scope.user.phonenumber || !$scope.user.idaccount) {
            console.error('Dữ liệu không hợp lệ!');
            return;
        }
        // Gửi yêu cầu PUT kèm theo idaccount trong URL
        $http.put('http://localhost:8080/beesixcake/api/account/' + $scope.user.idaccount, $scope.user)
            .then(function (response) {
                console.log('Thông tin cập nhật thành công', response);
                $scope.updateSuccess = true; // Hiển thị thông báo cập nhật thành công
    
                // Cập nhật lại localStorage với dữ liệu mới
                localStorage.setItem('loggedInUser', JSON.stringify($scope.user));
    
                // Sau khi cập nhật thành công, có thể tải lại trang hoặc lấy lại dữ liệu
                // location.reload(); // Tùy chọn, bạn có thể reload trang để cập nhật dữ liệu
            })
            .catch(function (error) {
                console.error('Lỗi khi cập nhật thông tin: ', error);
                $scope.updateSuccess = false;
            });
    };
    

    // Gọi hàm để lấy thông tin người dùng khi trang tải
    $scope.getUserInfo();
});
