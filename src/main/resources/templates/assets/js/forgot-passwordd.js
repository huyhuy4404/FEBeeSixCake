var app = angular.module('myApp', []);

// Controller cho chức năng đặt lại mật khẩu





// Controller cho chức năng kiểm tra đăng nhập
app.controller('CheckLogin', function($scope, $http, $window) {
    // Khởi tạo thông tin người dùng và trạng thái đăng nhập
    $scope.isLoggedIn = false;

    // Kiểm tra trạng thái đăng nhập từ localStorage
    if (localStorage.getItem("loggedInUser")) {
        $scope.isLoggedIn = true;
        $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    } else {
        // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
        if ($window.location.pathname !== "/login.html") {
            $window.location.href = "login.html"; // Chuyển hướng đến trang đăng nhập
        }
    }

    // Hàm cập nhật giao diện
    $scope.updateAccountMenu = function() {
        $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    };

    // Phương thức đăng xuất
    $scope.logout = function() {
        localStorage.removeItem("loggedInUser");
        $scope.isLoggedIn = false;
        $scope.loggedInUser = null;
        $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
});

// Controller cho chức năng đổi mật khẩu
app.controller('ResetPasswordController', function($scope, $http) {
    $scope.user = {
        email: ''
    };
    $scope.resetError = '';
    $scope.resetSuccess = '';
    $scope.isSubmitting = false;

    // Function to send reset link
    $scope.sendResetLink = function() {
        $scope.resetError = '';
        $scope.resetSuccess = '';
        $scope.isSubmitting = true;

        // Gửi yêu cầu POST để yêu cầu đặt lại mật khẩu
        $http.post('http://localhost:8080/api/accounts/forgot-password', { email: $scope.user.email })
            .then(function(response) {
                // Nhận thông báo thành công
                $scope.resetSuccess = response.data; // Giả sử server trả về thông báo thành công
                $scope.isSubmitting = false; // Đặt lại trạng thái submitting
            })
            .catch(function(error) {
                // Xử lý phản hồi lỗi
                if (error.data && error.data.error) {
                    $scope.resetError = error.data.error; // Lấy thông báo lỗi từ server
                } else if (error.status === 400) {
                    $scope.resetError = "Email không hợp lệ."; // Thông báo cho người dùng
                } else {
                    $scope.resetError = "Có lỗi xảy ra, vui lòng thử lại."; // Thông báo lỗi chung
                }
                $scope.isSubmitting = false; // Đặt lại trạng thái submitting
            });
    };
});