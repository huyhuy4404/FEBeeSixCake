var app = angular.module('myApp', []);

// Controller cho chức năng đặt lại mật khẩu
var app = angular.module('myApp', []);

app.controller('ResetPasswordController', function($scope, $http, $window) {
    $scope.user = { email: '' };
    $scope.resetSuccess = '';
    $scope.resetError = '';
    $scope.isSubmitting = false;

    $scope.sendResetLink = function() {
        if ($scope.isSubmitting) {
            return;
        }

        // Kiểm tra tính hợp lệ của email
        if (!$scope.user.email) {
            $scope.resetError = 'Vui lòng nhập email!';
            return;
        }

        $scope.isSubmitting = true;

        $http.post('http://localhost:8080/beesixcake/api/account/reset-password', { email: $scope.user.email })
            .then(function(response) {
                // Giả sử server trả về { message: "Liên kết đã được gửi đến email của bạn." }
                $scope.resetSuccess = response.data.message;
                $scope.resetError = '';
                // Chuyển hướng đến trang OTP (nếu cần)
                // $window.location.href = "http://127.0.0.1:5500/src/main/resources/templates/assets/opt.html";
            })
            .catch(function(error) {
                if (error.data && error.data.message) {
                    $scope.resetError = error.data.message; // Hiển thị thông điệp lỗi từ server
                } else {
                    $scope.resetError = "Có lỗi xảy ra, vui lòng thử lại.";
                }
                $scope.resetSuccess = '';
            })
            .finally(function() {
                $scope.isSubmitting = false;
            });
    };
});



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
app.controller('ChangePasswordController', function($scope, $http, $window) {
    $scope.newPassword = '';
    $scope.confirmPassword = '';
    $scope.successMessage = '';
    $scope.errorMessage = '';

    $scope.changePassword = function() {
        if ($scope.newPassword !== $scope.confirmPassword) {
            $scope.errorMessage = 'Mật khẩu xác nhận không khớp!';
            return;
        }

        // Gửi yêu cầu đổi mật khẩu đến server
        $http.post('http://localhost:8080/beesixcake/api/account/change-password', { password: $scope.newPassword })
        .then(function(response) {
            if (response.data.success) {
                $scope.successMessage = 'Mật khẩu đã được đổi thành công!';
                $scope.errorMessage = '';
                // Chuyển hướng có thể đến trang đăng nhập hoặc trang khác nếu cần
                $window.location.href = "login.html"; // Thay đổi đường dẫn nếu cần
            } else {
                $scope.errorMessage = 'Có lỗi xảy ra, vui lòng thử lại.';
                $scope.successMessage = '';
            }
        })
        .catch(function(error) {
            $scope.errorMessage = 'Có lỗi xảy ra, vui lòng thử lại.';
            $scope.successMessage = '';
        });
    };
});